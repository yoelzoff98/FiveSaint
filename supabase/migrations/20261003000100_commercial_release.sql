-- =========================================================================
-- MIGRACIÓN ADITIVA V3: ESTABILIZACIÓN Y OPTIMIZACIÓN COMERCIAL
-- FiveSaint - Producción & Staging
-- =========================================================================
-- ARQUITECTURA DE SEGURIDAD Y PERMISOS:
-- 1. Todas las funciones RPC son SECURITY DEFINER con search_path = public, pg_temp.
-- 2. Permisos explícitos: REVOKE ALL FROM PUBLIC, anon, authenticated.
-- 3. Acceso restringido exclusivamente a service_role (backend Server Actions).
-- 4. Doble validación en SQL: verifica que p_user_id corresponda a un admin_user,
--    seller o distributor con is_active = true y que tenga propiedad sobre el registro.
-- 5. Idempotencia protegida con RLS y hash normalizado (SHA-256).
-- 6. Transacciones completas: todo commit o todo rollback. Cero limpiezas con DELETE.
-- 7. Tabla versionada de precios administrables (price_list_items).
-- =========================================================================

BEGIN;

-- Keep the original numeric[] discounts and extend only valid state values.
ALTER TABLE public.clients ALTER COLUMN status SET DEFAULT 'nuevo';
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_status_check;
ALTER TABLE public.budgets ADD CONSTRAINT budgets_status_check CHECK (
  status IN ('draft','sent','accepted','rejected','converted','partially_converted','distributor_sale')
);
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('pending','processing','delivered','cancelled','completed')
);

-- 1. TABLA VERSIONADA DE PRECIOS ADMINISTRABLES
CREATE TABLE IF NOT EXISTS public.price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key TEXT NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  name TEXT NOT NULL,
  variant_name TEXT,
  price NUMERIC(12,2) NOT NULL,
  code VARCHAR(50),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_list_items_lookup 
  ON public.price_list_items(item_key, is_active);

-- 2. TABLA DEDICADA DE IDEMPOTENCIA CON RLS
CREATE TABLE IF NOT EXISTS public.idempotency_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'processing',
  response_body JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_idempotency_user_op_key UNIQUE(user_id, operation_type, idempotency_key)
);

ALTER TABLE public.idempotency_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.idempotency_records FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.idempotency_records TO service_role;

CREATE INDEX IF NOT EXISTS idx_idempotency_user_op 
  ON public.idempotency_records(user_id, operation_type, idempotency_key);

-- 3. EXTENSIONES ADITIVAS A 'budgets'
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS public_status VARCHAR(20) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS public_notes TEXT,
  ADD COLUMN IF NOT EXISTS client_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS seller_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS calculation_snapshot JSONB,
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
  ADD COLUMN IF NOT EXISTS sale_channel VARCHAR(30) DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS is_historical_reconciliation_pending BOOLEAN DEFAULT false;

-- 4. EXTENSIONES ADITIVAS A 'budget_items'
ALTER TABLE public.budget_items
  ADD COLUMN IF NOT EXISTS converted_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_price_reason TEXT,
  ADD COLUMN IF NOT EXISTS manual_price_authorized_by TEXT,
  ADD COLUMN IF NOT EXISTS is_exceptional_discount BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS exceptional_discount_reason TEXT;

-- 5. EXTENSIONES ADITIVAS A 'orders'
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sale_channel VARCHAR(30) DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS order_type VARCHAR(30) DEFAULT 'factory',
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS distributor_id UUID REFERENCES public.distributors(id) ON DELETE SET NULL;

-- 6. EXTENSIONES ADITIVAS A 'order_items'
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS budget_item_id UUID REFERENCES public.budget_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_id UUID,
  ADD COLUMN IF NOT EXISTS variant_id UUID,
  ADD COLUMN IF NOT EXISTS variant_name TEXT,
  ADD COLUMN IF NOT EXISTS factory_notes TEXT;

