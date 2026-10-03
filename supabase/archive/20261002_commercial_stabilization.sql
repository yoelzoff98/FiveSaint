-- =========================================================================
-- MIGRACIÓN ADITIVA Y RETROCOMPATIBLE: ESTABILIZACIÓN MÓDULO COMERCIAL
-- =========================================================================
-- Reglas obligatorias aplicadas:
-- 1. Todas las sentencias son aditivas (ADD COLUMN IF NOT EXISTS).
-- 2. No se modifican ni eliminan identificadores, números o importes existentes.
-- 3. Los valores predeterminados garantizan total compatibilidad con registros existentes.
-- =========================================================================

-- 1. Extensiones a la tabla 'budgets'
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS public_status TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS public_notes TEXT,
  ADD COLUMN IF NOT EXISTS client_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS seller_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 21.00,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sale_channel TEXT DEFAULT 'direct';

-- 2. Extensiones a la tabla 'budget_items'
ALTER TABLE public.budget_items
  ADD COLUMN IF NOT EXISTS converted_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_exceptional_discount BOOLEAN DEFAULT false;

-- 3. Extensiones a la tabla 'orders'
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sale_channel TEXT DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 4. Extensiones a la tabla 'order_items'
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS budget_item_id UUID REFERENCES public.budget_items(id) ON DELETE SET NULL;

-- 5. Índices de optimización para consultas seguras
CREATE INDEX IF NOT EXISTS idx_budgets_public_token ON public.budgets(public_token);
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON public.budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_seller_id ON public.budgets(seller_id);
CREATE INDEX IF NOT EXISTS idx_budgets_idempotency_key ON public.budgets(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_orders_budget_id ON public.orders(budget_id);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_budget_item_id ON public.order_items(budget_item_id);

-- 6. Función RPC atómica para incremento de visualizaciones sin colisiones
CREATE OR REPLACE FUNCTION public.increment_budget_view(p_budget_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_view_count INTEGER;
  v_first_viewed_at TIMESTAMPTZ;
  v_last_viewed_at TIMESTAMPTZ;
BEGIN
  UPDATE public.budgets
  SET 
    view_count = COALESCE(view_count, 0) + 1,
    first_viewed_at = COALESCE(first_viewed_at, viewed_at, NOW()),
    last_viewed_at = NOW()
  WHERE id = p_budget_id
  RETURNING view_count, first_viewed_at, last_viewed_at
  INTO v_view_count, v_first_viewed_at, v_last_viewed_at;

  RETURN jsonb_build_object(
    'success', true,
    'view_count', v_view_count,
    'first_viewed_at', v_first_viewed_at,
    'last_viewed_at', v_last_viewed_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
