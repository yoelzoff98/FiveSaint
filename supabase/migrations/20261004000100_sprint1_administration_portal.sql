-- =========================================================================
-- MIGRACIÓN ADITIVA: SPRINT 1 — PORTAL DE ADMINISTRACIÓN FIVESAINT
-- Fecha: 2026-10-04
-- =========================================================================
-- OBJETIVOS:
-- 1. Crear tabla 'administration_users' vinculada a Supabase Auth (auth.users).
--    - Incluye trazabilidad de altas/cambios (created_by, updated_by).
-- 2. Extender tabla 'budgets' con autoría explícita (created_by_user_id, creator_role),
--    preservando el vendedor asignado al cliente (seller_id) sin alteración de datos históricos.
-- 3. Actualizar funciones RPC transaccionales para autorizar explícitamente al rol Administración
--    (create_budget, convert_budget, cancel_order, publish_budget, revoke_budget).
-- 4. Mantener seguridad estricta: REVOKE ALL FROM PUBLIC, anon, authenticated; GRANT TO service_role.
-- =========================================================================

BEGIN;

-- 1. TABLA 'administration_users'
CREATE TABLE IF NOT EXISTS public.administration_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL CHECK (char_length(full_name) >= 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de consulta y rendimiento para administración
CREATE INDEX IF NOT EXISTS idx_administration_users_user_id ON public.administration_users(user_id);
CREATE INDEX IF NOT EXISTS idx_administration_users_active ON public.administration_users(is_active);
CREATE INDEX IF NOT EXISTS idx_administration_users_email ON public.administration_users(email);

-- 2. EXTENSIONES ADITIVAS A 'budgets' Y 'orders' (Trazabilidad y auditoría de autoría)
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS creator_role VARCHAR(50) DEFAULT 'seller',
  ADD COLUMN IF NOT EXISTS author_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_budgets_created_by ON public.budgets(created_by_user_id);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS status_updated_by_name TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS cancelled_by_name TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_status_updated_by ON public.orders(status_updated_by);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_by ON public.orders(cancelled_by);

-- 3. ACTUALIZACIÓN DE RPC: CREACIÓN DE PRESUPUESTOS (create_budget_transactional)
-- Permite que Administración y ADMIN creen presupuestos para cualquier cliente,
-- conservando el vendedor asignado al cliente (o asignando uno opcional) y guardando la autoría.
DROP FUNCTION IF EXISTS public.create_budget_transactional(UUID, UUID, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, UUID);

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
  p_seller_id UUID DEFAULT NULL,
  p_author_snapshot JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_is_administration BOOLEAN := false;
  v_seller_id UUID := NULL;
  v_client RECORD;
  v_existing_rec RECORD;
  v_new_budget RECORD;
  v_item JSONB;
  v_item_idx INTEGER := 0;
  v_effective_seller_id UUID;
  v_creator_role VARCHAR(50);
  v_result JSONB;
BEGIN
  -- A. AUTORIZACIÓN ESTRICTA EN SQL: Verificar identidad y rol activo
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    SELECT id INTO v_seller_id FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF v_seller_id IS NULL THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: El usuario no posee un rol comercial o administrativo activo.';
    END IF;
  END IF;

  -- B. Validar cliente y asignación
  SELECT * INTO v_client FROM public.clients WHERE id = p_client_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El cliente especificado no existe.';
  END IF;

  -- Un vendedor común solo puede presupuestar a sus propios clientes
  IF NOT v_is_admin AND NOT v_is_administration AND v_client.seller_id IS DISTINCT FROM v_seller_id THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a presupuestar clientes de otro asesor.';
  END IF;

  -- Determinar vendedor efectivo y rol del autor
  IF v_is_admin THEN
    v_effective_seller_id := COALESCE(p_seller_id, v_client.seller_id, NULL);
    v_creator_role := 'admin';
  ELSIF v_is_administration THEN
    v_effective_seller_id := COALESCE(p_seller_id, v_client.seller_id, NULL);
    v_creator_role := 'administration';
  ELSE
    v_effective_seller_id := v_seller_id;
    v_creator_role := 'seller';
  END IF;

  -- C. IDEMPOTENCIA: Adquisición atómica y resolución de conflictos de concurrencia
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
    VALUES (p_user_id, 'create_budget', p_idempotency_key, p_request_hash, 'processing')
    ON CONFLICT (user_id, operation_type, idempotency_key) DO NOTHING
    RETURNING * INTO v_existing_rec;

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
    created_by_user_id,
    creator_role,
    author_snapshot,
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
    p_user_id,
    v_creator_role,
    COALESCE(p_author_snapshot, jsonb_build_object('user_id', p_user_id, 'role', v_creator_role)),
    'draft',
    p_total_amount,
    p_subtotal_amount,
    p_discount_amount,
    p_tax_amount,
    COALESCE(p_tax_rate, 21.00),
    NULLIF(TRIM(p_notes), ''),
    NULLIF(TRIM(p_public_notes), ''),
    (jsonb_populate_record(NULL::public.budgets, jsonb_build_object('discounts', COALESCE(p_discounts, '[]'::jsonb)))).discounts,
    'draft',
    p_client_snapshot,
    p_seller_snapshot,
    p_calculation_snapshot,
    1,
    p_idempotency_key,
    'direct'
  ) RETURNING * INTO v_new_budget;

  -- F. Inserción de ítems
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_idx := v_item_idx + 1;

    IF (v_item->>'quantity')::NUMERIC <= 0 OR (v_item->>'unitPrice')::NUMERIC < 0 THEN
      RAISE EXCEPTION 'Ítem en posición % contiene cantidad o precio inválido.', v_item_idx;
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
      converted_quantity,
      is_manual,
      manual_price_reason,
      manual_price_authorized_by,
      is_exceptional_discount,
      exceptional_discount_reason
    ) VALUES (
      v_new_budget.id,
      CASE WHEN (v_item->>'productId') IS NOT NULL AND (v_item->>'productId') <> '' THEN (v_item->>'productId')::UUID ELSE NULL END,
      CASE WHEN (v_item->>'variantId') IS NOT NULL AND (v_item->>'variantId') <> '' THEN (v_item->>'variantId')::UUID ELSE NULL END,
      TRIM(v_item->>'productName'),
      NULLIF(TRIM(v_item->>'variantName'), ''),
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unitPrice')::NUMERIC,
      ((v_item->>'quantity')::NUMERIC * (v_item->>'unitPrice')::NUMERIC),
      0,
      COALESCE((v_item->>'isManual')::BOOLEAN, false),
      NULLIF(TRIM(v_item->>'manualPriceReason'), ''),
      NULLIF(TRIM(v_item->>'manualPriceAuthorizedBy'), ''),
      COALESCE((v_item->>'isExceptionalDiscount')::BOOLEAN, false),
      NULLIF(TRIM(v_item->>'exceptionalDiscountReason'), '')
    );
  END LOOP;

  -- G. Actualizar estado del cliente y registrar nota en CRM
  UPDATE public.clients
  SET status = 'presupuestado', updated_at = NOW()
  WHERE id = p_client_id AND status IN ('nuevo', 'contactado');

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
    'Presupuesto N° ' || v_new_budget.budget_number || ' emitido por $' || p_total_amount || 
      CASE WHEN v_creator_role = 'administration' THEN ' (Emitido por Administración)' 
           WHEN v_creator_role = 'admin' THEN ' (Emitido por Administración Central)' 
           ELSE '' END,
    NOW(),
    'budget_created',
    v_new_budget.id
  );

  v_result := jsonb_build_object(
    'success', true,
    'id', v_new_budget.id,
    'budget_number', v_new_budget.budget_number,
    'total_amount', v_new_budget.total_amount,
    'seller_id', v_effective_seller_id,
    'created_by_user_id', p_user_id,
    'creator_role', v_creator_role,
    'status', v_new_budget.status
  );

  -- H. Completar registro de idempotencia
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


