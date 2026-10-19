BEGIN;
-- Aditiva: los registros existentes reciben el valor predeterminado sin tocar sus demás datos.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'consumidor_final';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.clients'::regclass AND conname='clients_category_check') THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_category_check
      CHECK (category IN ('consumidor_final','arquitecto','distribuidor','constructor'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS clients_category_created_at_idx ON public.clients(category,created_at DESC);
COMMIT;
