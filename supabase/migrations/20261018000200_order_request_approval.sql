BEGIN;
CREATE TABLE IF NOT EXISTS public.order_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), budget_id uuid NOT NULL REFERENCES public.budgets(id),
 submitted_by uuid NOT NULL REFERENCES auth.users(id), submitted_by_name text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','returned','rejected')),
 items jsonb NOT NULL, notes text, commercial_snapshot jsonb NOT NULL, fingerprint text NOT NULL,
 idempotency_key text NOT NULL, request_hash text NOT NULL,
 decided_by uuid REFERENCES auth.users(id), decided_by_name text, decided_at timestamptz, decision_reason text,
 order_id uuid REFERENCES public.orders(id), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(submitted_by,budget_id,idempotency_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS order_requests_one_pending ON public.order_requests(budget_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS order_requests_inbox ON public.order_requests(status,created_at DESC);
CREATE INDEX IF NOT EXISTS order_requests_submitter ON public.order_requests(submitted_by,created_at DESC);
CREATE INDEX IF NOT EXISTS order_requests_budget ON public.order_requests(budget_id,created_at DESC);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commercial_approval_status text NOT NULL DEFAULT 'legacy',
 ADD COLUMN IF NOT EXISTS accepted_request_id uuid REFERENCES public.order_requests(id),
 ADD COLUMN IF NOT EXISTS accepted_by uuid REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE public.orders ALTER COLUMN commercial_approval_status SET DEFAULT 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS orders_accepted_request_unique ON public.orders(accepted_request_id) WHERE accepted_request_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.order_request_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES public.order_requests(id),
 recipient_user_id uuid NOT NULL REFERENCES auth.users(id), event text NOT NULL,
 title text NOT NULL, message text NOT NULL, is_read boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(request_id,recipient_user_id,event)
);
CREATE INDEX IF NOT EXISTS request_notifications_recipient ON public.order_request_notifications(recipient_user_id,is_read,created_at DESC);
ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_request_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_requests,public.order_request_notifications FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.order_requests,public.order_request_notifications TO service_role;
GRANT SELECT,UPDATE(is_read) ON public.order_request_notifications TO authenticated;
DROP POLICY IF EXISTS request_notifications_own ON public.order_request_notifications;
CREATE POLICY request_notifications_own ON public.order_request_notifications FOR SELECT TO authenticated USING(recipient_user_id=auth.uid());
DROP POLICY IF EXISTS request_notifications_mark_read ON public.order_request_notifications;
CREATE POLICY request_notifications_mark_read ON public.order_request_notifications FOR UPDATE TO authenticated USING(recipient_user_id=auth.uid()) WITH CHECK(recipient_user_id=auth.uid());

CREATE OR REPLACE FUNCTION public.order_request_snapshot(p_budget uuid,p_items jsonb) RETURNS jsonb
LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('budget_number',b.budget_number,'client_id',b.client_id,'seller_id',b.seller_id,
 'total_amount',b.total_amount,'discounts',to_jsonb(b.discounts),'tax_rate',b.tax_rate,'version',b.version,
 'public_notes',b.public_notes,'calculation_snapshot',b.calculation_snapshot,
 'items',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',i.id,'product_name',i.product_name,'variant_name',i.variant_name,
 'product_id',i.product_id,'variant_id',i.variant_id,'quantity',i.quantity,'unit_price',i.unit_price,'configuration',i.configuration)
 ORDER BY i.id) FROM budget_items i WHERE i.budget_id=b.id AND EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) r WHERE (r->>'budgetItemId')::uuid=i.id)),'[]'::jsonb))
 FROM budgets b WHERE b.id=p_budget;
$$;