-- 4. ACTUALIZACIÓN DE RPC: CONVERSIÓN DE PRESUPUESTO (convert_budget_transactional)
-- Autoriza tanto a Administración como a ADMIN, además de vendedores y distribuidores.
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
  v_is_administration BOOLEAN := false;
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
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    SELECT id INTO v_seller_id FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF v_seller_id IS NULL THEN
      SELECT id INTO v_distributor_id FROM public.distributors WHERE user_id = p_user_id AND is_active = true;
      IF v_distributor_id IS NULL THEN
        RAISE EXCEPTION 'ACCESO DENEGADO: El usuario no posee un rol comercial o administrativo activo.';
      END IF;
    END IF;
  END IF;

  -- B. IDEMPOTENCIA: Adquisición atómica
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
          RAISE EXCEPTION 'Conflicto de idempotencia: clave ya enviada con payload diferente.';
        END IF;

        IF v_existing_rec.status = 'completed' THEN
          RETURN v_existing_rec.response_body;
        ELSIF v_existing_rec.status = 'processing' THEN
          RAISE EXCEPTION 'Operación de conversión en curso. Por favor espere el resultado de la solicitud anterior.';
        ELSIF v_existing_rec.status = 'failed' THEN
          RAISE EXCEPTION 'La conversión previa con esta clave falló: %', COALESCE(v_existing_rec.error_message, 'Error desconocido');
        END IF;
      ELSE
        INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
        VALUES (p_user_id, 'convert_budget', p_idempotency_key, p_request_hash, 'processing')
        RETURNING * INTO v_existing_rec;
      END IF;
    END IF;
  END IF;

  -- C. OBTENER Y BLOQUEAR PRESUPUESTO
  SELECT * INTO v_budget FROM public.budgets WHERE id = p_budget_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado.';
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    IF v_seller_id IS NOT NULL AND v_budget.seller_id IS DISTINCT FROM v_seller_id THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a convertir presupuestos de otro asesor.';
    END IF;
    IF v_distributor_id IS NOT NULL AND v_budget.distributor_id IS DISTINCT FROM v_distributor_id THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a convertir presupuestos de otro distribuidor.';
    END IF;
  END IF;

  IF v_budget.status = 'rejected' THEN
    RAISE EXCEPTION 'No se puede convertir un presupuesto rechazado.';
  END IF;

  IF v_budget.status = 'converted' AND p_sale_channel <> 'distributor' THEN
    RAISE EXCEPTION 'El presupuesto ya fue completamente convertido previamente.';
  END IF;

  IF p_items_to_convert IS NULL OR jsonb_array_length(p_items_to_convert) = 0 THEN
    RAISE EXCEPTION 'Debe seleccionar al menos un ítem para convertir.';
  END IF;

  -- D. VALIDAR Y AGREGAR CANTIDADES SOLICITADAS
  FOR v_req_item IN SELECT * FROM jsonb_array_elements(p_items_to_convert) LOOP
    v_item_id := (v_req_item->>'budgetItemId')::UUID;
    v_requested_qty := (v_req_item->>'quantity')::INTEGER;

    IF v_requested_qty IS NULL OR v_requested_qty <= 0 THEN
      RAISE EXCEPTION 'Cantidad a convertir inválida para el ítem %: debe ser un número entero positivo.', v_item_id;
    END IF;

    v_curr_agg := COALESCE((v_items_aggregated->>v_item_id::TEXT)::INTEGER, 0);
    v_items_aggregated := jsonb_set(v_items_aggregated, ARRAY[v_item_id::TEXT], to_jsonb(v_curr_agg + v_requested_qty));
  END LOOP;

  -- E. BLOQUEO FOR UPDATE Y VALIDACIÓN DE SALDOS DISPONIBLES EN ORDEN DETERMINISTA ASCENDENTE
  FOR v_item_id IN
    SELECT iid FROM (SELECT (jsonb_object_keys(v_items_aggregated))::UUID AS iid) sub ORDER BY iid ASC
  LOOP
    v_requested_qty := (v_items_aggregated->>v_item_id::TEXT)::INTEGER;

    SELECT * INTO v_b_item FROM public.budget_items WHERE id = v_item_id AND budget_id = p_budget_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'El ítem % no pertenece al presupuesto especificado.', v_item_id;
    END IF;

    v_available_qty := v_b_item.quantity - COALESCE(v_b_item.converted_quantity, 0);
    IF v_requested_qty > v_available_qty THEN
      RAISE EXCEPTION 'Saldo insuficiente para "%". Solicitado acumulado: %, Saldo disponible: %',
        v_b_item.product_name, v_requested_qty, v_available_qty;
    END IF;
  END LOOP;

  -- F. ASIGNACIÓN NETO DE CÁLCULO
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

  -- G. INSERTAR ORDEN
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
    distributor_id,
    status_updated_at,
    status_updated_by
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
    v_budget.distributor_id,
    NOW(),
    p_user_id
  ) RETURNING * INTO v_new_order;

  -- H. ACTUALIZAR SALDOS CONVERTIDOS EN BUDGET_ITEMS
  FOR v_item_id IN SELECT (jsonb_object_keys(v_items_aggregated))::UUID LOOP
    v_requested_qty := (v_items_aggregated->>v_item_id::TEXT)::INTEGER;
    UPDATE public.budget_items
    SET converted_quantity = COALESCE(converted_quantity, 0) + v_requested_qty
    WHERE id = v_item_id;
  END LOOP;

  -- I. INSERTAR ÍTEMS DEL PEDIDO
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

  -- J. ACTUALIZAR TOTAL DE LA ORDEN
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

  -- K. CRM HISTORY
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


