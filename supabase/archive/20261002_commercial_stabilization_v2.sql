-- =========================================================================
-- MIGRACIÓN ADITIVA Y RETROCOMPATIBLE V2: ESTABILIZACIÓN MÓDULO COMERCIAL
-- FiveSaint - Sprint de Estabilización Integral
-- =========================================================================
-- Reglas obligatorias aplicadas:
-- 1. Todas las sentencias son aditivas (ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS).
-- 2. Cero operaciones destructivas: no se eliminan tablas, columnas ni filas.
-- 3. Inclusión de transaccionalidad real en PostgreSQL para Creación, Conversión y Cancelación.
-- 4. Idempotencia y control de concurrencia mediante tabla dedicada 'idempotency_records'.
-- 5. Seguridad: search_path = public, pg_temp en todas las funciones SECURITY DEFINER.
-- =========================================================================

-- 1. TABLA DEDICADA DE IDEMPOTENCIA
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

CREATE INDEX IF NOT EXISTS idx_idempotency_lookup 
  ON public.idempotency_records(user_id, operation_type, idempotency_key);

-- 2. EXTENSIONES ADITIVAS A 'budgets'
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS public_status VARCHAR(20) DEFAULT 'published',
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

-- 3. EXTENSIONES ADITIVAS A 'budget_items'
ALTER TABLE public.budget_items
  ADD COLUMN IF NOT EXISTS converted_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_price_reason TEXT,
  ADD COLUMN IF NOT EXISTS manual_price_authorized_by TEXT,
  ADD COLUMN IF NOT EXISTS is_exceptional_discount BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS exceptional_discount_reason TEXT;

-- 4. EXTENSIONES ADITIVAS A 'orders'
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sale_channel VARCHAR(30) DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS order_type VARCHAR(30) DEFAULT 'factory',
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS distributor_id UUID REFERENCES public.distributors(id) ON DELETE SET NULL;

-- 5. EXTENSIONES ADITIVAS A 'order_items'
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS budget_item_id UUID REFERENCES public.budget_items(id) ON DELETE SET NULL;

-- 6. ÍNDICES DE RENDIMIENTO Y INTEGRIDAD
CREATE INDEX IF NOT EXISTS idx_budgets_public_token ON public.budgets(public_token);
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON public.budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_seller_id ON public.budgets(seller_id);
CREATE INDEX IF NOT EXISTS idx_budgets_idempotency_key ON public.budgets(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_orders_budget_id ON public.orders(budget_id);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_budget_item_id ON public.order_items(budget_item_id);

-- 7. FUNCIÓN RPC: INCREMENTO ATÓMICO DE VISUALIZACIONES (SIN AFECTAR CRM)
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
  UPDATE public.budgets
  SET 
    view_count = COALESCE(view_count, 0) + 1,
    first_viewed_at = COALESCE(first_viewed_at, viewed_at, NOW()),
    last_viewed_at = NOW()
  WHERE id = p_budget_id
  RETURNING view_count, first_viewed_at, last_viewed_at
  INTO v_view_count, v_first_viewed_at, v_last_viewed_at;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Presupuesto no encontrado');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'view_count', v_view_count,
    'first_viewed_at', v_first_viewed_at,
    'last_viewed_at', v_last_viewed_at
  );
END;
$$;

-- 8. FUNCIÓN RPC TRANSACCIONAL: CREACIÓN DE PRESUPUESTO
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
  p_seller_id UUID,
  p_total_amount NUMERIC(12,2),
  p_subtotal_amount NUMERIC(12,2),
  p_discount_amount NUMERIC(12,2),
  p_tax_amount NUMERIC(12,2)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_rec RECORD;
  v_new_budget RECORD;
  v_item JSONB;
  v_item_idx INTEGER := 0;
  v_result JSONB;
