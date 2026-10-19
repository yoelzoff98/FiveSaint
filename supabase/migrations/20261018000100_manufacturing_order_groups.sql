BEGIN;
ALTER TABLE public.manufacturing_orders ADD COLUMN IF NOT EXISTS commercial_items_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Preserve grouped technical references on a revision. Existing documents are untouched.
CREATE OR REPLACE FUNCTION public.guard_manufacturing_item_balance() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE available integer;
BEGIN
  IF NEW.parent_manufacturing_order_id IS NOT NULL THEN
    SELECT commercial_items_snapshot INTO NEW.commercial_items_snapshot
    FROM public.manufacturing_orders WHERE id=NEW.parent_manufacturing_order_id;
    RETURN NEW;
  END IF;
  SELECT quantity-COALESCE(manufacturing_issued_quantity,0) INTO available
  FROM public.order_items WHERE id=NEW.order_item_id FOR UPDATE;
  IF NEW.quantity > available THEN RAISE EXCEPTION 'CANTIDAD EXCEDIDA: saldo ya incluido en fabricación.'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS manufacturing_item_balance ON public.manufacturing_orders;
CREATE TRIGGER manufacturing_item_balance BEFORE INSERT ON public.manufacturing_orders
FOR EACH ROW EXECUTE FUNCTION public.guard_manufacturing_item_balance();

-- Keep the cached balance correct for both old single-line RPCs and grouped emissions.
CREATE OR REPLACE FUNCTION public.refresh_manufacturing_item_counter() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 SELECT COALESCE(SUM(CASE WHEN jsonb_array_length(m.commercial_items_snapshot)>0 THEN
   COALESCE((SELECT SUM((line->>'quantity')::integer) FROM jsonb_array_elements(m.commercial_items_snapshot) line WHERE (line->>'order_item_id')::uuid=NEW.id),0)
   WHEN m.order_item_id=NEW.id THEN m.quantity ELSE 0 END),0)
 INTO NEW.manufacturing_issued_quantity FROM manufacturing_orders m
 WHERE m.order_id=NEW.order_id AND m.status IN ('issued','in_production','completed');
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS refresh_manufacturing_item_counter ON public.order_items;
CREATE TRIGGER refresh_manufacturing_item_counter BEFORE UPDATE OF manufacturing_issued_quantity ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.refresh_manufacturing_item_counter();

