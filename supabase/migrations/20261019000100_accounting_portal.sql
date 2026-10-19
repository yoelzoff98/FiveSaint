BEGIN;
CREATE TABLE IF NOT EXISTS public.accounting_users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
 full_name text NOT NULL CHECK(length(trim(full_name))>=2), email text NOT NULL,
 is_active boolean NOT NULL DEFAULT true, created_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION public.can_read_accounting() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT CASE
 WHEN EXISTS(SELECT 1 FROM admin_users WHERE user_id=auth.uid()) THEN EXISTS(SELECT 1 FROM admin_users WHERE user_id=auth.uid() AND is_active)
 WHEN EXISTS(SELECT 1 FROM administration_users WHERE user_id=auth.uid()) THEN EXISTS(SELECT 1 FROM administration_users WHERE user_id=auth.uid() AND is_active)
 ELSE EXISTS(SELECT 1 FROM accounting_users WHERE user_id=auth.uid() AND is_active) END;
$$;
REVOKE ALL ON FUNCTION public.can_read_accounting() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_read_accounting() TO authenticated,service_role;
ALTER TABLE public.accounting_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.accounting_users FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.accounting_users TO authenticated;
GRANT ALL ON public.accounting_users TO service_role;
DROP POLICY IF EXISTS accounting_profile_read ON public.accounting_users;
CREATE POLICY accounting_profile_read ON public.accounting_users FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_admin());
-- Only the future fiscal connector can insert authorized records. No manual visibility flag.
CREATE TABLE IF NOT EXISTS public.fiscal_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), issuer_tax_id text NOT NULL CHECK(issuer_tax_id ~ '^[0-9]{11}$'),
 voucher_type integer NOT NULL CHECK(voucher_type>0), point_of_sale integer NOT NULL CHECK(point_of_sale BETWEEN 1 AND 99999),
 voucher_number bigint NOT NULL CHECK(voucher_number>0), issued_on date NOT NULL,
 recipient_name text NOT NULL, recipient_document text NOT NULL,
 currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'), net_amount numeric(18,2) NOT NULL CHECK(net_amount>=0),
 tax_amount numeric(18,2) NOT NULL CHECK(tax_amount>=0), total_amount numeric(18,2) NOT NULL CHECK(total_amount=net_amount+tax_amount),
 authorization_code text NOT NULL CHECK(authorization_code ~ '^[0-9]{14}$'), authorization_expires_on date NOT NULL,
 authorized_at timestamptz NOT NULL, original_document_id uuid REFERENCES public.fiscal_documents(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(issuer_tax_id,voucher_type,point_of_sale,voucher_number)
);
CREATE INDEX IF NOT EXISTS fiscal_documents_period_idx ON public.fiscal_documents(issued_on DESC,id DESC);
ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fiscal_documents FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.fiscal_documents TO authenticated;
REVOKE ALL ON public.fiscal_documents FROM service_role;
GRANT SELECT, INSERT ON public.fiscal_documents TO service_role;
DROP POLICY IF EXISTS fiscal_documents_read ON public.fiscal_documents;
CREATE POLICY fiscal_documents_read ON public.fiscal_documents FOR SELECT TO authenticated USING(public.can_read_accounting());
CREATE OR REPLACE FUNCTION public.prevent_fiscal_document_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN RAISE EXCEPTION 'Los comprobantes autorizados son inmutables; registrar el comprobante rectificativo correspondiente'; END;
$$;
REVOKE ALL ON FUNCTION public.prevent_fiscal_document_mutation() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS fiscal_documents_immutable ON public.fiscal_documents;
CREATE TRIGGER fiscal_documents_immutable BEFORE UPDATE OR DELETE ON public.fiscal_documents FOR EACH ROW EXECUTE FUNCTION public.prevent_fiscal_document_mutation();
COMMIT;
