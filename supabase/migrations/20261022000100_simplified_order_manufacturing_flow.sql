BEGIN;

-- Additive behaviour only: no rewriting of orders, quotes, balances or old snapshots.
CREATE OR REPLACE FUNCTION public.guard_order_production_acceptance() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.status IN ('processing','delivered') AND NEW.commercial_approval_status NOT IN ('approved','legacy') THEN
  RAISE EXCEPTION 'Pedido pendiente de aceptación administrativa';
 END IF;
 IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('processing','delivered')
 AND NEW.commercial_approval_status='approved' AND NEW.sale_channel='direct'
 AND NOT EXISTS(SELECT 1 FROM manufacturing_orders WHERE order_id=NEW.id AND status IN ('issued','in_production','completed')) THEN
  RAISE EXCEPTION 'Primero emití la orden de fabricación desde la ficha del pedido';
 END IF;
 RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.guard_manufacturing_readiness() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE o record; i record; recipe record;
BEGIN
 -- A revision preserves the already-issued snapshot; it is not a new allocation.
 IF NEW.parent_manufacturing_order_id IS NOT NULL THEN RETURN NEW; END IF;
 SELECT * INTO o FROM orders WHERE id=NEW.order_id;
 IF o.status NOT IN ('pending','processing') OR o.sale_channel IS DISTINCT FROM 'direct'
 OR o.order_type='distributor_sale' OR o.distributor_id IS NOT NULL THEN
  RAISE EXCEPTION 'Solo los pedidos directos vigentes admiten fabricación';
 END IF;
 SELECT * INTO i FROM order_items WHERE id=NEW.order_item_id AND order_id=NEW.order_id;
 SELECT * INTO recipe FROM product_compositions WHERE id=NEW.bom_id;
 IF i.product_id IS NULL OR i.product_id IS DISTINCT FROM recipe.product_id THEN
  RAISE EXCEPTION 'Identificá el producto técnico y su receta compatible antes de emitir';
 END IF;
 IF recipe.variant_id IS NOT NULL AND recipe.variant_id IS DISTINCT FROM i.variant_id THEN
  RAISE EXCEPTION 'La receta no corresponde a la variante elegida';
 END IF;
 IF recipe.status IS DISTINCT FROM 'published' OR i.configuration_status IS DISTINCT FROM 'approved' THEN
  RAISE EXCEPTION 'La receta y la configuración deben estar aprobadas';
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_manufacturing_readiness ON public.manufacturing_orders;
CREATE TRIGGER guard_manufacturing_readiness BEFORE INSERT ON public.manufacturing_orders
FOR EACH ROW EXECUTE FUNCTION public.guard_manufacturing_readiness();