BEGIN
  -- A. Verificación de Idempotencia
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT * INTO v_existing_rec
    FROM public.idempotency_records
    WHERE user_id = p_user_id
      AND operation_type = 'create_budget'
      AND idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF FOUND THEN
      IF v_existing_rec.request_hash <> p_request_hash THEN
        RAISE EXCEPTION 'Conflicto de idempotencia: la misma clave fue enviada con un contenido diferente.';
      END IF;

      IF v_existing_rec.status = 'completed' THEN
        RETURN v_existing_rec.response_body;
      ELSIF v_existing_rec.status = 'processing' THEN
        RAISE EXCEPTION 'Operación en curso. Por favor espere el resultado de la solicitud anterior.';
      END IF;
    ELSE
      INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
      VALUES (p_user_id, 'create_budget', p_idempotency_key, p_request_hash, 'processing');
    END IF;
  END IF;

  -- B. Validar existencia del cliente
  IF NOT EXISTS (SELECT 1 FROM public.clients WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'El cliente especificado no existe.';
  END IF;

  -- C. Validar ítems
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'No se puede crear un presupuesto sin ítems.';
  END IF;

  -- D. Insertar cabecera de presupuesto
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
    p_seller_id,
    'draft',
    p_total_amount,
    p_subtotal_amount,
    p_discount_amount,
    p_tax_amount,
    21.00,
    NULLIF(TRIM(p_notes), ''),
    NULLIF(TRIM(p_public_notes), ''),
    COALESCE(p_discounts, '[]'::jsonb),
    'published',
    p_client_snapshot,
    p_seller_snapshot,
    p_calculation_snapshot,
    1,
    p_idempotency_key,
    'direct'
  )
  RETURNING * INTO v_new_budget;

  -- E. Insertar ítems asociados
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_idx := v_item_idx + 1;

    -- Validaciones estrictas por ítem
    IF (v_item->>'quantity')::NUMERIC <= 0 OR (v_item->>'unitPrice')::NUMERIC < 0 THEN
      RAISE EXCEPTION 'Ítem en posición % contiene cantidad o precio no válido.', v_item_idx;
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

  -- F. Registrar anotación en historial CRM
  INSERT INTO public.client_notes (
    client_id,
    seller_id,
    content,
    contacted_at,
    note_type,
    budget_id
  ) VALUES (
    p_client_id,
    p_seller_id,
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

  -- G. Completar registro de idempotencia
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

-- 9. FUNCIÓN RPC TRANSACCIONAL: CONVERSIÓN DE PRESUPUESTO A PEDIDO / VENTA DISTRIBUIDOR
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
  v_remaining_after INTEGER;
  v_result JSONB;
  v_items_aggregated JSONB := '{}'::jsonb;
  v_curr_agg INTEGER;
  v_new_status VARCHAR(30);
  v_discount NUMERIC;
BEGIN
  -- A. Idempotencia
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
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
        RAISE EXCEPTION 'Conversión en curso. Por favor no reintente simultáneamente.';
      END IF;
    ELSE
      INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
      VALUES (p_user_id, 'convert_budget', p_idempotency_key, p_request_hash, 'processing');
    END IF;
  END IF;

  -- B. Bloqueo transaccional de cabecera de presupuesto (FOR UPDATE)
  SELECT * INTO v_budget
  FROM public.budgets
  WHERE id = p_budget_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado.';
  END IF;

  IF v_budget.status = 'rejected' THEN
    RAISE EXCEPTION 'No se puede convertir un presupuesto rechazado.';
  END IF;

  IF v_budget.status = 'converted' THEN
    RAISE EXCEPTION 'Este presupuesto ya fue convertido en su totalidad previamente.';
  END IF;

  IF COALESCE(v_budget.is_historical_reconciliation_pending, false) THEN
    RAISE EXCEPTION 'Presupuesto histórico pendiente de conciliación. Conversión bloqueada hasta verificación manual.';
  END IF;

  IF p_items_to_convert IS NULL OR jsonb_array_length(p_items_to_convert) = 0 THEN
    RAISE EXCEPTION 'No se indicaron ítems para convertir.';
  END IF;

  -- C. Agregación previa de cantidades solicitadas para detectar ítems duplicados en el request
  FOR v_req_item IN SELECT * FROM jsonb_array_elements(p_items_to_convert) LOOP
    v_item_id := (v_req_item->>'budgetItemId')::UUID;
    IF v_item_id IS NULL THEN
      RAISE EXCEPTION 'Cada ítem a convertir debe especificar su budgetItemId correspondiente.';
    END IF;

    -- Validar que la cantidad sea un entero estrictamente positivo
    IF (v_req_item->>'quantity') IS NULL 
       OR (v_req_item->>'quantity')::NUMERIC <= 0 
       OR ((v_req_item->>'quantity')::NUMERIC % 1) <> 0 THEN
      RAISE EXCEPTION 'Cantidad inválida para el ítem %. Debe ser un número entero positivo.', v_item_id;
    END IF;

    v_requested_qty := (v_req_item->>'quantity')::INTEGER;
    v_curr_agg := COALESCE((v_items_aggregated->>v_item_id::TEXT)::INTEGER, 0);
    v_items_aggregated := jsonb_set(v_items_aggregated, ARRAY[v_item_id::TEXT], to_jsonb(v_curr_agg + v_requested_qty));
  END LOOP;

  -- D. Bloqueo transaccional de ítems y validación estricta de saldo (FOR UPDATE)
  PERFORM 1 FROM public.budget_items WHERE budget_id = p_budget_id FOR UPDATE;

  -- E. Crear Pedido en 'orders'
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
    0, -- Se actualizará al sumar los ítems validados
    COALESCE(NULLIF(TRIM(p_notes), ''), 'Pedido generado desde presupuesto N° ' || v_budget.budget_number),
    COALESCE(p_sale_channel, 'direct'),
    CASE WHEN p_sale_channel = 'distributor' THEN 'distributor_sale' ELSE 'factory' END,
    p_idempotency_key,
    v_budget.distributor_id
  ) RETURNING * INTO v_new_order;

  -- F. Procesar cada ítem del request
  FOR v_req_item IN SELECT * FROM jsonb_array_elements(p_items_to_convert) LOOP
    v_item_id := (v_req_item->>'budgetItemId')::UUID;
    v_requested_qty := (v_req_item->>'quantity')::INTEGER;

    SELECT * INTO v_b_item
    FROM public.budget_items
    WHERE id = v_item_id AND budget_id = p_budget_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El ítem % no pertenece al presupuesto %.', v_item_id, p_budget_id;
    END IF;

    v_available_qty := v_b_item.quantity - COALESCE(v_b_item.converted_quantity, 0);

    -- Verificar contra el total agregado acumulado
    IF (v_items_aggregated->>v_item_id::TEXT)::INTEGER > v_available_qty THEN
      RAISE EXCEPTION 'Saldo insuficiente para "%". Solicitado total: %, Saldo disponible: %',
        v_b_item.product_name, (v_items_aggregated->>v_item_id::TEXT)::INTEGER, v_available_qty;
    END IF;

    -- Calcular precio unitario neto desde el presupuesto (nunca desde el cliente)
    v_unit_price := v_b_item.unit_price;
    IF v_budget.discounts IS NOT NULL AND jsonb_array_length(v_budget.discounts) > 0 THEN
      FOR v_discount IN SELECT jsonb_array_elements_text(v_budget.discounts)::NUMERIC LOOP
        IF v_discount > 0 THEN
          v_unit_price := ROUND(v_unit_price * (1 - v_discount / 100.0), 2);
        END IF;
      END LOOP;
    END IF;

    v_total_price := ROUND(v_requested_qty * v_unit_price, 2);
    v_order_total := v_order_total + v_total_price;

    -- Actualizar converted_quantity en budget_items
    UPDATE public.budget_items
    SET converted_quantity = COALESCE(converted_quantity, 0) + v_requested_qty
    WHERE id = v_item_id;

    -- Insertar ítem de pedido vinculado
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

  -- G. Actualizar monto total del pedido
  UPDATE public.orders
  SET total_amount = v_order_total
  WHERE id = v_new_order.id;

  -- H. Evaluar si el presupuesto quedó completamente convertido o parcialmente convertido
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
  SET status = v_new_status,
      updated_at = NOW()
  WHERE id = p_budget_id;

  -- I. Actualizar estado del cliente a 'ganado'
  UPDATE public.clients
  SET status = 'ganado',
      updated_at = NOW()
  WHERE id = v_budget.client_id;

  -- J. Registrar nota en CRM
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

  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_new_order.id,
    'order_number', v_new_order.order_number,
    'budget_id', p_budget_id,
    'budget_status', v_new_status,
    'is_fully_converted', v_is_fully_converted,
    'total_amount', v_order_total
  );

  -- K. Finalizar idempotencia
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

