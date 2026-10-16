-- Explicit, manually maintained links. Never infer historical identity from names.
BEGIN;
CREATE TABLE IF NOT EXISTS public.catalog_manufacturing_bindings (
  catalog_key text PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_manufacturing_bindings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalog_manufacturing_bindings FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.catalog_manufacturing_bindings TO service_role;
COMMIT;
