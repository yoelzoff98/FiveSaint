-- ============================================================================
-- MIGRACIÓN: SPRINT — SIMPLIFICACIÓN DEL CIERRE COMERCIAL DEL VENDEDOR
-- Archivo: 20261005000100_sprint_seller_closing_flow.sql
--
-- OBJETIVOS:
-- 1. Flujo comercial explícito de confirmación: Venta Directa vs Compra en Distribuidor.
-- 2. Trazabilidad aditiva de envíos comerciales (WhatsApp/PDF, Enlace, etc.) separada de publicación.
-- 3. Distinción explícita y coherente entre primer envío y último envío (fecha, medio, responsable).
-- 4. Registro exacto del distribuidor de la operación sin alterar asignaciones históricas ni conceder acceso RLS no autorizado.
-- 5. Soporte para distribuidores sin usuario de acceso (user_id nullable).
-- 6. Rechazo protegido transaccionalmente bajo el mismo bloqueo de conversión.
-- 7. Cálculo y presentación de saldos por canal (Venta directa, distribuidor, parcial, venta mixta).
-- ============================================================================

BEGIN;

-- 1. CAMPOS ADITIVOS EN TABLA budgets (Envío y seguimiento comercial)
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS sent_via VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sent_by_user_id UUID DEFAULT NULL REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS sent_by_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipment_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS first_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS first_sent_via VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS first_sent_by_user_id UUID DEFAULT NULL REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS first_sent_by_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_sent_via VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_sent_by_user_id UUID DEFAULT NULL REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS last_sent_by_name TEXT DEFAULT NULL;

-- 2. PERMITIR DISTRIBUIDORES FÍSICOS SIN USUARIO DE ACCESO EN auth.users
-- Un distribuidor comercial puede ser un showroom o punto de venta sin cuenta de acceso al portal.
ALTER TABLE public.distributors
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. CAMPOS ADITIVOS EN TABLA orders (Detalles de compra en distribuidor y auditoría)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS purchase_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS distributor_reference TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recorded_by_user_id UUID DEFAULT NULL REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS recorded_by_name TEXT DEFAULT NULL;