-- 10. FUNCIÓN RPC TRANSACCIONAL: CANCELACIÓN DE PEDIDO Y RESTAURACIÓN DE SALDOS
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
  v_existing_rec RECORD;
  v_order RECORD;
  v_oi RECORD;
  v_budget RECORD;
  v_any_remaining_active_orders BOOLEAN := false;
  v_result JSONB;
BEGIN
  -- A. Idempotencia
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT * INTO v_existing_rec
    FROM public.idempotency_records
    WHERE user_id = p_user_id
      AND operation_type = 'cancel_order'
      AND idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF FOUND THEN
      IF v_existing_rec.request_hash <> p_request_hash THEN
        RAISE EXCEPTION 'Conflicto de idempotencia: misma clave con diferente contenido de cancelación.';
      END IF;

      IF v_existing_rec.status = 'completed' THEN
        RETURN v_existing_rec.response_body;
      END IF;
    ELSE
      INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
      VALUES (p_user_id, 'cancel_order', p_idempotency_key, p_request_hash, 'processing');
    END IF;
  END IF;

  -- B. Bloqueo transaccional de orden
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado.';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'El pedido ya se encuentra cancelado.';
  END IF;

  IF v_order.status = 'delivered' THEN
    RAISE EXCEPTION 'No se puede cancelar un pedido que ya fue entregado.';
  END IF;

  -- C. Cancelar pedido
  UPDATE public.orders
  SET status = 'cancelled',
      cancelled_at = NOW(),
      cancellation_reason = NULLIF(TRIM(p_cancellation_reason), ''),
      updated_at = NOW()
  WHERE id = p_order_id;

  -- D. Restaurar saldo en budget_items asociados
  FOR v_oi IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
    IF v_oi.budget_item_id IS NOT NULL THEN
      UPDATE public.budget_items
      SET converted_quantity = GREATEST(0, COALESCE(converted_quantity, 0) - v_oi.quantity)
      WHERE id = v_oi.budget_item_id;
    END IF;
  END LOOP;

  -- E. Restaurar estado del presupuesto si corresponde
  IF v_order.budget_id IS NOT NULL THEN
    SELECT * INTO v_budget
    FROM public.budgets
    WHERE id = v_order.budget_id
    FOR UPDATE;

    IF FOUND THEN
      -- Verificar si quedan otras órdenes activas no canceladas vinculadas a este presupuesto
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

  -- F. Registrar anotación en historial CRM
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
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'status', 'cancelled',
    'cancelled_at', NOW()
  );

  -- G. Completar idempotencia
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