-- 5. ACTUALIZACIÓN DE RPC: CANCELACIÓN DE PEDIDOS (cancel_order_transactional)
-- Permite que Administración y ADMIN cancelen pedidos y restauren unidades de saldo.
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
  v_is_administration BOOLEAN := false;
  v_seller_id UUID := NULL;
  v_existing_rec RECORD;
  v_order_meta RECORD;
  v_order RECORD;
  v_oi RECORD;
  v_budget RECORD;
  v_any_remaining_active_orders BOOLEAN := false;
  v_result JSONB;
BEGIN
  -- A. AUTORIZACIÓN ESTRICTA
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    SELECT id INTO v_seller_id FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF v_seller_id IS NULL THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: El usuario no posee un rol comercial o administrativo activo.';
    END IF;
  END IF;

  -- B. IDEMPOTENCIA
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
          RAISE EXCEPTION 'Operación de cancelación en curso. Por favor espere.';
        ELSIF v_existing_rec.status = 'failed' THEN
          RAISE EXCEPTION 'La cancelación previa con esta clave falló: %', COALESCE(v_existing_rec.error_message, 'Error desconocido');
        END IF;
      ELSE
        INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
        VALUES (p_user_id, 'cancel_order', p_idempotency_key, p_request_hash, 'processing')
        RETURNING * INTO v_existing_rec;
      END IF;
    END IF;
  END IF;

  -- C. IDENTIFICACIÓN Y ADQUISICIÓN DE BLOQUEOS EN ORDEN GLOBAL UNIFORME
  -- Jerarquía estricta para evitar interbloqueos (deadlocks) con conversiones concurrentes:
  -- 1° budgets (FOR UPDATE)
  -- 2° budget_items ordenados por id ASC (FOR UPDATE)
  -- 3° orders (FOR UPDATE)

  -- Lectura previa de metadatos de la orden sin bloqueo exclusivo para identificar el presupuesto asociado
  SELECT budget_id, seller_id, status
  INTO v_order_meta
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El pedido especificado no existe.';
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration AND v_order_meta.seller_id IS DISTINCT FROM v_seller_id THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a cancelar pedidos de otro asesor.';
  END IF;

  -- 1° Bloquear Presupuesto asociado si existe (mismo orden que convert_budget_transactional)
  IF v_order_meta.budget_id IS NOT NULL THEN
    SELECT * INTO v_budget FROM public.budgets WHERE id = v_order_meta.budget_id FOR UPDATE;
  END IF;

  -- 2° Bloquear Ítems de presupuesto involucrados en orden uniforme ascendente por ID
  PERFORM 1
  FROM public.budget_items bi
  WHERE bi.id IN (
    SELECT oi.budget_item_id
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id AND oi.budget_item_id IS NOT NULL
  )
  ORDER BY bi.id ASC
  FOR UPDATE;

  -- 3° Bloquear Orden
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'El pedido ya se encuentra cancelado.';
  END IF;

  IF v_order.status = 'delivered' THEN
    RAISE EXCEPTION 'No se puede cancelar un pedido que ya fue entregado al cliente.';
  END IF;

  -- D. ACTUALIZAR ESTADO DE LA ORDEN Y AUDITORÍA DE CANCELACIÓN
  UPDATE public.orders
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_user_id,
    cancellation_reason = NULLIF(TRIM(p_cancellation_reason), ''),
    status_updated_at = NOW(),
    status_updated_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_order_id;

  -- E. RESTAURAR SALDOS CONVERTIDOS EN 'budget_items'
  FOR v_oi IN SELECT * FROM public.order_items WHERE order_id = p_order_id ORDER BY id ASC LOOP
    IF v_oi.budget_item_id IS NOT NULL THEN
      UPDATE public.budget_items
      SET converted_quantity = GREATEST(0, COALESCE(converted_quantity, 0) - v_oi.quantity)
      WHERE id = v_oi.budget_item_id;
    END IF;
  END LOOP;

  -- F. ACTUALIZAR ESTADO DEL PRESUPUESTO ASOCIADO
  IF v_order.budget_id IS NOT NULL THEN
    SELECT * INTO v_budget FROM public.budgets WHERE id = v_order.budget_id FOR UPDATE;
    IF FOUND THEN
      SELECT EXISTS(
        SELECT 1 FROM public.orders
        WHERE budget_id = v_order.budget_id AND id <> p_order_id AND status <> 'cancelled'
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

  -- G. CRM HISTORY
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


-- 6. ACTUALIZACIÓN DE RPC: PUBLICAR Y REVOCAR PRESUPUESTO (publish_budget / revoke_budget)
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
  v_is_administration BOOLEAN := false;
  v_seller_id UUID := NULL;
  v_budget RECORD;
  v_token UUID;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    SELECT id INTO v_seller_id FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF v_seller_id IS NULL THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: El usuario no posee un rol comercial o administrativo activo.';
    END IF;
  END IF;

  SELECT * INTO v_budget FROM public.budgets WHERE id = p_budget_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado.';
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration AND v_budget.seller_id IS DISTINCT FROM v_seller_id THEN
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
  v_is_administration BOOLEAN := false;
  v_seller_id UUID := NULL;
  v_budget RECORD;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    SELECT id INTO v_seller_id FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF v_seller_id IS NULL THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: El usuario no posee un rol comercial o administrativo activo.';
    END IF;
  END IF;

  SELECT * INTO v_budget FROM public.budgets WHERE id = p_budget_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado.';
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration AND v_budget.seller_id IS DISTINCT FROM v_seller_id THEN
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

-- 7. SEGURIDAD, POLÍTICAS RLS Y CONTROL DE PRIVILEGIOS
-- Compatibilidad con auth.uid() en cualquier entorno (Supabase o cluster aislado de pruebas)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS UUID
    LANGUAGE sql
    STABLE
    AS $f$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
    $f$;
  END IF;
END $$;

-- Funciones auxiliares STABLE SECURITY DEFINER para evaluación rápida en RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_administration()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.administration_users
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_seller_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.sellers
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_distributor_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.distributors
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

-- RLS: TABLA administration_users
-- Solamente ADMIN puede crear, asignar, modificar o desactivar perfiles.
-- Un usuario no puede auto-otorgarse permisos mediante acceso directo a la API de Supabase.
ALTER TABLE public.administration_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS administration_users_select_policy ON public.administration_users;
CREATE POLICY administration_users_select_policy ON public.administration_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS administration_users_insert_policy ON public.administration_users;
CREATE POLICY administration_users_insert_policy ON public.administration_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS administration_users_update_policy ON public.administration_users;
CREATE POLICY administration_users_update_policy ON public.administration_users
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS administration_users_delete_policy ON public.administration_users;
CREATE POLICY administration_users_delete_policy ON public.administration_users
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
  );