CREATE OR REPLACE FUNCTION public.submit_order_request(p_user_id uuid,p_budget_id uuid,p_items jsonb,p_notes text,p_key text,p_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE b record; existing record; seller record; line record; requested record; snap jsonb; result_id uuid;
BEGIN
 SELECT * INTO seller FROM sellers WHERE user_id=p_user_id AND is_active;
 IF NOT FOUND THEN RAISE EXCEPTION 'ACCESO DENEGADO: Solo vendedores activos envían solicitudes'; END IF;
 IF p_key IS NULL OR p_key='' OR p_hash IS NULL THEN RAISE EXCEPTION 'Clave de solicitud obligatoria'; END IF;
 SELECT * INTO b FROM budgets WHERE id=p_budget_id FOR UPDATE;
 IF NOT FOUND OR b.seller_id IS DISTINCT FROM seller.id THEN RAISE EXCEPTION 'Presupuesto no autorizado'; END IF;
 SELECT * INTO existing FROM order_requests WHERE submitted_by=p_user_id AND budget_id=p_budget_id AND idempotency_key=p_key;
 IF FOUND THEN
  IF existing.request_hash IS DISTINCT FROM p_hash THEN RAISE EXCEPTION 'Conflicto de idempotencia'; END IF;
  RETURN jsonb_build_object('success',true,'request_id',existing.id,'request_status',existing.status,'requires_approval',true);
 END IF;
 SELECT * INTO existing FROM order_requests WHERE budget_id=p_budget_id AND status='pending';
 IF FOUND THEN
  IF existing.request_hash=p_hash THEN RETURN jsonb_build_object('success',true,'request_id',existing.id,'request_status','pending','requires_approval',true); END IF;
  RAISE EXCEPTION 'Ya existe una solicitud pendiente para este presupuesto';
 END IF;
 IF b.status IN ('rejected','converted','distributor_sale') OR COALESCE(b.is_historical_reconciliation_pending,false) THEN RAISE EXCEPTION 'Presupuesto no disponible para solicitar pedido'; END IF;
 IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items)=0 THEN RAISE EXCEPTION 'Seleccioná productos'; END IF;
 FOR requested IN SELECT (value->>'budgetItemId')::uuid id,SUM((value->>'quantity')::integer) qty FROM jsonb_array_elements(p_items) GROUP BY 1 LOOP
  IF requested.qty IS NULL OR requested.qty<=0 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) x WHERE (x->>'budgetItemId')::uuid=requested.id AND ((x->>'quantity')::integer IS NULL OR (x->>'quantity')::integer<=0)) THEN RAISE EXCEPTION 'Cantidad inválida'; END IF;
  SELECT * INTO line FROM budget_items WHERE id=requested.id AND budget_id=p_budget_id;
  IF NOT FOUND OR requested.qty>line.quantity-COALESCE(line.converted_quantity,0) THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;
 END LOOP;
 snap:=order_request_snapshot(p_budget_id,p_items);
 INSERT INTO order_requests(budget_id,submitted_by,submitted_by_name,items,notes,commercial_snapshot,fingerprint,idempotency_key,request_hash)
 VALUES(p_budget_id,p_user_id,seller.full_name,p_items,p_notes,snap,md5(snap::text),p_key,p_hash) RETURNING id INTO result_id;
 INSERT INTO order_request_notifications(request_id,recipient_user_id,event,title,message)
 SELECT result_id,user_id,'submitted','Nueva solicitud de pedido','Presupuesto #'||b.budget_number||' confirmado por el cliente. Vendedor: '||seller.full_name
 FROM (SELECT user_id FROM admin_users WHERE is_active UNION SELECT user_id FROM administration_users WHERE is_active) recipients;
 INSERT INTO client_notes(client_id,seller_id,budget_id,note_type,content)
 VALUES(b.client_id,b.seller_id,b.id,'order_request','Cliente confirmó. Solicitud enviada por '||seller.full_name||' para aceptación administrativa.');
 RETURN jsonb_build_object('success',true,'request_id',result_id,'request_status','pending','requires_approval',true);
END; $$;