CREATE OR REPLACE FUNCTION public.issue_manufacturing_group_transactional(
 p_user_id uuid,p_order_id uuid,p_primary_item_id uuid,p_lines jsonb,
 p_configuration jsonb,p_instructions jsonb,p_supplies jsonb,p_notes text,p_key text,p_hash text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE rec record; line jsonb; item record; bom record; result jsonb; primary_line jsonb; mfg_id uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM admin_users WHERE user_id=p_user_id AND is_active)
 AND NOT EXISTS(SELECT 1 FROM administration_users WHERE user_id=p_user_id AND is_active)
 THEN RAISE EXCEPTION 'ACCESO DENEGADO'; END IF;
 IF p_key IS NULL OR p_key='' OR p_hash IS NULL THEN RAISE EXCEPTION 'Se requiere clave de idempotencia.'; END IF;
 INSERT INTO idempotency_records(user_id,operation_type,idempotency_key,request_hash,status)
 VALUES(p_user_id,'issue_manufacturing_group',p_key,p_hash,'processing')
 ON CONFLICT(user_id,operation_type,idempotency_key) DO NOTHING RETURNING * INTO rec;
 IF NOT FOUND THEN
   SELECT * INTO rec FROM idempotency_records WHERE user_id=p_user_id AND operation_type='issue_manufacturing_group' AND idempotency_key=p_key FOR UPDATE;
   IF rec.request_hash IS DISTINCT FROM p_hash THEN RAISE EXCEPTION 'Conflicto de idempotencia'; END IF;
   IF rec.status='completed' THEN RETURN rec.response_body; END IF;
   RAISE EXCEPTION 'Emisión en proceso';
 END IF;
 PERFORM 1 FROM orders WHERE id=p_order_id AND status<>'cancelled' AND COALESCE(sale_channel,'direct')='direct' AND COALESCE(order_type,'factory')<>'distributor_sale' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pedido no fabricable'; END IF;
 IF jsonb_typeof(p_lines) IS DISTINCT FROM 'array' OR jsonb_array_length(p_lines)=0 THEN RAISE EXCEPTION 'Pedido sin productos'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(p_lines))<>(SELECT count(DISTINCT value->>'order_item_id') FROM jsonb_array_elements(p_lines)) THEN RAISE EXCEPTION 'Renglones duplicados'; END IF;
 -- Same lock hierarchy as the original emitter: order then its items.
 PERFORM 1 FROM order_items WHERE order_id=p_order_id ORDER BY id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM order_items oi WHERE oi.order_id=p_order_id AND oi.quantity>COALESCE(oi.manufacturing_issued_quantity,0)
 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_lines) l WHERE (l->>'order_item_id')::uuid=oi.id)) THEN RAISE EXCEPTION 'Incluí todos los renglones pendientes del pedido en la misma orden'; END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
   SELECT * INTO item FROM order_items WHERE id=(line->>'order_item_id')::uuid AND order_id=p_order_id;
   IF NOT FOUND THEN RAISE EXCEPTION 'Renglón ajeno al pedido'; END IF;
   IF item.configuration_status IS DISTINCT FROM 'approved' THEN RAISE EXCEPTION 'Revisión técnica pendiente: %',item.product_name; END IF;
   IF (line->>'quantity')::integer IS NULL OR (line->>'quantity')::integer<=0 OR (line->>'quantity')::integer>item.quantity-COALESCE(item.manufacturing_issued_quantity,0) THEN RAISE EXCEPTION 'CANTIDAD EXCEDIDA para %',item.product_name; END IF;
   SELECT * INTO bom FROM product_compositions WHERE id=(line->>'bom_id')::uuid AND status='published';
   IF NOT FOUND THEN RAISE EXCEPTION 'Cada producto/adicional requiere una composición publicada'; END IF;
   IF item.product_id IS NOT NULL AND item.product_id IS DISTINCT FROM bom.product_id THEN RAISE EXCEPTION 'Composición incompatible'; END IF;
   IF item.variant_id IS NOT NULL AND bom.variant_id IS NOT NULL AND item.variant_id IS DISTINCT FROM bom.variant_id THEN RAISE EXCEPTION 'Variante incompatible'; END IF;
   IF line->'configuration' IS DISTINCT FROM COALESCE(item.configuration,'{}'::jsonb) THEN RAISE EXCEPTION 'La configuración cambió. Recargá el pedido'; END IF;
   IF item.id=p_primary_item_id THEN primary_line:=line; END IF;
 END LOOP;
 IF primary_line IS NULL THEN RAISE EXCEPTION 'Seleccioná el producto principal'; END IF;
 result:=issue_manufacturing_order_transactional(p_user_id,p_order_id,p_primary_item_id,
 (primary_line->>'quantity')::integer,(primary_line->>'bom_id')::uuid,p_configuration,p_instructions,p_supplies,p_notes,NULL,NULL);
 mfg_id:=(result->>'manufacturingOrderId')::uuid;
 UPDATE manufacturing_orders SET commercial_items_snapshot=p_lines WHERE id=mfg_id;
 FOR line IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
   IF (line->>'order_item_id')::uuid<>p_primary_item_id THEN
     UPDATE order_items SET manufacturing_issued_quantity=COALESCE(manufacturing_issued_quantity,0)+(line->>'quantity')::integer WHERE id=(line->>'order_item_id')::uuid;
   END IF;
 END LOOP;
 UPDATE idempotency_records SET status='completed',response_body=result,updated_at=now() WHERE id=rec.id;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.guard_manufacturing_item_balance() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.refresh_manufacturing_item_counter() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.issue_manufacturing_group_transactional(uuid,uuid,uuid,jsonb,jsonb,jsonb,jsonb,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.issue_manufacturing_group_transactional(uuid,uuid,uuid,jsonb,jsonb,jsonb,jsonb,text,text,text) TO service_role;
COMMIT;