-- RLS: TABLA clients
-- Lectura: ADMIN y Administración ven todos; Vendedores solo su propia cartera.
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_read_policy ON public.clients;
CREATE POLICY clients_read_policy ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_administration()
    OR (seller_id = public.current_seller_id() AND public.current_seller_id() IS NOT NULL)
  );

-- RLS: TABLA budgets
-- Lectura: ADMIN y Administración ven todos; Vendedores ven su cartera; Distribuidores ven sus presupuestos.
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS budgets_read_policy ON public.budgets;
CREATE POLICY budgets_read_policy ON public.budgets
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_administration()
    OR (seller_id = public.current_seller_id() AND public.current_seller_id() IS NOT NULL)
    OR (distributor_id = public.current_distributor_id() AND public.current_distributor_id() IS NOT NULL)
  );

-- RLS: TABLA orders
-- Lectura: ADMIN y Administración ven todos; Vendedores ven su cartera; Distribuidores ven sus órdenes.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_read_policy ON public.orders;
CREATE POLICY orders_read_policy ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_administration()
    OR (seller_id = public.current_seller_id() AND public.current_seller_id() IS NOT NULL)
    OR (distributor_id = public.current_distributor_id() AND public.current_distributor_id() IS NOT NULL)
  );

-- RLS: TABLA budget_items
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS budget_items_read_policy ON public.budget_items;
CREATE POLICY budget_items_read_policy ON public.budget_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets b
      WHERE b.id = budget_items.budget_id
        AND (
          public.is_admin()
          OR public.is_administration()
          OR (b.seller_id = public.current_seller_id() AND public.current_seller_id() IS NOT NULL)
          OR (b.distributor_id = public.current_distributor_id() AND public.current_distributor_id() IS NOT NULL)
        )
    )
  );

-- RLS: TABLA order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_items_read_policy ON public.order_items;
CREATE POLICY order_items_read_policy ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          public.is_admin()
          OR public.is_administration()
          OR (o.seller_id = public.current_seller_id() AND public.current_seller_id() IS NOT NULL)
          OR (o.distributor_id = public.current_distributor_id() AND public.current_distributor_id() IS NOT NULL)
        )
    )
  );

-- Concesión de privilegios para usuarios autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON public.administration_users TO authenticated;
GRANT SELECT ON public.clients, public.budgets, public.orders, public.budget_items, public.order_items TO authenticated;

-- Revocación absoluta a anon y PUBLIC
REVOKE ALL ON public.administration_users, public.clients, public.budgets, public.orders, public.budget_items, public.order_items FROM anon, PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Restricción estricta de ejecución de RPCs transaccionales
DO $$
DECLARE fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      'create_budget_transactional', 'convert_budget_transactional',
      'cancel_order_transactional', 'publish_budget_transactional',
      'revoke_budget_transactional'
    )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
  END LOOP;
END;
$$;

COMMIT;