-- One transaction: optional acceptance, explicit technical identification/review,
-- grouped issuance, production status and audit. Any failure rolls everything back.
CREATE OR REPLACE FUNCTION public.prepare_and_issue_order(
 p_user_id uuid,p_request_id uuid,p_order_id uuid,p_primary_source_id uuid,
 p_lines jsonb,p_supplies jsonb,p_instructions jsonb,p_notes text,p_key text,p_hash text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE request record; o record; item record; recipe record; line jsonb;
 actor text; record_id uuid; budget uuid; order_id uuid; item_id uuid; primary_id uuid;
 group_lines jsonb:='[]'::jsonb; result jsonb; existing record; pending_count integer;
BEGIN
 SELECT full_name INTO actor FROM admin_users WHERE user_id=p_user_id AND is_active;
 IF NOT FOUND THEN
  SELECT full_name INTO actor FROM administration_users WHERE user_id=p_user_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACCESO DENEGADO'; END IF;
 END IF;
 IF (p_request_id IS NULL)=(p_order_id IS NULL) THEN RAISE EXCEPTION 'Indicá el pedido o la solicitud'; END IF;
 IF NULLIF(p_key,'') IS NULL OR NULLIF(p_hash,'') IS NULL THEN RAISE EXCEPTION 'Clave de idempotencia obligatoria'; END IF;
 IF char_length(COALESCE(p_notes,''))>350 OR jsonb_typeof(p_lines) IS DISTINCT FROM 'array'
 OR jsonb_array_length(p_lines) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Contenido de emisión inválido'; END IF;
 IF jsonb_typeof(p_supplies) IS DISTINCT FROM 'array' OR jsonb_array_length(p_supplies) NOT BETWEEN 1 AND 16
 OR jsonb_typeof(p_instructions) IS DISTINCT FROM 'array' OR jsonb_array_length(p_instructions)>6 THEN
  RAISE EXCEPTION 'La OF debe incluir sus materiales y caber en una hoja A4';
 END IF;
 INSERT INTO idempotency_records(user_id,operation_type,idempotency_key,request_hash,status)
 VALUES(p_user_id,'prepare_and_issue',p_key,p_hash,'processing')
 ON CONFLICT(user_id,operation_type,idempotency_key) DO NOTHING RETURNING id INTO record_id;
 IF record_id IS NULL THEN
  SELECT * INTO existing FROM idempotency_records WHERE user_id=p_user_id AND operation_type='prepare_and_issue' AND idempotency_key=p_key FOR UPDATE;
  IF existing.request_hash IS DISTINCT FROM p_hash THEN RAISE EXCEPTION 'Conflicto de idempotencia'; END IF;
  IF existing.status='completed' THEN RETURN existing.response_body; END IF;
  RAISE EXCEPTION 'Emisión en proceso';
 END IF;
 IF p_request_id IS NOT NULL THEN
  SELECT budget_id INTO budget FROM order_requests WHERE id=p_request_id;
 ELSE
  SELECT budget_id INTO budget FROM orders WHERE id=p_order_id;
 END IF;
 -- Same hierarchy as commercial conversion/cancellation: budget, budget lines, order, order lines.
 PERFORM 1 FROM budgets WHERE id=budget FOR UPDATE;
 PERFORM 1 FROM budget_items WHERE budget_id=budget ORDER BY id FOR UPDATE;
 IF p_request_id IS NOT NULL THEN
  SELECT * INTO request FROM order_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud inexistente'; END IF;
  IF request.status NOT IN ('pending','approved') THEN RAISE EXCEPTION 'Solicitud no disponible'; END IF;
  result:=decide_order_request(p_user_id,p_request_id,'approved',NULL);
  order_id:=(result->>'order_id')::uuid;
 ELSE order_id:=p_order_id;
 END IF;
 SELECT * INTO o FROM orders WHERE id=order_id FOR UPDATE;
 IF NOT FOUND OR o.status NOT IN ('pending','processing') OR o.sale_channel IS DISTINCT FROM 'direct'
 OR o.commercial_approval_status NOT IN ('approved','legacy') OR o.distributor_id IS NOT NULL THEN
  RAISE EXCEPTION 'Pedido no fabricable';
 END IF;
 PERFORM 1 FROM order_items WHERE order_items.order_id=o.id ORDER BY id FOR UPDATE;
 SELECT count(*) INTO pending_count FROM order_items WHERE order_items.order_id=o.id AND quantity>COALESCE(manufacturing_issued_quantity,0);
 IF pending_count<>jsonb_array_length(p_lines)
 OR (SELECT count(DISTINCT value->>'source_id') FROM jsonb_array_elements(p_lines))<>jsonb_array_length(p_lines) THEN
  RAISE EXCEPTION 'Incluí todos los renglones pendientes del pedido una sola vez';
 END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
  IF p_request_id IS NOT NULL THEN
   SELECT * INTO item FROM order_items WHERE order_items.order_id=o.id AND budget_item_id=(line->>'source_id')::uuid;
  ELSE
   SELECT * INTO item FROM order_items WHERE order_items.order_id=o.id AND id=(line->>'source_id')::uuid;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Renglón ajeno al pedido'; END IF;
  item_id:=item.id;
  IF (line->>'quantity')::integer IS NULL OR (line->>'quantity')::integer<=0
  OR (line->>'quantity')::integer>item.quantity-COALESCE(item.manufacturing_issued_quantity,0) THEN RAISE EXCEPTION 'Saldo insuficiente para fabricar'; END IF;
  IF COALESCE(item.configuration,'{}'::jsonb) IS DISTINCT FROM line->'expected_configuration'
  OR item.product_id IS DISTINCT FROM (line->>'expected_product_id')::uuid
  OR item.variant_id IS DISTINCT FROM (line->>'expected_variant_id')::uuid THEN
   RAISE EXCEPTION 'La preparación cambió. Recargá el pedido';
  END IF;
  IF item.product_id IS NOT NULL AND (item.product_id IS DISTINCT FROM (line->>'product_id')::uuid
  OR item.variant_id IS DISTINCT FROM (line->>'variant_id')::uuid) THEN RAISE EXCEPTION 'El producto ya está identificado'; END IF;
  IF NOT EXISTS(SELECT 1 FROM products WHERE id=(line->>'product_id')::uuid AND is_active) THEN RAISE EXCEPTION 'Elegí un producto técnico activo'; END IF;
  IF (line->>'variant_id') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM product_variants WHERE id=(line->>'variant_id')::uuid AND product_id=(line->>'product_id')::uuid AND is_active) THEN RAISE EXCEPTION 'Variante ajena al producto'; END IF;
  SELECT * INTO recipe FROM product_compositions WHERE id=(line->>'bom_id')::uuid FOR SHARE;
  IF NOT FOUND OR recipe.status<>'published' OR recipe.product_id IS DISTINCT FROM (line->>'product_id')::uuid
  OR (recipe.variant_id IS NOT NULL AND recipe.variant_id IS DISTINCT FROM (line->>'variant_id')::uuid) THEN RAISE EXCEPTION 'Falta una receta publicada compatible'; END IF;
  IF recipe.updated_at IS DISTINCT FROM (line->>'recipe_updated_at')::timestamptz THEN RAISE EXCEPTION 'La receta cambió. Recargá el pedido'; END IF;
  IF NOT EXISTS(SELECT 1 FROM composition_items WHERE composition_id=recipe.id)
  OR EXISTS(SELECT 1 FROM composition_items ci JOIN supplies s ON s.id=ci.supply_id WHERE ci.composition_id=recipe.id AND NOT s.is_active) THEN RAISE EXCEPTION 'La receta debe tener componentes activos'; END IF;
  UPDATE order_items SET product_id=(line->>'product_id')::uuid,variant_id=(line->>'variant_id')::uuid,
   configuration=line->'configuration',configuration_status='approved',configuration_reviewed_by=p_user_id,
   configuration_reviewed_at=now(),configuration_review_notes='Revisión confirmada al emitir la orden de fabricación'
  WHERE id=item_id;
  IF (line->>'source_id')::uuid=p_primary_source_id THEN primary_id:=item_id; END IF;
  group_lines:=group_lines||jsonb_build_array(jsonb_build_object('order_item_id',item_id,'quantity',(line->>'quantity')::integer,
   'bom_id',recipe.id,'product_name',item.product_name,'variant_name',item.variant_name,'configuration',line->'configuration'));
 END LOOP;
 IF primary_id IS NULL THEN RAISE EXCEPTION 'Seleccioná el producto principal'; END IF;
 result:=issue_manufacturing_group_transactional(p_user_id,o.id,primary_id,group_lines,
  (SELECT value->'configuration' FROM jsonb_array_elements(group_lines) WHERE (value->>'order_item_id')::uuid=primary_id),
  p_instructions,p_supplies,p_notes,'workspace-'||p_key,p_hash);
 INSERT INTO client_notes(client_id,seller_id,budget_id,order_id,note_type,content)
 VALUES(o.client_id,o.seller_id,o.budget_id,o.id,'order_status_change','Orden de fabricación '||(result->>'orderNumber')||' emitida por '||COALESCE(actor,'Administración'));
 UPDATE orders SET status_updated_by_name=COALESCE(actor,'Administración') WHERE id=o.id;
 UPDATE idempotency_records SET status='completed',response_body=result,updated_at=now() WHERE id=record_id;
 RETURN result;
