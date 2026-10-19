BEGIN;
ALTER TABLE public.fiscal_documents
 ADD COLUMN IF NOT EXISTS source_order_id uuid REFERENCES public.orders(id) ON DELETE RESTRICT,
 ADD COLUMN IF NOT EXISTS source_budget_id uuid REFERENCES public.budgets(id) ON DELETE RESTRICT,
 ADD COLUMN IF NOT EXISTS source_order_snapshot jsonb,
 ADD COLUMN IF NOT EXISTS source_budget_snapshot jsonb;
CREATE INDEX IF NOT EXISTS fiscal_documents_source_order_idx ON public.fiscal_documents(source_order_id) WHERE source_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS fiscal_documents_source_budget_idx ON public.fiscal_documents(source_budget_id) WHERE source_budget_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS fiscal_documents_original_idx ON public.fiscal_documents(original_document_id) WHERE original_document_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.capture_fiscal_document_sources() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_order public.orders; v_budget public.budgets; v_original public.fiscal_documents;
BEGIN
 -- Caller-supplied snapshots are never trusted.
 NEW.source_order_snapshot := NULL; NEW.source_budget_snapshot := NULL;
 IF NEW.original_document_id IS NOT NULL THEN
   SELECT * INTO STRICT v_original FROM public.fiscal_documents WHERE id=NEW.original_document_id;
   IF NEW.issuer_tax_id<>v_original.issuer_tax_id OR NEW.currency<>v_original.currency THEN
     RAISE EXCEPTION 'El comprobante asociado debe tener el mismo emisor y moneda';
   END IF;
   IF (NEW.source_order_id IS NOT NULL AND NEW.source_order_id IS DISTINCT FROM v_original.source_order_id)
      OR (NEW.source_budget_id IS NOT NULL AND NEW.source_budget_id IS DISTINCT FROM v_original.source_budget_id) THEN
     RAISE EXCEPTION 'El origen no coincide con el comprobante asociado';
   END IF;
   NEW.source_order_id:=v_original.source_order_id;
   NEW.source_budget_id:=v_original.source_budget_id;
   NEW.source_order_snapshot:=v_original.source_order_snapshot;
   NEW.source_budget_snapshot:=v_original.source_budget_snapshot;
   RETURN NEW;
 END IF;
 IF NEW.source_order_id IS NOT NULL THEN
   SELECT * INTO STRICT v_order FROM public.orders WHERE id=NEW.source_order_id;
   IF NEW.source_budget_id IS NOT NULL AND NEW.source_budget_id IS DISTINCT FROM v_order.budget_id THEN
     RAISE EXCEPTION 'El presupuesto no corresponde al pedido';
   END IF;
   NEW.source_budget_id:=v_order.budget_id;
   NEW.source_order_snapshot:=jsonb_build_object('document',(to_jsonb(v_order)-'idempotency_key'),'currency','ARS','items',
     COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.created_at,i.id) FROM public.order_items i WHERE i.order_id=v_order.id),'[]'::jsonb));
 END IF;
 IF NEW.source_budget_id IS NOT NULL THEN
   SELECT * INTO STRICT v_budget FROM public.budgets WHERE id=NEW.source_budget_id;
   NEW.source_budget_snapshot:=jsonb_build_object('document',(to_jsonb(v_budget)-ARRAY['public_token','idempotency_key']),'currency','ARS','items',
     COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.created_at,i.id) FROM public.budget_items i WHERE i.budget_id=v_budget.id),'[]'::jsonb));
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_fiscal_document_sources() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS fiscal_documents_capture_sources ON public.fiscal_documents;
CREATE TRIGGER fiscal_documents_capture_sources BEFORE INSERT ON public.fiscal_documents FOR EACH ROW EXECUTE FUNCTION public.capture_fiscal_document_sources();
-- Aggregation stays in PostgreSQL, restricted to an already readable fiscal document.
CREATE OR REPLACE FUNCTION public.get_fiscal_billing_summary(p_document_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_doc public.fiscal_documents; v_result jsonb; v_source jsonb;
BEGIN
 IF NOT public.can_read_accounting() THEN RAISE EXCEPTION 'Acceso denegado'; END IF;
 SELECT * INTO v_doc FROM public.fiscal_documents WHERE id=p_document_id;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT jsonb_build_object('document_count',count(*),'currency',v_doc.currency,
   'supported_types',COALESCE(bool_and(d.voucher_type IN (1,2,3,6,7,8,11,12,13)),true),
   'net_invoiced',COALESCE(sum(CASE WHEN d.voucher_type IN (3,8,13) THEN -d.total_amount WHEN d.voucher_type IN (1,2,6,7,11,12) THEN d.total_amount ELSE 0 END),0))
 INTO v_result FROM public.fiscal_documents d
 WHERE d.issuer_tax_id=v_doc.issuer_tax_id AND d.currency=v_doc.currency AND (
 (v_doc.source_order_id IS NOT NULL AND d.source_order_id=v_doc.source_order_id)
 OR (v_doc.source_order_id IS NULL AND v_doc.source_budget_id IS NOT NULL AND d.source_order_id IS NULL AND d.source_budget_id=v_doc.source_budget_id)
 OR (v_doc.source_order_id IS NULL AND v_doc.source_budget_id IS NULL AND (d.id=COALESCE(v_doc.original_document_id,v_doc.id) OR d.original_document_id=COALESCE(v_doc.original_document_id,v_doc.id))));
 v_source:=COALESCE(v_doc.source_order_snapshot,v_doc.source_budget_snapshot);
 IF v_source IS NOT NULL AND v_source->>'currency'=v_doc.currency AND (v_result->>'supported_types')::boolean THEN
   v_result:=v_result||jsonb_build_object('pending_amount',(v_source->'document'->>'total_amount')::numeric-(v_result->>'net_invoiced')::numeric);
 ELSE
   v_result:=v_result||jsonb_build_object('pending_amount',NULL);
 END IF;
 RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_fiscal_billing_summary(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_fiscal_billing_summary(uuid) TO authenticated;
COMMIT;