-- 4. ÍNDICES DIRIGIDOS PARA RENDIMIENTO DE CONSULTAS DE SALDOS Y PAGINACIÓN
CREATE INDEX IF NOT EXISTS idx_orders_budget_id ON public.orders(budget_id);
CREATE INDEX IF NOT EXISTS idx_order_items_budget_item_id ON public.order_items(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_distributors_is_active_company ON public.distributors(is_active, company_name);

-- 5. RPC TRANSACCIONAL: REGISTRO DE ENVÍO COMERCIAL (record_budget_shipment_transactional)
-- Separa la publicación digital del envío real al cliente por WhatsApp, PDF impreso, correo u otro.
CREATE OR REPLACE FUNCTION public.record_budget_shipment_transactional(
  p_user_id UUID,
  p_budget_id UUID,
  p_sent_via VARCHAR(50),
  p_sent_at TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
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
  v_user_name TEXT := NULL;
  v_sent_timestamp TIMESTAMPTZ;
BEGIN
  -- A. AUTORIZACIÓN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;
  IF NOT v_is_admin AND NOT v_is_administration THEN
    SELECT id INTO v_seller_id FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF v_seller_id IS NULL THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: Solo vendedores activos o administración pueden registrar envíos.';
    END IF;
  END IF;

  -- B. OBTENER Y BLOQUEAR PRESUPUESTO
  SELECT * INTO v_budget FROM public.budgets WHERE id = p_budget_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado.';
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    IF v_budget.seller_id IS DISTINCT FROM v_seller_id THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a registrar envíos de presupuestos de otro asesor.';
    END IF;
  END IF;

  IF v_budget.status = 'rejected' THEN
    RAISE EXCEPTION 'No se puede registrar el envío de un presupuesto rechazado.';
  END IF;

  -- C. VALIDAR MEDIO DE ENVÍO
  IF p_sent_via IS NULL OR p_sent_via NOT IN ('whatsapp', 'digital_link', 'email', 'printed_pdf', 'other') THEN
    RAISE EXCEPTION 'Medio de envío no válido. Permitidos: whatsapp, digital_link, email, printed_pdf, other.';
  END IF;

  -- D. RESOLVER NOMBRE DEL REGISTRADOR
  SELECT full_name INTO v_user_name FROM public.sellers WHERE user_id = p_user_id;
  IF v_user_name IS NULL THEN
    SELECT full_name INTO v_user_name FROM public.administration_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN
    SELECT username INTO v_user_name FROM public.admin_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN
    v_user_name := 'Asesor comercial';
  END IF;

  v_sent_timestamp := COALESCE(p_sent_at, NOW());

  -- E. ACTUALIZAR PRESUPUESTO PRESERVANDO PRIMER Y ÚLTIMO ENVÍO
  -- Si nunca se envió, establece primer envío y último envío de forma idéntica y coherente.
  -- Si ya existía un envío anterior, preserva intactos first_sent_* y actualiza last_sent_*.
  IF v_budget.sent_at IS NULL AND v_budget.first_sent_at IS NULL THEN
    UPDATE public.budgets
    SET
      sent_via = p_sent_via,
      sent_at = v_sent_timestamp,
      sent_by_user_id = p_user_id,
      sent_by_name = v_user_name,
      first_sent_via = p_sent_via,
      first_sent_at = v_sent_timestamp,
      first_sent_by_user_id = p_user_id,
      first_sent_by_name = v_user_name,
      last_sent_via = p_sent_via,
      last_sent_at = v_sent_timestamp,
      last_sent_by_user_id = p_user_id,
      last_sent_by_name = v_user_name,
      shipment_notes = NULLIF(TRIM(p_notes), ''),
      status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END,
      updated_at = NOW()
    WHERE id = p_budget_id;
  ELSE
    UPDATE public.budgets
    SET
      last_sent_via = p_sent_via,
      last_sent_at = v_sent_timestamp,
      last_sent_by_user_id = p_user_id,
      last_sent_by_name = v_user_name,
      shipment_notes = NULLIF(TRIM(p_notes), ''),
      status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END,
      updated_at = NOW()
    WHERE id = p_budget_id;
  END IF;

  -- F. REGISTRAR HISTORIAL CRM EN client_notes
  INSERT INTO public.client_notes (
    client_id,
    seller_id,
    content,
    contacted_at,
    note_type,
    budget_id
  ) VALUES (
    v_budget.client_id,
    v_budget.seller_id,
    'Presupuesto N° ' || v_budget.budget_number || ' enviado vía ' ||
      CASE p_sent_via
        WHEN 'whatsapp' THEN 'WhatsApp / PDF'
        WHEN 'digital_link' THEN 'Enlace Digital'
        WHEN 'email' THEN 'Correo Electrónico'
        WHEN 'printed_pdf' THEN 'PDF Impreso / Entrega en mano'
        ELSE 'Otro medio comercial'
      END || ' por ' || v_user_name ||
      COALESCE(' - ' || NULLIF(TRIM(p_notes), ''), ''),
    NOW(),
    'budget_sent',
    p_budget_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'budget_id', p_budget_id,
    'sent_via', p_sent_via,
    'sent_at', v_sent_timestamp,
    'sent_by_name', v_user_name,
    'status', CASE WHEN v_budget.status = 'draft' THEN 'sent' ELSE v_budget.status END
  );
END;
$$;

-- 6. RPC TRANSACCIONAL: PUBLICACIÓN DIGITAL INDEPENDIENTE (publish_budget_transactional)
-- Separa completamente la publicación digital del envío: publicar habilita el enlace público sin cambiar status a sent
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
  -- A. AUTORIZACIÓN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;
  IF NOT v_is_admin AND NOT v_is_administration THEN
    SELECT id INTO v_seller_id FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF v_seller_id IS NULL THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: Solo vendedores activos o administración pueden publicar presupuestos.';
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

  -- SEPARACIÓN ESTRICTA: Publicar solo habilita el enlace digital público.
  -- NO cambia status a 'sent' ni altera sent_at; el presupuesto en borrador sigue siendo borrador
  -- comercial hasta que el asesor registre un envío explícito.
  UPDATE public.budgets
  SET 
    public_status = 'published',
    public_token = v_token,
    updated_at = NOW()
  WHERE id = p_budget_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', p_budget_id,
    'public_status', 'published',
    'public_token', v_token,
    'status', v_budget.status
  );
END;
$$;

-- 7. RPC TRANSACCIONAL: REAPERTURA DE PRESUPUESTO (reopen_budget_transactional)
CREATE OR REPLACE FUNCTION public.reopen_budget_transactional(
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
  v_user_name TEXT := NULL;
BEGIN
  -- A. AUTORIZACIÓN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;
  IF NOT v_is_admin AND NOT v_is_administration THEN
    SELECT id INTO v_seller_id FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF v_seller_id IS NULL THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: Solo vendedores activos o administración pueden reabrir presupuestos.';
    END IF;
  END IF;

  -- B. BLOQUEAR Y VALIDAR PRESUPUESTO
  SELECT * INTO v_budget FROM public.budgets WHERE id = p_budget_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado.';
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    IF v_budget.seller_id IS DISTINCT FROM v_seller_id THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a reabrir presupuestos de otro asesor.';
    END IF;
  END IF;

  IF v_budget.status <> 'rejected' THEN
    RAISE EXCEPTION 'El presupuesto no se encuentra en estado rechazado.';
  END IF;

  SELECT full_name INTO v_user_name FROM public.sellers WHERE user_id = p_user_id;
  IF v_user_name IS NULL THEN
    SELECT full_name INTO v_user_name FROM public.administration_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN
    SELECT username INTO v_user_name FROM public.admin_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN
    v_user_name := 'Asesor comercial';
  END IF;

  -- C. REABRIR A 'sent' (o 'draft' si nunca se envió)
  UPDATE public.budgets
  SET
    status = CASE WHEN sent_at IS NOT NULL THEN 'sent' ELSE 'draft' END,
    rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_budget_id;

  -- D. CRM NOTE
  INSERT INTO public.client_notes (
    client_id,
    seller_id,
    content,
    contacted_at,
    note_type,
    budget_id
  ) VALUES (
    v_budget.client_id,
    v_budget.seller_id,
    'Presupuesto N° ' || v_budget.budget_number || ' reabierto para negociación por ' || v_user_name,
    NOW(),
    'manual',
    p_budget_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'budget_id', p_budget_id,
    'status', CASE WHEN v_budget.sent_at IS NOT NULL THEN 'sent' ELSE 'draft' END
  );
END;
$$;

-- 8. RPC TRANSACCIONAL: RECHAZO DE PRESUPUESTO PROTEGIDO CONTRA CONVERSIÓN CONCURRENTE
CREATE OR REPLACE FUNCTION public.reject_budget_transactional(
  p_user_id UUID,
  p_budget_id UUID,
  p_reason TEXT DEFAULT NULL
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
  v_active_orders_count INTEGER := 0;
  v_user_name TEXT := NULL;
BEGIN
  -- A. AUTORIZACIÓN
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

  -- B. BLOQUEO FOR UPDATE DEL PRESUPUESTO
  SELECT * INTO v_budget FROM public.budgets WHERE id = p_budget_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado.';
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration AND v_budget.seller_id IS DISTINCT FROM v_seller_id THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a rechazar presupuestos de otro asesor.';
  END IF;

  -- C. COMPROBACIÓN TRANSACCIONAL DE OPERACIONES VIGENTES
  -- Si existen órdenes activas (status <> 'cancelled'), rechazar el presupuesto es inválido
  SELECT COUNT(*) INTO v_active_orders_count
  FROM public.orders
  WHERE budget_id = p_budget_id AND status <> 'cancelled';

  IF v_active_orders_count > 0 THEN
    RAISE EXCEPTION 'No se puede rechazar un presupuesto que posee % operación(es) comercial(es) activa(s).', v_active_orders_count;
  END IF;

  -- D. RESOLVER NOMBRE PARA AUDITORÍA
  SELECT full_name INTO v_user_name FROM public.sellers WHERE user_id = p_user_id;
  IF v_user_name IS NULL THEN
    SELECT full_name INTO v_user_name FROM public.administration_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN
    SELECT username INTO v_user_name FROM public.admin_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN
    v_user_name := 'Asesor comercial';
  END IF;

  -- E. ACTUALIZAR ESTADO A REJECTED
  UPDATE public.budgets
  SET
    status = 'rejected',
    rejection_reason = NULLIF(TRIM(p_reason), ''),
    updated_at = NOW()
  WHERE id = p_budget_id;

  -- F. REGISTRO EN CRM
  INSERT INTO public.client_notes (
    client_id,
    seller_id,
    content,
    contacted_at,
    note_type,
    budget_id
  ) VALUES (
    v_budget.client_id,
    v_budget.seller_id,
    'Presupuesto N° ' || v_budget.budget_number || ' marcado como rechazado por ' || v_user_name ||
      CASE WHEN TRIM(COALESCE(p_reason, '')) <> '' THEN '. Motivo: ' || TRIM(p_reason) ELSE '' END,
    NOW(),
    'budget_rejected',
    p_budget_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', p_budget_id,
    'status', 'rejected',
    'rejection_reason', NULLIF(TRIM(p_reason), '')
  );
END;
$$;

-- 9. ACTUALIZACIÓN DE RPC: CONVERSIÓN DE PRESUPUESTO (convert_budget_transactional)
-- Incorpora parámetros explícitos para compra en distribuidor, fecha y referencia, preservando compatibilidad anterior
DROP FUNCTION IF EXISTS public.convert_budget_transactional(UUID, UUID, JSONB, VARCHAR, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.convert_budget_transactional(
  p_user_id UUID,
  p_budget_id UUID,
  p_items_to_convert JSONB,
  p_sale_channel VARCHAR(30),
  p_notes TEXT,
  p_idempotency_key TEXT,
  p_request_hash TEXT,
  p_distributor_id UUID DEFAULT NULL,
  p_purchase_date DATE DEFAULT NULL,
  p_distributor_reference TEXT DEFAULT NULL
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
  v_dist_company_name TEXT := NULL;
  v_dist_is_active BOOLEAN := false;
  v_user_name TEXT := NULL;
  v_order_distributor_id UUID := NULL;
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

  -- Resolver nombre del usuario registrador para auditoría de la orden
  SELECT full_name INTO v_user_name FROM public.sellers WHERE user_id = p_user_id;
  IF v_user_name IS NULL THEN
    SELECT full_name INTO v_user_name FROM public.administration_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN
    SELECT username INTO v_user_name FROM public.admin_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN
    v_user_name := 'Usuario comercial';
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
    RAISE EXCEPTION 'No se puede convertir un presupuesto rechazado. Debe reabrirlo explícitamente antes de registrar una venta.';
  END IF;

  IF (v_budget.status = 'converted' OR v_budget.status = 'distributor_sale') THEN
    -- Verificar si efectivamente no queda saldo
    SELECT bool_and(quantity <= COALESCE(converted_quantity, 0)) INTO v_is_fully_converted
    FROM public.budget_items WHERE budget_id = p_budget_id;
    IF v_is_fully_converted THEN
      RAISE EXCEPTION 'El presupuesto ya se encuentra completamente agotado sin saldo pendiente.';
    END IF;
  END IF;

  IF p_items_to_convert IS NULL OR jsonb_array_length(p_items_to_convert) = 0 THEN
    RAISE EXCEPTION 'Debe seleccionar al menos un ítem para convertir.';
  END IF;

  -- D. VALIDACIÓN ESTRICTA DEL CANAL DE VENTA Y DISTRIBUIDOR CON COMPATIBILIDAD RETROSPECTIVA
  IF p_sale_channel = 'distributor' THEN
    v_order_distributor_id := COALESCE(p_distributor_id, v_budget.distributor_id);
    IF v_order_distributor_id IS NOT NULL THEN
      SELECT company_name, is_active INTO v_dist_company_name, v_dist_is_active FROM public.distributors WHERE id = v_order_distributor_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'El distribuidor especificado no existe.';
      END IF;

      IF NOT v_dist_is_active THEN
        RAISE EXCEPTION 'El distribuidor seleccionado no está activo para nuevas operaciones comerciales.';
      END IF;
    ELSE
      -- Compatibilidad legacy: llamadas anteriores que convertían a distribuidor sin especificar distribuidor_id
      v_dist_company_name := 'Distribuidor no registrado';
    END IF;

    IF p_purchase_date IS NOT NULL AND p_purchase_date > CURRENT_DATE THEN
      RAISE EXCEPTION 'La fecha de compra en distribuidor no puede ser futura.';
    END IF;
  ELSE
    -- Canal directo FiveSaint
    v_order_distributor_id := v_budget.distributor_id;
    IF v_order_distributor_id IS NOT NULL THEN
      SELECT company_name INTO v_dist_company_name FROM public.distributors WHERE id = v_order_distributor_id;
    END IF;
  END IF;

  -- E. VALIDAR Y AGREGAR CANTIDADES SOLICITADAS
  FOR v_req_item IN SELECT * FROM jsonb_array_elements(p_items_to_convert) LOOP
    v_item_id := (v_req_item->>'budgetItemId')::UUID;
    v_requested_qty := (v_req_item->>'quantity')::INTEGER;

    IF v_requested_qty IS NULL OR v_requested_qty <= 0 THEN
      RAISE EXCEPTION 'Cantidad a convertir inválida para el ítem %: debe ser un número entero positivo.', v_item_id;
    END IF;

    v_curr_agg := COALESCE((v_items_aggregated->>v_item_id::TEXT)::INTEGER, 0);
    v_items_aggregated := jsonb_set(v_items_aggregated, ARRAY[v_item_id::TEXT], to_jsonb(v_curr_agg + v_requested_qty));
  END LOOP;

  -- F. BLOQUEO FOR UPDATE Y VALIDACIÓN DE SALDOS DISPONIBLES EN ORDEN DETERMINISTA ASCENDENTE
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

  -- G. ASIGNACIÓN NETO DE CÁLCULO
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

  -- H. INSERTAR ORDEN
  -- Para distribuidor: no genera fabricación pendiente (status: completed, order_type: distributor_sale)
  -- Para venta directa: genera pedido de fábrica pendiente (status: pending, order_type: factory)
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
    purchase_date,
    distributor_reference,
    recorded_by_user_id,
    recorded_by_name,
    status_updated_at,
    status_updated_by
  ) VALUES (
    p_budget_id,
    v_budget.client_id,
    v_budget.seller_id,
    CASE WHEN p_sale_channel = 'distributor' THEN 'completed' ELSE 'pending' END,
    0,
    COALESCE(NULLIF(TRIM(p_notes), ''),
      CASE WHEN p_sale_channel = 'distributor'
        THEN 'Venta en distribuidor registrada desde presupuesto N° ' || v_budget.budget_number
        ELSE 'Pedido de fábrica generado desde presupuesto N° ' || v_budget.budget_number
      END),
    COALESCE(p_sale_channel, 'direct'),
    CASE WHEN p_sale_channel = 'distributor' THEN 'distributor_sale' ELSE 'factory' END,
    p_idempotency_key,
    v_order_distributor_id,
    CASE WHEN p_sale_channel = 'distributor' THEN COALESCE(p_purchase_date, CURRENT_DATE) ELSE NULL END,
    CASE WHEN p_sale_channel = 'distributor' THEN NULLIF(TRIM(p_distributor_reference), '') ELSE NULL END,
    p_user_id,
    v_user_name,
    NOW(),
    p_user_id
  ) RETURNING * INTO v_new_order;

  -- I. ACTUALIZAR SALDOS CONVERTIDOS EN BUDGET_ITEMS
  FOR v_item_id IN SELECT (jsonb_object_keys(v_items_aggregated))::UUID LOOP
    v_requested_qty := (v_items_aggregated->>v_item_id::TEXT)::INTEGER;
    UPDATE public.budget_items
    SET converted_quantity = COALESCE(converted_quantity, 0) + v_requested_qty
    WHERE id = v_item_id;
  END LOOP;

  -- J. INSERTAR ÍTEMS DEL PEDIDO
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
      CASE WHEN p_sale_channel = 'distributor' THEN NULL ELSE NULLIF(TRIM(v_req_item->>'factoryNotes'), '') END
    );
  END LOOP;

  -- K. ACTUALIZAR TOTAL DE LA ORDEN
  UPDATE public.orders
  SET total_amount = v_order_total
  WHERE id = v_new_order.id;

  -- L. EVALUAR ESTADO DEL PRESUPUESTO
  v_is_fully_converted := true;
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

  -- M. CRM HISTORY
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
      WHEN p_sale_channel = 'distributor' THEN
        'Compra en distribuidor ' || COALESCE(v_dist_company_name, 'designado') ||
        ' registrada (N° Operación ' || v_new_order.order_number || ') por $' || v_order_total ||
        CASE WHEN p_purchase_date IS NOT NULL THEN ' [Fecha de compra: ' || p_purchase_date::TEXT || ']' ELSE '' END ||
        CASE WHEN p_distributor_reference IS NOT NULL THEN ' [Ref: ' || p_distributor_reference || ']' ELSE '' END
      ELSE
        'Pedido de fábrica N° ' || v_new_order.order_number || ' generado (' ||
        CASE WHEN v_is_fully_converted THEN 'Total' ELSE 'Parcial' END || ') por $' || v_order_total
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
    'total_amount', v_order_total,
    'status', v_new_order.status,
    'budget_id', p_budget_id,
    'budget_status', v_new_status,
    'sale_channel', p_sale_channel,
    'distributor_id', v_order_distributor_id,
    'distributor_name', v_dist_company_name,
    'purchase_date', v_new_order.purchase_date,
    'distributor_reference', v_new_order.distributor_reference,
    'is_fully_converted', v_is_fully_converted
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

-- 10. POLÍTICAS RLS (AISLAMIENTO COMERCIAL Y PREVENCIÓN DE ACCESO NO AUTORIZADO)
-- Evita que el portal de un distribuidor acceda a pedidos de clientes retail registrados por asesores
DROP POLICY IF EXISTS orders_read_policy ON public.orders;
CREATE POLICY orders_read_policy ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_administration()
    OR (seller_id = public.current_seller_id() AND public.current_seller_id() IS NOT NULL)
    OR (
      distributor_id = public.current_distributor_id() 
      AND public.current_distributor_id() IS NOT NULL
      AND order_type <> 'distributor_sale'
    )
  );

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
          OR (
            o.distributor_id = public.current_distributor_id() 
            AND public.current_distributor_id() IS NOT NULL
            AND o.order_type <> 'distributor_sale'
          )
        )
    )
  );

-- 11. PERMISOS Y PRIVILEGIOS
-- Restricción estricta de ejecución de RPCs transaccionales
DO $$
DECLARE fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      'convert_budget_transactional', 'record_budget_shipment_transactional',
      'reopen_budget_transactional', 'reject_budget_transactional',
      'publish_budget_transactional'
    )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
  END LOOP;
END;
$$;

COMMIT;