END; $$;

REVOKE ALL ON FUNCTION public.guard_manufacturing_readiness() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.prepare_and_issue_order(uuid,uuid,uuid,uuid,jsonb,jsonb,jsonb,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_and_issue_order(uuid,uuid,uuid,uuid,jsonb,jsonb,jsonb,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.set_order_status_audited(p_user_id uuid,p_order_id uuid,p_expected text,p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o record; actor text; budget uuid;
BEGIN
 SELECT full_name INTO actor FROM admin_users WHERE user_id=p_user_id AND is_active;
 IF NOT FOUND THEN SELECT full_name INTO actor FROM administration_users WHERE user_id=p_user_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACCESO DENEGADO'; END IF;
 END IF;
 SELECT budget_id INTO budget FROM orders WHERE id=p_order_id;
 PERFORM 1 FROM budgets WHERE id=budget FOR UPDATE;
 SELECT * INTO o FROM orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pedido inexistente'; END IF;
 IF p_status NOT IN ('processing','delivered') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
 IF o.status=p_status THEN RETURN to_jsonb(o); END IF;
 IF o.status IS DISTINCT FROM p_expected OR NOT ((o.status='pending' AND p_status='processing') OR (o.status='processing' AND p_status='delivered')) THEN
  RAISE EXCEPTION 'El pedido cambió o la transición no está permitida';
 END IF;
 UPDATE orders SET status=p_status,status_updated_at=now(),status_updated_by=p_user_id,status_updated_by_name=actor,updated_at=now()
 WHERE id=o.id RETURNING * INTO o;
 INSERT INTO client_notes(client_id,seller_id,budget_id,order_id,note_type,content)
 VALUES(o.client_id,o.seller_id,o.budget_id,o.id,'order_status_change','Estado de pedido N° '||o.order_number||' actualizado a '||p_status||' por '||COALESCE(actor,'Administración'));
 RETURN to_jsonb(o);
END; $$;
REVOKE ALL ON FUNCTION public.set_order_status_audited(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_order_status_audited(uuid,uuid,text,text) TO service_role;

CREATE INDEX IF NOT EXISTS manufacturing_orders_workflow_status ON public.manufacturing_orders(order_id,status);
CREATE OR REPLACE FUNCTION public.administration_workflow_counts() RETURNS jsonb
LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object(
  'requests',(SELECT count(*) FROM order_requests WHERE status='pending'),
  'preparation',(SELECT count(*) FROM orders o WHERE o.sale_channel='direct' AND o.status IN ('pending','processing')
    AND o.commercial_approval_status IN ('approved','legacy') AND NOT (o.commercial_approval_status='legacy' AND o.status='processing')
    AND NOT EXISTS(SELECT 1 FROM manufacturing_orders m WHERE m.order_id=o.id AND m.status IN ('issued','in_production','completed'))),
  'production',(SELECT count(*) FROM orders o WHERE o.sale_channel='direct' AND o.status='processing'
    AND (o.commercial_approval_status='legacy' OR EXISTS(SELECT 1 FROM manufacturing_orders m WHERE m.order_id=o.id AND m.status IN ('issued','in_production','completed'))))
 );
$$;
REVOKE ALL ON FUNCTION public.administration_workflow_counts() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.administration_workflow_counts() TO service_role;
COMMIT;