-- 7. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN (COMPUESTOS)
CREATE INDEX IF NOT EXISTS idx_budgets_seller_created ON public.budgets(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_client_created ON public.budgets(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_public_token ON public.budgets(public_token);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_created ON public.orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_budget_id ON public.orders(budget_id);
CREATE INDEX IF NOT EXISTS idx_orders_sale_channel ON public.orders(sale_channel, status);
CREATE INDEX IF NOT EXISTS idx_order_items_budget_item ON public.order_items(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);

-- 8. FUNCIÓN RPC: INCREMENTO ATÓMICO DE VISUALIZACIONES CON DEDUPLICACIÓN
-- Evita inflar métricas si un cliente o bot refresca la página repetidamente en 60 segundos
CREATE OR REPLACE FUNCTION public.increment_budget_view(p_budget_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_view_count INTEGER;
  v_first_viewed_at TIMESTAMPTZ;
  v_last_viewed_at TIMESTAMPTZ;
BEGIN
  -- One conditional update: concurrent requests cannot double count a burst.
  -- Redundant reads do not generate writes or extend the deduplication window.
  UPDATE public.budgets
  SET view_count = COALESCE(view_count, 0) + 1,
      first_viewed_at = COALESCE(first_viewed_at, viewed_at, NOW()),
      last_viewed_at = NOW()
  WHERE id = p_budget_id AND public_status = 'published'
    AND (last_viewed_at IS NULL OR last_viewed_at <= NOW() - INTERVAL '60 seconds')
  RETURNING view_count, first_viewed_at, last_viewed_at
  INTO v_view_count, v_first_viewed_at, v_last_viewed_at;

  IF NOT FOUND THEN
    SELECT view_count, first_viewed_at, last_viewed_at
    INTO v_view_count, v_first_viewed_at, v_last_viewed_at
    FROM public.budgets WHERE id = p_budget_id AND public_status = 'published';
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false); END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'view_count', v_view_count,
    'first_viewed_at', v_first_viewed_at,
    'last_viewed_at', v_last_viewed_at
  );
END;
$$;

-- 9. FUNCIÓN RPC TRANSACCIONAL: CREACIÓN DE PRESUPUESTO
-- Valida internamente identidad y rol activo del usuario
CREATE OR REPLACE FUNCTION public.create_budget_transactional(
  p_user_id UUID,
  p_client_id UUID,
  p_items JSONB,
  p_discounts JSONB,
  p_notes TEXT,
  p_public_notes TEXT,
  p_idempotency_key TEXT,
  p_request_hash TEXT,
  p_client_snapshot JSONB,
  p_seller_snapshot JSONB,
  p_calculation_snapshot JSONB,
  p_total_amount NUMERIC(12,2),
  p_subtotal_amount NUMERIC(12,2),
  p_discount_amount NUMERIC(12,2),
  p_tax_amount NUMERIC(12,2),
  p_tax_rate NUMERIC(5,2) DEFAULT 21.00,
  p_seller_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_seller RECORD;
  v_client RECORD;
  v_existing_rec RECORD;
  v_new_budget RECORD;
  v_item JSONB;
  v_item_idx INTEGER := 0;
  v_effective_seller_id UUID;
  v_result JSONB;
BEGIN
  -- A. AUTORIZACIÓN ESTRICTA EN SQL: Verificar identidad y rol activo
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    SELECT * INTO v_seller FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: El usuario no posee un rol comercial activo.';
    END IF;
  END IF;

  -- B. Validar cliente y asignación
  SELECT * INTO v_client FROM public.clients WHERE id = p_client_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El cliente especificado no existe.';
  END IF;

  IF NOT v_is_admin AND v_client.seller_id IS DISTINCT FROM v_seller.id THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a presupuestar clientes de otro asesor.';
  END IF;

  v_effective_seller_id := CASE 
    WHEN v_is_admin THEN COALESCE(p_seller_id, v_client.seller_id, NULL)
    ELSE v_seller.id 
  END;

  -- C. IDEMPOTENCIA: Adquisición atómica y resolución de conflictos de concurrencia
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
    VALUES (p_user_id, 'create_budget', p_idempotency_key, p_request_hash, 'processing')
    ON CONFLICT (user_id, operation_type, idempotency_key) DO NOTHING
    RETURNING * INTO v_existing_rec;

    -- Si hubo conflicto (registro preexistente o transacción concurrente ganadora)
    IF NOT FOUND OR v_existing_rec.id IS NULL THEN
      SELECT * INTO v_existing_rec
      FROM public.idempotency_records
      WHERE user_id = p_user_id
        AND operation_type = 'create_budget'
        AND idempotency_key = p_idempotency_key
      FOR UPDATE;

      IF FOUND THEN
        IF v_existing_rec.request_hash <> p_request_hash THEN
          RAISE EXCEPTION 'Conflicto de idempotencia: clave ya enviada con payload diferente.';
        END IF;

        IF v_existing_rec.status = 'completed' THEN
          RETURN v_existing_rec.response_body;
        ELSIF v_existing_rec.status = 'processing' THEN
          RAISE EXCEPTION 'Operación en curso. Por favor espere el resultado de la solicitud anterior.';
        ELSIF v_existing_rec.status = 'failed' THEN
          RAISE EXCEPTION 'La operación previa con esta clave falló: %', COALESCE(v_existing_rec.error_message, 'Error desconocido');
        END IF;
      ELSE
        -- Si la transacción anterior abortó y liberó el bloqueo sin completar, adquirir el registro ganador antes de continuar
        INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
        VALUES (p_user_id, 'create_budget', p_idempotency_key, p_request_hash, 'processing')
        RETURNING * INTO v_existing_rec;
      END IF;
    END IF;
  END IF;

  -- D. Validar ítems
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'No se puede crear un presupuesto sin ítems.';
  END IF;

  -- E. Insertar cabecera de presupuesto (Borrador privado por defecto)
  INSERT INTO public.budgets (
    client_id,
    seller_id,
    status,
    total_amount,
    subtotal_amount,
    discount_amount,
    tax_amount,
    tax_rate,
    notes,
    public_notes,
    discounts,
    public_status,
    client_snapshot,
    seller_snapshot,
    calculation_snapshot,
    version,
    idempotency_key,
    sale_channel
  ) VALUES (
    p_client_id,
    v_effective_seller_id,
    'draft',
    p_total_amount,
    p_subtotal_amount,
    p_discount_amount,
    p_tax_amount,
    COALESCE(p_tax_rate, 21.00),
    NULLIF(TRIM(p_notes), ''),
    NULLIF(TRIM(p_public_notes), ''),
    (jsonb_populate_record(NULL::public.budgets, jsonb_build_object('discounts', COALESCE(p_discounts, '[]'::jsonb)))).discounts,
    'draft', -- REGLA: Los borradores se crean como borrador privado (no publicados)
    p_client_snapshot,
    p_seller_snapshot,
    p_calculation_snapshot,
    1,
    p_idempotency_key,
    'direct'
  )
  RETURNING * INTO v_new_budget;

  -- F. Inserción de ítems
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_idx := v_item_idx + 1;

    IF (v_item->>'quantity')::NUMERIC <= 0 OR (v_item->>'unitPrice')::NUMERIC < 0 THEN
      RAISE EXCEPTION 'Ítem en posición % contiene cantidad o precio inválido.', v_item_idx;
    END IF;

    IF COALESCE((v_item->>'isManual')::BOOLEAN, false) AND LENGTH(TRIM(COALESCE(v_item->>'manualPriceReason', ''))) < 3 THEN
      RAISE EXCEPTION 'El ítem manual en posición % requiere especificar un motivo explícito.', v_item_idx;
    END IF;

    INSERT INTO public.budget_items (
      budget_id,
      product_id,
      variant_id,
      product_name,
      variant_name,
      quantity,
      unit_price,
      total_price,
      is_manual,
      manual_price_reason,
      manual_price_authorized_by,
      converted_quantity
    ) VALUES (
      v_new_budget.id,
      NULLIF(v_item->>'productId', '')::UUID,
      NULLIF(v_item->>'variantId', '')::UUID,
      TRIM(v_item->>'productName'),
      NULLIF(TRIM(v_item->>'variantName'), ''),
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unitPrice')::NUMERIC(12,2),
      ROUND(((v_item->>'quantity')::NUMERIC * (v_item->>'unitPrice')::NUMERIC), 2),
      COALESCE((v_item->>'isManual')::BOOLEAN, false),
      NULLIF(TRIM(v_item->>'manualPriceReason'), ''),
      NULLIF(TRIM(v_item->>'manualPriceAuthorizedBy'), ''),
      0
    );
  END LOOP;

  -- G. Registrar nota en historial CRM
  INSERT INTO public.client_notes (
    client_id,
    seller_id,
    content,
    contacted_at,
    note_type,
    budget_id
  ) VALUES (
    p_client_id,
    v_effective_seller_id,
    'Se creó el presupuesto borrador N° ' || v_new_budget.budget_number || ' por un monto neto de $' || p_total_amount,
    NOW(),
    'budget_created',
    v_new_budget.id
  );

  v_result := jsonb_build_object(
    'success', true,
    'id', v_new_budget.id,
    'budget_number', v_new_budget.budget_number,
    'total_amount', v_new_budget.total_amount,
    'status', v_new_budget.status,
    'created_at', v_new_budget.created_at
  );

  -- H. Completar idempotencia
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    UPDATE public.idempotency_records
    SET status = 'completed',
        response_body = v_result,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND operation_type = 'create_budget'
      AND idempotency_key = p_idempotency_key;
  END IF;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    UPDATE public.idempotency_records
    SET status = 'failed',
        error_message = SQLERRM,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND operation_type = 'create_budget'
      AND idempotency_key = p_idempotency_key;
  END IF;
  RAISE;
END;
$$;

-- 10. FUNCIÓN RPC TRANSACCIONAL: CONVERSIÓN DE PRESUPUESTO
-- Valida internamente identidad y rol, calcula saldos agregados previo a mutar y devuelve contrato normalizado
CREATE OR REPLACE FUNCTION public.convert_budget_transactional(
  p_user_id UUID,
  p_budget_id UUID,
  p_items_to_convert JSONB,
  p_sale_channel VARCHAR(30),
  p_notes TEXT,
  p_idempotency_key TEXT,
  p_request_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_seller_id UUID := NULL;
  v_distributor_id UUID := NULL;
  v_existing_rec RECORD;
  v_budget RECORD;
  v_b_item RECORD;
  v_new_order RECORD;
  v_req_item JSONB;
  v_item_id UUID;
  v_requested_qty INTEGER;
  v_available_qty INTEGER;
  v_unit_price NUMERIC(12,2);
  v_total_price NUMERIC(12,2);
  v_order_total NUMERIC(12,2) := 0;
  v_is_fully_converted BOOLEAN := true;
  v_result JSONB;
  v_items_aggregated JSONB := '{}'::jsonb;
  v_curr_agg INTEGER;
  v_new_status VARCHAR(30);
  v_net_allocations JSONB;
  v_processed_quantities JSONB := '{}'::jsonb;
  v_previous_qty INTEGER;
  v_processed_qty INTEGER;
  v_line_net NUMERIC;

BEGIN
  -- A. AUTORIZACIÓN ESTRICTA EN SQL
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    SELECT id INTO v_seller_id FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF v_seller_id IS NULL THEN
      SELECT id INTO v_distributor_id FROM public.distributors WHERE user_id = p_user_id AND is_active = true;
      IF v_distributor_id IS NULL THEN
        RAISE EXCEPTION 'ACCESO DENEGADO: El usuario no posee un rol comercial activo.';
      END IF;
    END IF;
  END IF;

  -- B. IDEMPOTENCIA: Adquisición atómica y resolución de conflictos de concurrencia
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
    VALUES (p_user_id, 'convert_budget', p_idempotency_key, p_request_hash, 'processing')
    ON CONFLICT (user_id, operation_type, idempotency_key) DO NOTHING
    RETURNING * INTO v_existing_rec;

    IF NOT FOUND OR v_existing_rec.id IS NULL THEN
      SELECT * INTO v_existing_rec
      FROM public.idempotency_records
      WHERE user_id = p_user_id
        AND operation_type = 'convert_budget'
        AND idempotency_key = p_idempotency_key
      FOR UPDATE;

      IF FOUND THEN
        IF v_existing_rec.request_hash <> p_request_hash THEN
          RAISE EXCEPTION 'Conflicto de idempotencia: misma clave con diferente contenido de conversión.';
        END IF;

        IF v_existing_rec.status = 'completed' THEN
          RETURN v_existing_rec.response_body;
        ELSIF v_existing_rec.status = 'processing' THEN
          RAISE EXCEPTION 'Conversión en curso. Por favor espere.';
        ELSIF v_existing_rec.status = 'failed' THEN
          RAISE EXCEPTION 'La conversión previa con esta clave falló: %', COALESCE(v_existing_rec.error_message, 'Error desconocido');
        END IF;
      ELSE
        -- Si la transacción previa abortó sin completar, adquirir el registro ganador antes de continuar
        INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
        VALUES (p_user_id, 'convert_budget', p_idempotency_key, p_request_hash, 'processing')
        RETURNING * INTO v_existing_rec;
      END IF;
    END IF;
  END IF;

  -- C. BLOQUEO TRANSACCIONAL JERÁRQUICO (Orden: budgets -> budget_items)
  SELECT * INTO v_budget
  FROM public.budgets
  WHERE id = p_budget_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado.';
  END IF;

  IF NOT v_is_admin THEN
    IF v_seller_id IS NOT NULL AND v_budget.seller_id IS DISTINCT FROM v_seller_id THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a convertir presupuestos de otro asesor.';
    END IF;
    IF v_distributor_id IS NOT NULL AND v_budget.distributor_id IS DISTINCT FROM v_distributor_id THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a convertir este presupuesto de distribuidor.';
    END IF;
  END IF;

  IF v_budget.status = 'rejected' THEN
    RAISE EXCEPTION 'No se puede convertir un presupuesto rechazado.';
  END IF;

  IF v_budget.status = 'converted' THEN
    RAISE EXCEPTION 'Este presupuesto ya fue convertido en su totalidad previamente.';
  END IF;

  IF COALESCE(v_budget.is_historical_reconciliation_pending, false) OR v_budget.id = '7d53d595-a05b-4faf-8c16-bfa55c0a658e'::UUID THEN
    RAISE EXCEPTION 'Presupuesto histórico pendiente de conciliación. Conversión bloqueada.';
  END IF;

  IF p_items_to_convert IS NULL OR jsonb_array_length(p_items_to_convert) = 0 THEN
    RAISE EXCEPTION 'No se indicaron ítems para convertir.';
  END IF;

  -- D. AGREGACIÓN PREVIA DE CANTIDADES POR ÍTEM
  FOR v_req_item IN SELECT * FROM jsonb_array_elements(p_items_to_convert) LOOP
    v_item_id := (v_req_item->>'budgetItemId')::UUID;
    IF v_item_id IS NULL THEN
      RAISE EXCEPTION 'Cada ítem a convertir debe especificar su budgetItemId.';
    END IF;

    IF (v_req_item->>'quantity') IS NULL 
       OR (v_req_item->>'quantity')::NUMERIC <= 0 
       OR ((v_req_item->>'quantity')::NUMERIC % 1) <> 0 THEN
      RAISE EXCEPTION 'Cantidad inválida para el ítem %. Debe ser un entero positivo.', v_item_id;
    END IF;

    v_requested_qty := (v_req_item->>'quantity')::INTEGER;
    v_curr_agg := COALESCE((v_items_aggregated->>v_item_id::TEXT)::INTEGER, 0);
    v_items_aggregated := jsonb_set(v_items_aggregated, ARRAY[v_item_id::TEXT], to_jsonb(v_curr_agg + v_requested_qty));
  END LOOP;

  -- E. BLOQUEO DE ÍTEMS Y VALIDACIÓN TOTAL CONTRA SALDO DISPONIBLE
  PERFORM 1 FROM public.budget_items WHERE budget_id = p_budget_id FOR UPDATE;

  FOR v_item_id IN SELECT DISTINCT (key)::UUID FROM jsonb_each(v_items_aggregated) LOOP
    SELECT * INTO v_b_item
    FROM public.budget_items
    WHERE id = v_item_id AND budget_id = p_budget_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El ítem % no pertenece al presupuesto %.', v_item_id, p_budget_id;
    END IF;

    v_available_qty := v_b_item.quantity - COALESCE(v_b_item.converted_quantity, 0);
    v_curr_agg := (v_items_aggregated->>v_item_id::TEXT)::INTEGER;

    IF v_curr_agg > v_available_qty THEN
      RAISE EXCEPTION 'Saldo insuficiente para "%". Solicitado acumulado: %, Saldo disponible: %',
        v_b_item.product_name, v_curr_agg, v_available_qty;
    END IF;
  END LOOP;

  -- Allocate the issued net total once, preserving every cent across partial orders.
  WITH lines AS (
    SELECT id, quantity * unit_price AS gross,
      SUM(quantity * unit_price) OVER () AS gross_total,
      SUM(quantity * unit_price) OVER (ORDER BY id) AS gross_through
    FROM public.budget_items WHERE budget_id = p_budget_id
  )
  SELECT jsonb_object_agg(id, CASE WHEN gross_total = 0 THEN 0 ELSE
    ROUND(v_budget.total_amount * gross_through / gross_total, 2) -
    ROUND(v_budget.total_amount * (gross_through - gross) / gross_total, 2)
  END) INTO v_net_allocations FROM lines;

  -- F. ACTUALIZAR SALDOS CONVERTIDOS EN BUDGET_ITEMS
  FOR v_item_id IN SELECT DISTINCT (key)::UUID FROM jsonb_each(v_items_aggregated) LOOP
    v_curr_agg := (v_items_aggregated->>v_item_id::TEXT)::INTEGER;
    UPDATE public.budget_items
    SET converted_quantity = COALESCE(converted_quantity, 0) + v_curr_agg
    WHERE id = v_item_id;
  END LOOP;

  -- G. INSERTAR PEDIDO / VENTA EN 'orders'
  INSERT INTO public.orders (
    budget_id,
    client_id,
    seller_id,
    status,
    total_amount,
    notes,
    sale_channel,
    order_type,
    idempotency_key,
    distributor_id
  ) VALUES (
    p_budget_id,
    v_budget.client_id,
    v_budget.seller_id,
    CASE WHEN p_sale_channel = 'distributor' THEN 'completed' ELSE 'pending' END,
    0,
    COALESCE(NULLIF(TRIM(p_notes), ''), 'Pedido generado desde presupuesto N° ' || v_budget.budget_number),
    COALESCE(p_sale_channel, 'direct'),
    CASE WHEN p_sale_channel = 'distributor' THEN 'distributor_sale' ELSE 'factory' END,
    p_idempotency_key,
    v_budget.distributor_id
  ) RETURNING * INTO v_new_order;

  -- H. INSERTAR ÍTEMS DEL PEDIDO
  FOR v_req_item IN SELECT * FROM jsonb_array_elements(p_items_to_convert) LOOP
    v_item_id := (v_req_item->>'budgetItemId')::UUID;
    v_requested_qty := (v_req_item->>'quantity')::INTEGER;

    SELECT * INTO v_b_item FROM public.budget_items WHERE id = v_item_id;

    v_line_net := (v_net_allocations->>v_item_id::TEXT)::NUMERIC;
    v_processed_qty := COALESCE((v_processed_quantities->>v_item_id::TEXT)::INTEGER, 0);
    v_previous_qty := COALESCE(v_b_item.converted_quantity, 0) -
      (v_items_aggregated->>v_item_id::TEXT)::INTEGER + v_processed_qty;
    v_unit_price := ROUND(v_line_net / v_b_item.quantity, 2);
    v_total_price := ROUND(v_line_net * (v_previous_qty + v_requested_qty) / v_b_item.quantity, 2)
      - ROUND(v_line_net * v_previous_qty / v_b_item.quantity, 2);
    v_processed_quantities := jsonb_set(v_processed_quantities, ARRAY[v_item_id::TEXT],
      to_jsonb(v_processed_qty + v_requested_qty));
    v_order_total := v_order_total + v_total_price;

    INSERT INTO public.order_items (
      order_id,
      budget_item_id,
      product_id,
      variant_id,
      product_name,
      variant_name,
      quantity,
      unit_price,
      total_price,
      factory_notes
    ) VALUES (
      v_new_order.id,
      v_item_id,
      v_b_item.product_id,
      v_b_item.variant_id,
      v_b_item.product_name,
      v_b_item.variant_name,
      v_requested_qty,
      v_unit_price,
      v_total_price,
      NULLIF(TRIM(v_req_item->>'factoryNotes'), '')
    );
  END LOOP;

  -- I. ACTUALIZAR MONTO TOTAL DEL PEDIDO
  UPDATE public.orders
  SET total_amount = v_order_total
  WHERE id = v_new_order.id;

  -- J. EVALUAR ESTADO DEL PRESUPUESTO
  FOR v_b_item IN SELECT * FROM public.budget_items WHERE budget_id = p_budget_id LOOP
    IF (v_b_item.quantity - COALESCE(v_b_item.converted_quantity, 0)) > 0 THEN
      v_is_fully_converted := false;
      EXIT;
    END IF;
  END LOOP;

  IF v_is_fully_converted THEN
    v_new_status := CASE WHEN p_sale_channel = 'distributor' THEN 'distributor_sale' ELSE 'converted' END;
  ELSE
    v_new_status := 'partially_converted';
  END IF;

  UPDATE public.budgets
  SET status = v_new_status, updated_at = NOW()
  WHERE id = p_budget_id;

  UPDATE public.clients
  SET status = 'ganado', updated_at = NOW()
  WHERE id = v_budget.client_id;

  -- K. REGISTRAR HISTORIAL CRM
  INSERT INTO public.client_notes (
    client_id,
    seller_id,
    content,
    contacted_at,
    note_type,
    budget_id,
    order_id
  ) VALUES (
    v_budget.client_id,
    v_budget.seller_id,
    CASE 
      WHEN p_sale_channel = 'distributor' THEN 'Venta por distribuidor registrada (N° Pedido ' || v_new_order.order_number || ') por $' || v_order_total
      ELSE 'Pedido de fábrica N° ' || v_new_order.order_number || ' generado (' || CASE WHEN v_is_fully_converted THEN 'Total' ELSE 'Parcial' END || ') por $' || v_order_total
    END,
    NOW(),
    CASE WHEN p_sale_channel = 'distributor' THEN 'distributor_sale' ELSE 'order_created' END,
    p_budget_id,
    v_new_order.id
  );

  -- CONTRATO NORMALIZADO: Devuelve 'id' y 'order_id' para compatibilidad total con el frontend
  v_result := jsonb_build_object(
    'success', true,
    'id', v_new_order.id,
    'order_id', v_new_order.id,
    'order_number', v_new_order.order_number,
    'budget_id', p_budget_id,
    'budget_status', v_new_status,
    'is_fully_converted', v_is_fully_converted,
    'total_amount', v_order_total
  );

  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    UPDATE public.idempotency_records
    SET status = 'completed',
        response_body = v_result,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND operation_type = 'convert_budget'
      AND idempotency_key = p_idempotency_key;
  END IF;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    UPDATE public.idempotency_records
    SET status = 'failed',
        error_message = SQLERRM,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND operation_type = 'convert_budget'
      AND idempotency_key = p_idempotency_key;
  END IF;
  RAISE;
END;
$$;

-- 11. FUNCIÓN RPC TRANSACCIONAL: CANCELACIÓN DE PEDIDO Y RESTAURACIÓN DE SALDOS
CREATE OR REPLACE FUNCTION public.cancel_order_transactional(
  p_user_id UUID,
  p_order_id UUID,
  p_cancellation_reason TEXT,
  p_idempotency_key TEXT,
  p_request_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_seller RECORD;
  v_existing_rec RECORD;
  v_order RECORD;
  v_oi RECORD;
  v_budget RECORD;
  v_any_remaining_active_orders BOOLEAN := false;
  v_result JSONB;
BEGIN
  -- A. AUTORIZACIÓN ESTRICTA
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    SELECT * INTO v_seller FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: El usuario no posee un rol comercial activo.';
    END IF;
  END IF;

  -- B. IDEMPOTENCIA: Adquisición atómica y resolución de conflictos de concurrencia
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
    VALUES (p_user_id, 'cancel_order', p_idempotency_key, p_request_hash, 'processing')
    ON CONFLICT (user_id, operation_type, idempotency_key) DO NOTHING
    RETURNING * INTO v_existing_rec;

    IF NOT FOUND OR v_existing_rec.id IS NULL THEN
      SELECT * INTO v_existing_rec
      FROM public.idempotency_records
      WHERE user_id = p_user_id
        AND operation_type = 'cancel_order'
        AND idempotency_key = p_idempotency_key
      FOR UPDATE;

      IF FOUND THEN
        IF v_existing_rec.request_hash <> p_request_hash THEN
          RAISE EXCEPTION 'Conflicto de idempotencia: misma clave con diferente contenido.';
        END IF;

        IF v_existing_rec.status = 'completed' THEN
          RETURN v_existing_rec.response_body;
        ELSIF v_existing_rec.status = 'processing' THEN
          RAISE EXCEPTION 'Cancelación en curso. Por favor espere.';
        ELSIF v_existing_rec.status = 'failed' THEN
          RAISE EXCEPTION 'La cancelación previa con esta clave falló: %', COALESCE(v_existing_rec.error_message, 'Error desconocido');
        END IF;
      ELSE
        -- Si la transacción previa abortó sin completar, adquirir el registro ganador antes de continuar
        INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
        VALUES (p_user_id, 'cancel_order', p_idempotency_key, p_request_hash, 'processing')
        RETURNING * INTO v_existing_rec;
      END IF;
    END IF;
  END IF;

  -- Mantener el mismo orden que conversión: presupuesto, ítems, pedido.
  SELECT budget_id INTO v_order FROM public.orders WHERE id = p_order_id;
  IF FOUND AND v_order.budget_id IS NOT NULL THEN
    PERFORM 1 FROM public.budgets WHERE id = v_order.budget_id FOR UPDATE;
    PERFORM 1 FROM public.budget_items WHERE budget_id = v_order.budget_id ORDER BY id FOR UPDATE;
  END IF;

  -- C. BLOQUEO DE LA ORDEN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado.';
  END IF;

  IF NOT v_is_admin AND v_order.seller_id IS DISTINCT FROM v_seller.id THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a cancelar pedidos de otro asesor.';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'El pedido ya se encuentra cancelado.';
  END IF;

  IF v_order.status = 'delivered' THEN
    RAISE EXCEPTION 'No se puede cancelar un pedido que ya fue entregado.';
  END IF;

  -- D. CANCELAR ORDEN
  UPDATE public.orders
  SET status = 'cancelled',
      cancelled_at = NOW(),
      cancellation_reason = NULLIF(TRIM(p_cancellation_reason), ''),
      updated_at = NOW()
  WHERE id = p_order_id;

  -- E. RESTAURAR SALDOS EXACTAMENTE UNA VEZ
  FOR v_oi IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
    IF v_oi.budget_item_id IS NOT NULL THEN
      UPDATE public.budget_items
      SET converted_quantity = GREATEST(0, COALESCE(converted_quantity, 0) - v_oi.quantity)
      WHERE id = v_oi.budget_item_id;
    END IF;
  END LOOP;

  -- F. RESTAURAR ESTADO DEL PRESUPUESTO
  IF v_order.budget_id IS NOT NULL THEN
    SELECT * INTO v_budget
    FROM public.budgets
    WHERE id = v_order.budget_id
    FOR UPDATE;

    IF FOUND THEN
      SELECT EXISTS (
        SELECT 1 FROM public.orders
        WHERE budget_id = v_order.budget_id
          AND id <> p_order_id
          AND status <> 'cancelled'
      ) INTO v_any_remaining_active_orders;

      IF v_any_remaining_active_orders THEN
        UPDATE public.budgets
        SET status = 'partially_converted', updated_at = NOW()
        WHERE id = v_order.budget_id;
      ELSE
        UPDATE public.budgets
        SET status = 'accepted', updated_at = NOW()
        WHERE id = v_order.budget_id;
      END IF;
    END IF;
  END IF;

  -- G. HISTORIAL CRM
  INSERT INTO public.client_notes (
    client_id,
    seller_id,
    content,
    contacted_at,
    note_type,
    order_id,
    budget_id
  ) VALUES (
    v_order.client_id,
    v_order.seller_id,
    'El pedido N° ' || v_order.order_number || ' fue cancelado. Motivo: ' || COALESCE(NULLIF(TRIM(p_cancellation_reason), ''), 'Sin motivo especificado'),
    NOW(),
    'order_cancelled',
    p_order_id,
    v_order.budget_id
  );

  v_result := jsonb_build_object(
    'success', true,
    'id', p_order_id,
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'status', 'cancelled',
    'cancelled_at', NOW()
  );

  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    UPDATE public.idempotency_records
    SET status = 'completed',
        response_body = v_result,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND operation_type = 'cancel_order'
      AND idempotency_key = p_idempotency_key;
  END IF;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    UPDATE public.idempotency_records
    SET status = 'failed',
        error_message = SQLERRM,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND operation_type = 'cancel_order'
      AND idempotency_key = p_idempotency_key;
  END IF;
  RAISE;
END;
$$;

-- 12. FUNCIÓN RPC: PUBLICACIÓN EXPLÍCITA DE PRESUPUESTO
CREATE OR REPLACE FUNCTION public.publish_budget_transactional(
  p_user_id UUID,
  p_budget_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_seller RECORD;
  v_budget RECORD;
  v_token UUID;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT * INTO v_seller FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: El usuario no posee un rol comercial activo.';
    END IF;
  END IF;

  SELECT * INTO v_budget FROM public.budgets WHERE id = p_budget_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado.';
  END IF;

  IF NOT v_is_admin AND v_budget.seller_id IS DISTINCT FROM v_seller.id THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a publicar presupuestos de otro asesor.';
  END IF;

  v_token := COALESCE(v_budget.public_token, gen_random_uuid());

  UPDATE public.budgets
  SET 
    public_status = 'published',
    public_token = v_token,
    status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END,
    sent_at = COALESCE(sent_at, NOW()),
    updated_at = NOW()
  WHERE id = p_budget_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', p_budget_id,
    'public_status', 'published',
    'public_token', v_token,
    'status', CASE WHEN v_budget.status = 'draft' THEN 'sent' ELSE v_budget.status END
  );
END;
$$;

-- 13. FUNCIÓN RPC: REVOCACIÓN EXPLÍCITA DE PRESUPUESTO
CREATE OR REPLACE FUNCTION public.revoke_budget_transactional(
  p_user_id UUID,
  p_budget_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_seller RECORD;
  v_budget RECORD;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT * INTO v_seller FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: El usuario no posee un rol comercial activo.';
    END IF;
  END IF;

  SELECT * INTO v_budget FROM public.budgets WHERE id = p_budget_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado.';
  END IF;

  IF NOT v_is_admin AND v_budget.seller_id IS DISTINCT FROM v_seller.id THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a revocar presupuestos de otro asesor.';
  END IF;

  UPDATE public.budgets
  SET 
    public_status = 'revoked',
    updated_at = NOW()
  WHERE id = p_budget_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', p_budget_id,
    'public_status', 'revoked'
  );
END;
$$;

-- Restrict every overload, including functions left by previous releases.
DO $$
DECLARE fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      'create_budget_transactional', 'convert_budget_transactional',
      'cancel_order_transactional', 'publish_budget_transactional',
      'revoke_budget_transactional', 'increment_budget_view'
    )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
  END LOOP;
END;
$$;

COMMIT;