CREATE OR REPLACE FUNCTION public.decide_order_request(p_user_id uuid,p_request_id uuid,p_decision text,p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE request record; budget uuid; actor text; result jsonb; generated uuid;
BEGIN
 SELECT full_name INTO actor FROM admin_users WHERE user_id=p_user_id AND is_active;
 IF NOT FOUND THEN SELECT full_name INTO actor FROM administration_users WHERE user_id=p_user_id AND is_active; IF NOT FOUND THEN RAISE EXCEPTION 'ACCESO DENEGADO'; END IF; END IF;
 IF p_decision NOT IN ('approved','returned','rejected') THEN RAISE EXCEPTION 'Decisión inválida'; END IF;
 IF p_decision<>'approved' AND char_length(trim(COALESCE(p_reason,'')))<3 THEN RAISE EXCEPTION 'Indicá el motivo'; END IF;
 SELECT budget_id INTO budget FROM order_requests WHERE id=p_request_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud inexistente'; END IF;
 PERFORM 1 FROM budgets WHERE id=budget FOR UPDATE;
 SELECT * INTO request FROM order_requests WHERE id=p_request_id FOR UPDATE;
 IF request.status<>'pending' THEN
  IF request.status=p_decision THEN RETURN jsonb_build_object('success',true,'status',request.status,'order_id',request.order_id); END IF;
  RAISE EXCEPTION 'La solicitud ya fue resuelta';
 END IF;
 IF p_decision='approved' THEN
  IF md5(order_request_snapshot(budget,request.items)::text) IS DISTINCT FROM request.fingerprint THEN RAISE EXCEPTION 'El presupuesto cambió. Devolvé la solicitud al vendedor para nueva confirmación'; END IF;
  PERFORM set_config('fivesaint.approving_request',request.id::text,true);
  result:=convert_budget_transactional(p_user_id,budget,request.items,'direct',request.notes,'approval-'||request.id::text,request.fingerprint,NULL,NULL,NULL);
  generated:=(result->>'order_id')::uuid;
  UPDATE orders SET commercial_approval_status='approved',accepted_request_id=request.id,accepted_by=p_user_id,accepted_at=now() WHERE id=generated;
  PERFORM set_config('fivesaint.approving_request','',true);
 END IF;
 UPDATE order_requests SET status=p_decision,decided_by=p_user_id,decided_by_name=COALESCE(actor,'Administración'),decided_at=now(),decision_reason=NULLIF(trim(p_reason),''),order_id=generated WHERE id=p_request_id;
 UPDATE order_request_notifications SET is_read=true WHERE request_id=p_request_id AND event='submitted';
 INSERT INTO order_request_notifications(request_id,recipient_user_id,event,title,message)
 VALUES(p_request_id,request.submitted_by,p_decision,'Solicitud de pedido: '||CASE p_decision WHEN 'approved' THEN 'aceptada' WHEN 'returned' THEN 'devuelta para corregir' ELSE 'rechazada' END,COALESCE(actor,'Administración')||COALESCE(': '||NULLIF(trim(p_reason),''),''));
 INSERT INTO client_notes(client_id,seller_id,budget_id,order_id,note_type,content)
 SELECT client_id,seller_id,budget,generated,'order_request','Solicitud '||p_decision||' por '||COALESCE(actor,'Administración')||COALESCE(': '||p_reason,'') FROM budgets WHERE id=budget;
 RETURN jsonb_build_object('success',true,'status',p_decision,'order_id',generated);
END; $$;

CREATE OR REPLACE FUNCTION public.enforce_order_acceptance() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM order_requests r WHERE r.budget_id=NEW.budget_id AND r.status='pending' AND r.id::text IS DISTINCT FROM current_setting('fivesaint.approving_request',true)) THEN RAISE EXCEPTION 'El presupuesto tiene una solicitud pendiente. Aceptala desde la bandeja'; END IF;
 IF COALESCE(NEW.sale_channel,'direct')='direct' THEN
  IF NOT EXISTS(SELECT 1 FROM admin_users WHERE user_id=NEW.recorded_by_user_id AND is_active) AND NOT EXISTS(SELECT 1 FROM administration_users WHERE user_id=NEW.recorded_by_user_id AND is_active) THEN RAISE EXCEPTION 'El vendedor debe enviar una solicitud para aceptación administrativa'; END IF;
  NEW.commercial_approval_status:='approved'; NEW.accepted_by:=NEW.recorded_by_user_id; NEW.accepted_at:=now();
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS enforce_order_acceptance ON public.orders;
CREATE TRIGGER enforce_order_acceptance BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.enforce_order_acceptance();
CREATE OR REPLACE FUNCTION public.require_manufacturing_acceptance() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM orders WHERE id=NEW.order_id AND commercial_approval_status IN ('approved','legacy')) THEN RAISE EXCEPTION 'Pedido pendiente de aceptación administrativa'; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS require_manufacturing_acceptance ON public.manufacturing_orders;
CREATE TRIGGER require_manufacturing_acceptance BEFORE INSERT ON public.manufacturing_orders FOR EACH ROW EXECUTE FUNCTION public.require_manufacturing_acceptance();
CREATE OR REPLACE FUNCTION public.guard_pending_order_request() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.status='rejected' AND EXISTS(SELECT 1 FROM order_requests WHERE budget_id=NEW.id AND status='pending') THEN RAISE EXCEPTION 'Resolvé la solicitud pendiente antes de rechazar el presupuesto'; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_pending_order_request ON public.budgets;
CREATE TRIGGER guard_pending_order_request BEFORE UPDATE OF status ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.guard_pending_order_request();
CREATE OR REPLACE FUNCTION public.guard_order_production_acceptance() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.status IN ('processing','delivered') AND NEW.commercial_approval_status NOT IN ('approved','legacy') THEN RAISE EXCEPTION 'Pedido pendiente de aceptación administrativa'; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_order_production_acceptance ON public.orders;
CREATE TRIGGER guard_order_production_acceptance BEFORE UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_order_production_acceptance();
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('order_request_snapshot','submit_order_request','decide_order_request','enforce_order_acceptance','require_manufacturing_acceptance','guard_pending_order_request','guard_order_production_acceptance') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') AND NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='order_request_notifications') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.order_request_notifications; END IF;
END; $$;
COMMIT;
