-- ============================================================================
-- MIGRACIÓN ADITIVA: SPRINT — ADMINISTRACIÓN: CLIENTES Y PREPARACIÓN DE FABRICACIÓN
-- Archivo: 20261006000100_sprint_admin_clients_and_manufacturing.sql
-- Fecha: 2026-10-06
-- ============================================================================
-- OBJETIVOS:
-- 1. Gestión centralizada de clientes en Administración:
--    - Autoría del alta separada del vendedor asignado (created_by_user_id, created_by_role, created_by_name).
--    - Historial auditado de reasignaciones (client_assignment_history).
--    - Reasignación sin alterar vendedor ni documentos históricos.
--    - Detección de duplicados sin fusión automática.
--    - Bloqueo de eliminación si existen operaciones relacionadas.
-- 2. Catálogo de Insumos (supplies):
--    - Código único, nombre, UOM, decimales según unidad, desactivación lógica.
-- 3. Composiciones Base Versionadas (product_compositions, composition_items):
--    - Vinculadas al catálogo de productos y variantes existente.
--    - Estados: draft, published, retired.
--    - Versionado inmutable: editar una publicada genera nueva versión draft.
-- 4. Opciones Configurables (configurable_options):
--    - Opciones (jets, motor, accesorios) con valores permitidos, instrucciones y reglas de efecto en insumos.
-- 5. Configuración Comercial y Revisión:
--    - configuration y status en budget_items y order_items.
--    - Preservación en conversión total y parcial.
-- 6. Órdenes de Fabricación (manufacturing_orders):
--    - Emisión transaccional desde pedidos directos vigentes.
--    - Bloqueo de pedidos cancelados y de distribuidores.
--    - Control de saldo fabricable por ítem con protección de concurrencia (FOR UPDATE).
--    - Snapshot inmutable de configuración, composición e insumos calculados.
--    - Validación estricta de capacidad de una única hoja A4.
-- ============================================================================

BEGIN;

-- 1. EXTENSIÓN ADITIVA A LA TABLA 'clients' (Autoría separada)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50) DEFAULT 'seller',
  ADD COLUMN IF NOT EXISTS created_by_name TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_seller_id ON public.clients(seller_id);

-- 2. TABLA DE AUDITORÍA DE REASIGNACIONES DE CLIENTES
CREATE TABLE IF NOT EXISTS public.client_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  previous_seller_id UUID REFERENCES public.sellers(id) ON DELETE RESTRICT,
  new_seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  changed_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  changed_by_name TEXT,
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) >= 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_assign_hist_client ON public.client_assignment_history(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_assign_hist_new_seller ON public.client_assignment_history(new_seller_id);

-- 3. CATÁLOGO DE INSUMOS
CREATE TABLE IF NOT EXISTS public.supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE CHECK (char_length(trim(code)) >= 2),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  description TEXT,
  unit_of_measure VARCHAR(20) NOT NULL CHECK (unit_of_measure IN ('un', 'm', 'kg', 'l', 'm2', 'm3', 'g', 'cm')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  updated_by_user_id UUID REFERENCES auth.users(id),
  updated_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplies_code ON public.supplies(code);
CREATE INDEX IF NOT EXISTS idx_supplies_active ON public.supplies(is_active);

-- 4. COMPOSICIONES BASE VERSIONADAS
CREATE TABLE IF NOT EXISTS public.product_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 3),
  technical_notes TEXT,
  waste_percentage NUMERIC(5,2) DEFAULT 0 CHECK (waste_percentage >= 0 AND waste_percentage <= 100),
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  updated_by_user_id UUID REFERENCES auth.users(id),
  updated_by_name TEXT,
  published_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_prod_variant_version 
  ON public.product_compositions (product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::UUID), version);

CREATE INDEX IF NOT EXISTS idx_compositions_prod_status 
  ON public.product_compositions(product_id, status);

-- ÍTEMS DE LA COMPOSICIÓN (Insumos requeridos por unidad de producto)
CREATE TABLE IF NOT EXISTS public.composition_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  composition_id UUID NOT NULL REFERENCES public.product_compositions(id) ON DELETE CASCADE,
  supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,4) NOT NULL CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_composition_supply UNIQUE (composition_id, supply_id)
);

CREATE INDEX IF NOT EXISTS idx_composition_items_comp ON public.composition_items(composition_id);
CREATE INDEX IF NOT EXISTS idx_composition_items_supply ON public.composition_items(supply_id);

-- 5. OPCIONES CONFIGURABLES
CREATE TABLE IF NOT EXISTS public.configurable_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  code VARCHAR(50) NOT NULL UNIQUE CHECK (char_length(trim(code)) >= 2),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  default_value TEXT,
  allowed_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  manufacturing_instructions JSONB DEFAULT '{}'::jsonb,
  compatibility_rules JSONB DEFAULT '[]'::jsonb,
  materials_effect JSONB DEFAULT '[]'::jsonb,
  changes_materials BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_config_options_product ON public.configurable_options(product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_config_options_code ON public.configurable_options(code);

-- 6. EXTENSIONES ADITIVAS A budget_items Y order_items (Configuración comercial)
ALTER TABLE public.budget_items
  ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS configuration_status VARCHAR(30) DEFAULT 'unconfigured',
  ADD COLUMN IF NOT EXISTS configuration_notes TEXT;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS configuration_status VARCHAR(30) DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS configuration_reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS configuration_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS configuration_review_notes TEXT,
  ADD COLUMN IF NOT EXISTS manufacturing_issued_quantity INTEGER DEFAULT 0;

-- 7. TABLA DE ÓRDENES DE FABRICACIÓN (manufacturing_orders)
CREATE SEQUENCE IF NOT EXISTS public.manufacturing_orders_number_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.manufacturing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status VARCHAR(30) NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'in_production', 'completed', 'cancelled')),
  bom_id UUID REFERENCES public.product_compositions(id) ON DELETE RESTRICT,
  bom_version INTEGER,
  configuration_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  manufacturing_instructions_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  supplies_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  issued_by_name TEXT NOT NULL,
  revision_number INTEGER NOT NULL DEFAULT 1 CHECK (revision_number >= 1),
  parent_manufacturing_order_id UUID REFERENCES public.manufacturing_orders(id),
  revision_reason TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfg_orders_order_id ON public.manufacturing_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_mfg_orders_order_item_id ON public.manufacturing_orders(order_item_id);
CREATE INDEX IF NOT EXISTS idx_mfg_orders_status ON public.manufacturing_orders(status);
CREATE INDEX IF NOT EXISTS idx_mfg_orders_number ON public.manufacturing_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_mfg_orders_idempotency ON public.manufacturing_orders(idempotency_key);

-- 8. RPC: REASIGNACIÓN DE CLIENTE (reassign_client_transactional)
CREATE OR REPLACE FUNCTION public.reassign_client_transactional(
  p_user_id UUID,
  p_client_id UUID,
  p_new_seller_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_is_administration BOOLEAN := false;
  v_user_name TEXT := 'Administración';
  v_client RECORD;
  v_new_seller RECORD;
  v_prev_seller_id UUID;
BEGIN
  -- A. Autorización
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: Solo Administración o ADMIN pueden reasignar clientes.';
  END IF;

  IF p_reason IS NULL OR char_length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'Debe ingresar un motivo fundado para la reasignación (mínimo 3 caracteres).';
  END IF;

  -- B. Validar nuevo vendedor activo
  SELECT * INTO v_new_seller FROM public.sellers WHERE id = p_new_seller_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El vendedor asignado no existe o se encuentra inactivo.';
  END IF;

  -- C. Obtener y bloquear cliente
  SELECT * INTO v_client FROM public.clients WHERE id = p_client_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cliente no encontrado.';
  END IF;

  v_prev_seller_id := v_client.seller_id;

  -- Resolver nombre de quien reasigna
  SELECT full_name INTO v_user_name FROM public.administration_users WHERE user_id = p_user_id;
  IF v_user_name IS NULL THEN
    SELECT full_name INTO v_user_name FROM public.admin_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN
    v_user_name := 'Administración FiveSaint';
  END IF;

  -- D. Registrar en historial de auditoría
  INSERT INTO public.client_assignment_history (
    client_id,
    previous_seller_id,
    new_seller_id,
    changed_by_user_id,
    changed_by_name,
    reason
  ) VALUES (
    p_client_id,
    v_prev_seller_id,
    p_new_seller_id,
    p_user_id,
    v_user_name,
    trim(p_reason)
  );

  -- E. Actualizar cliente actual
  UPDATE public.clients
  SET seller_id = p_new_seller_id,
      updated_at = now()
  WHERE id = p_client_id;

  -- F. Registrar nota CRM
  INSERT INTO public.client_notes (
    client_id,
    seller_id,
    content,
    contacted_at,
    note_type
  ) VALUES (
    p_client_id,
    p_new_seller_id,
    'Reasignación de asesor comercial: ' || trim(p_reason) || ' (Realizado por: ' || v_user_name || ')',
    now(),
    'reassignment'
  );

  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'clientId', p_client_id,
    'previousSellerId', v_prev_seller_id,
    'newSellerId', p_new_seller_id
  );
END;
$$;

-- 9. RPC: ELIMINACIÓN SEGURA DE CLIENTES (fn_delete_client_safe)
CREATE OR REPLACE FUNCTION public.fn_delete_client_safe(
  p_user_id UUID,
  p_client_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_is_administration BOOLEAN := false;
  v_budget_count INTEGER := 0;
  v_order_count INTEGER := 0;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: No posee permisos para eliminar clientes.';
  END IF;

  -- Verificar operaciones comerciales vinculadas
  SELECT COUNT(*) INTO v_budget_count FROM public.budgets WHERE client_id = p_client_id;
  SELECT COUNT(*) INTO v_order_count FROM public.orders WHERE client_id = p_client_id;

  IF v_budget_count > 0 OR v_order_count > 0 THEN
    RAISE EXCEPTION 'No se puede eliminar el cliente: posee operaciones comerciales registradas (% presupuestos, % pedidos).',
      v_budget_count, v_order_count;
  END IF;

  DELETE FROM public.client_notes WHERE client_id = p_client_id;
  DELETE FROM public.client_assignment_history WHERE client_id = p_client_id;
  DELETE FROM public.clients WHERE id = p_client_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 10. RPC: PUBLICAR COMPOSICIÓN (publish_product_composition_transactional)
CREATE OR REPLACE FUNCTION public.publish_product_composition_transactional(
  p_user_id UUID,
  p_composition_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_is_administration BOOLEAN := false;
  v_user_name TEXT := 'Administración';
  v_comp RECORD;
  v_item_count INTEGER := 0;
  v_inactive_supply_count INTEGER := 0;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: Solo Administración o ADMIN pueden publicar composiciones.';
  END IF;

  SELECT * INTO v_comp FROM public.product_compositions WHERE id = p_composition_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Composición no encontrada.';
  END IF;

  -- Validar que tenga insumos
  SELECT COUNT(*) INTO v_item_count FROM public.composition_items WHERE composition_id = p_composition_id;
  IF v_item_count = 0 THEN
    RAISE EXCEPTION 'No se puede publicar una composición sin insumos definidos.';
  END IF;

  -- Validar que todos los insumos estén activos
  SELECT COUNT(*) INTO v_inactive_supply_count 
  FROM public.composition_items ci
  JOIN public.supplies s ON s.id = ci.supply_id
  WHERE ci.composition_id = p_composition_id AND s.is_active = false;

  IF v_inactive_supply_count > 0 THEN
    RAISE EXCEPTION 'No se puede publicar: la composición incluye insumos inactivos (% insumos inactivos detectados).', v_inactive_supply_count;
  END IF;

  -- Resolver nombre del publicador
  SELECT full_name INTO v_user_name FROM public.administration_users WHERE user_id = p_user_id;
  IF v_user_name IS NULL THEN
    SELECT full_name INTO v_user_name FROM public.admin_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN v_user_name := 'Administración FiveSaint'; END IF;

  -- Retirar automáticamente composiciones previamente publicadas para el mismo producto y variante
  UPDATE public.product_compositions
  SET status = 'retired',
      retired_at = now(),
      updated_at = now()
  WHERE product_id = v_comp.product_id
    AND variant_id IS NOT DISTINCT FROM v_comp.variant_id
    AND status = 'published'
    AND id <> p_composition_id;

  -- Marcar como publicada
  UPDATE public.product_compositions
  SET status = 'published',
      published_at = now(),
      updated_by_user_id = p_user_id,
      updated_by_name = v_user_name,
      updated_at = now()
  WHERE id = p_composition_id;

  RETURN jsonb_build_object(
    'success', true,
    'compositionId', p_composition_id,
    'version', v_comp.version,
    'status', 'published'
  );
END;
$$;

-- 11. ACTUALIZAR create_budget_transactional PARA GUARDAR CONFIGURACIÓN DE ÍTEMS
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
  v_config JSONB;
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

  -- B. Validar cliente
  SELECT * INTO v_client FROM public.clients WHERE id = p_client_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El cliente especificado no existe.';
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration AND v_client.seller_id IS DISTINCT FROM v_seller_id THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a presupuestar clientes de otro asesor.';
  END IF;

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

  -- C. IDEMPOTENCIA
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
        ELSE
          RAISE EXCEPTION 'Operación en proceso por otra solicitud simultánea.';
        END IF;
      END IF;
    END IF;
  END IF;

  -- D. Inserción de cabecera de presupuesto
  INSERT INTO public.budgets (
    client_id,
    seller_id,
    created_by_user_id,
    creator_role,
    author_snapshot,
    total_amount,
    subtotal_amount,
    discount_amount,
    tax_amount,
    tax_rate,
    notes,
    public_notes,
    discounts,
    status,
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
    p_author_snapshot,
    p_total_amount,
    p_subtotal_amount,
    p_discount_amount,
    p_tax_amount,
    p_tax_rate,
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

  -- E. Inserción de ítems con soporte de configuración
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_idx := v_item_idx + 1;

    IF (v_item->>'quantity')::NUMERIC <= 0 OR (v_item->>'unitPrice')::NUMERIC < 0 THEN
      RAISE EXCEPTION 'Ítem en posición % contiene cantidad o precio inválido.', v_item_idx;
    END IF;

    v_config := COALESCE(v_item->'configuration', '{}'::jsonb);

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
      exceptional_discount_reason,
      configuration,
      configuration_status,
      configuration_notes
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
      NULLIF(TRIM(v_item->>'exceptionalDiscountReason'), ''),
      v_config,
      CASE WHEN v_config IS NOT NULL AND v_config <> '{}'::jsonb THEN 'configured' ELSE 'unconfigured' END,
      NULLIF(TRIM(v_item->>'configurationNotes'), '')
    );
  END LOOP;

  -- F. Snapshot CRM
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
    'Presupuesto #' || v_new_budget.budget_number || ' creado en borrador por ' ||
    CASE WHEN v_is_admin THEN 'Administrador Central'
         WHEN v_is_administration THEN 'Administración'
         ELSE 'Asesor Comercial' END,
    NOW(),
    'budget_created',
    v_new_budget.id
  );

  v_result := jsonb_build_object(
    'success', true,
    'id', v_new_budget.id,
    'budgetId', v_new_budget.id,
    'budget_number', v_new_budget.budget_number,
    'budgetNumber', v_new_budget.budget_number,
    'total_amount', v_new_budget.total_amount,
    'totalAmount', v_new_budget.total_amount,
    'status', v_new_budget.status,
    'seller_id', v_new_budget.seller_id,
    'sellerId', v_new_budget.seller_id,
    'created_by_user_id', p_user_id,
    'creator_role', v_new_budget.creator_role,
    'creatorRole', v_new_budget.creator_role
  );

  -- G. Guardar idempotencia
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
END;
$$;

-- 12. ACTUALIZAR convert_budget_transactional PARA TRASLADAR CONFIGURACIÓN A order_items
CREATE OR REPLACE FUNCTION public.convert_budget_transactional(
  p_user_id UUID,
  p_budget_id UUID,
  p_items_to_convert JSONB,
  p_sale_channel VARCHAR(30) DEFAULT 'direct',
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_request_hash TEXT DEFAULT NULL,
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
  v_user_name TEXT := 'Asesor comercial';
  v_budget RECORD;
  v_existing_rec RECORD;
  v_new_order RECORD;
  v_b_item RECORD;
  v_req_item JSONB;
  v_item_id UUID;
  v_requested_qty INTEGER;
  v_items_aggregated JSONB := '{}'::jsonb;
  v_current_budget_discounts JSONB;
  v_all_items_fully_converted BOOLEAN := true;
  v_total_net NUMERIC(14,2) := 0;
  v_total_subtotal NUMERIC(14,2) := 0;
  v_discount_factor NUMERIC(18,10) := 1.0;
  v_net_allocations JSONB := '{}'::jsonb;
  v_running_net_sum NUMERIC(14,2) := 0;
  v_last_item_id UUID := NULL;
  v_line_subtotal NUMERIC(14,2);
  v_line_net NUMERIC(14,2);
  v_d_val NUMERIC;
  v_unit_price NUMERIC(14,2);
  v_total_price NUMERIC(14,2);
  v_processed_quantities JSONB := '{}'::jsonb;
  v_processed_qty INTEGER;
  v_previous_qty INTEGER;
  v_order_total NUMERIC(14,2) := 0;
  v_result JSONB;
  v_order_distributor_id UUID := NULL;
  v_dist_company_name TEXT := NULL;
  v_dist_exists BOOLEAN := false;
BEGIN
  -- A. AUTORIZACIÓN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;
  IF NOT v_is_admin AND NOT v_is_administration THEN
    SELECT id INTO v_seller_id FROM public.sellers WHERE user_id = p_user_id AND is_active = true;
    IF v_seller_id IS NULL THEN
      RAISE EXCEPTION 'ACCESO DENEGADO: Solo vendedores activos o administración pueden confirmar ventas.';
    END IF;
  END IF;

  -- B. RESOLVER NOMBRE
  SELECT full_name INTO v_user_name FROM public.sellers WHERE user_id = p_user_id;
  IF v_user_name IS NULL THEN
    SELECT full_name INTO v_user_name FROM public.administration_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN
    SELECT username INTO v_user_name FROM public.admin_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN v_user_name := 'Personal FiveSaint'; END IF;

  -- C. CANAL Y DISTRIBUIDOR
  IF p_sale_channel = 'distributor' THEN
    v_order_distributor_id := p_distributor_id;
    IF v_order_distributor_id IS NOT NULL THEN
      SELECT company_name, is_active INTO v_dist_company_name, v_dist_exists FROM public.distributors WHERE id = v_order_distributor_id;
      IF NOT FOUND OR NOT v_dist_exists THEN
        RAISE EXCEPTION 'El distribuidor seleccionado no existe o no está activo.';
      END IF;
    ELSE
      v_dist_company_name := 'Distribuidor no registrado';
    END IF;
  END IF;

  -- D. IDEMPOTENCIA
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
          RAISE EXCEPTION 'Conflicto de idempotencia: clave ya enviada con parámetros diferentes.';
        END IF;
        IF v_existing_rec.status = 'completed' THEN
          RETURN v_existing_rec.response_body;
        ELSE
          RAISE EXCEPTION 'Conversión en proceso por otra transacción concurrente.';
        END IF;
      END IF;
    END IF;
  END IF;

  -- E. BLOQUEO DE PRESUPUESTO
  SELECT * INTO v_budget FROM public.budgets WHERE id = p_budget_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado.';
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration AND v_budget.seller_id IS DISTINCT FROM v_seller_id THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: No está autorizado a convertir presupuestos de otro asesor.';
  END IF;

  IF v_budget.status IN ('converted', 'distributor_sale') THEN
    RAISE EXCEPTION 'El presupuesto ya fue convertido totalmente y no posee saldo remanente.';
  END IF;

  IF v_budget.status = 'rejected' THEN
    RAISE EXCEPTION 'No se puede convertir un presupuesto rechazado. Debe reabrirlo explícitamente antes de registrar una venta.';
  END IF;

  -- F. VALIDAR CANTIDADES
  IF p_items_to_convert IS NULL OR jsonb_array_length(p_items_to_convert) = 0 THEN
    RAISE EXCEPTION 'Debe seleccionar al menos un ítem para convertir a pedido.';
  END IF;

  FOR v_req_item IN SELECT * FROM jsonb_array_elements(p_items_to_convert) LOOP
    v_item_id := (v_req_item->>'budgetItemId')::UUID;
    v_requested_qty := (v_req_item->>'quantity')::INTEGER;

    IF v_requested_qty <= 0 THEN
      RAISE EXCEPTION 'La cantidad a convertir debe ser mayor a cero.';
    END IF;

    v_items_aggregated := jsonb_set(
      v_items_aggregated,
      ARRAY[v_item_id::TEXT],
      to_jsonb(COALESCE((v_items_aggregated->>v_item_id::TEXT)::INTEGER, 0) + v_requested_qty)
    );
  END LOOP;

  FOR v_item_id IN SELECT (jsonb_object_keys(v_items_aggregated))::UUID LOOP
    v_requested_qty := (v_items_aggregated->>v_item_id::TEXT)::INTEGER;
    SELECT * INTO v_b_item FROM public.budget_items WHERE id = v_item_id AND budget_id = p_budget_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El ítem % no pertenece al presupuesto indicado.', v_item_id;
    END IF;

    IF (COALESCE(v_b_item.converted_quantity, 0) + v_requested_qty) > v_b_item.quantity THEN
      RAISE EXCEPTION 'Saldo insuficiente en ítem "%": solicitadas % unidades pero solo restan %.',
        v_b_item.product_name, v_requested_qty, (v_b_item.quantity - COALESCE(v_b_item.converted_quantity, 0));
    END IF;
  END LOOP;

  -- G. CÁLCULO DE IMPORTES Y DESCUENTOS
  SELECT to_jsonb(discounts) INTO v_current_budget_discounts FROM public.budgets WHERE id = p_budget_id;
  IF v_current_budget_discounts IS NOT NULL AND jsonb_typeof(v_current_budget_discounts) = 'array' THEN
    FOR v_d_val IN SELECT jsonb_array_elements_text(v_current_budget_discounts)::NUMERIC LOOP
      v_discount_factor := v_discount_factor * (1.0 - (v_d_val / 100.0));
    END LOOP;
  END IF;

  SELECT COALESCE(SUM(total_price), 0) INTO v_total_subtotal FROM public.budget_items WHERE budget_id = p_budget_id;
  v_total_net := ROUND(v_total_subtotal * v_discount_factor, 2);

  FOR v_b_item IN SELECT * FROM public.budget_items WHERE budget_id = p_budget_id ORDER BY id ASC LOOP
    v_line_subtotal := v_b_item.total_price;
    IF v_total_subtotal > 0 THEN
      v_line_net := ROUND(v_total_net * (v_line_subtotal / v_total_subtotal), 2);
    ELSE
      v_line_net := 0;
    END IF;
    v_net_allocations := jsonb_set(v_net_allocations, ARRAY[v_b_item.id::TEXT], to_jsonb(v_line_net));
    v_running_net_sum := v_running_net_sum + v_line_net;
    v_last_item_id := v_b_item.id;
  END LOOP;

  IF v_last_item_id IS NOT NULL AND v_running_net_sum <> v_total_net THEN
    v_line_net := (v_net_allocations->>v_last_item_id::TEXT)::NUMERIC + (v_total_net - v_running_net_sum);
    v_net_allocations := jsonb_set(v_net_allocations, ARRAY[v_last_item_id::TEXT], to_jsonb(v_line_net));
  END IF;

  -- H. INSERTAR PEDIDO
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

  -- I. ACTUALIZAR SALDOS CONVERTIDOS
  FOR v_item_id IN SELECT (jsonb_object_keys(v_items_aggregated))::UUID LOOP
    v_requested_qty := (v_items_aggregated->>v_item_id::TEXT)::INTEGER;
    UPDATE public.budget_items
    SET converted_quantity = COALESCE(converted_quantity, 0) + v_requested_qty
    WHERE id = v_item_id;
  END LOOP;

  -- J. INSERTAR ÍTEMS DEL PEDIDO CON CONFIGURACIÓN TRASLADADA
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
      factory_notes,
      configuration,
      configuration_status,
      configuration_review_notes,
      manufacturing_issued_quantity
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
      NULLIF(TRIM(v_req_item->>'factoryNotes'), ''),
      COALESCE(v_b_item.configuration, '{}'::jsonb),
      CASE WHEN v_b_item.configuration IS NOT NULL AND v_b_item.configuration <> '{}'::jsonb 
           THEN 'pending_review' 
           ELSE 'unconfigured' 
      END,
      v_b_item.configuration_notes,
      0
    );
  END LOOP;

  UPDATE public.orders SET total_amount = v_order_total WHERE id = v_new_order.id;

  -- K. ESTADO DEL PRESUPUESTO
  FOR v_b_item IN SELECT * FROM public.budget_items WHERE budget_id = p_budget_id LOOP
    IF COALESCE(v_b_item.converted_quantity, 0) < v_b_item.quantity THEN
      v_all_items_fully_converted := false;
      EXIT;
    END IF;
  END LOOP;

  UPDATE public.budgets
  SET status = CASE
        WHEN v_all_items_fully_converted THEN
          CASE WHEN p_sale_channel = 'distributor' THEN 'distributor_sale' ELSE 'converted' END
        ELSE 'partially_converted'
      END,
      distributor_id = CASE
        WHEN p_sale_channel = 'distributor' THEN v_order_distributor_id
        ELSE distributor_id
      END,
      sale_channel = CASE
        WHEN v_all_items_fully_converted THEN p_sale_channel
        ELSE 'mixed'
      END,
      updated_at = NOW()
  WHERE id = p_budget_id;

  -- L. CRM
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
    CASE WHEN p_sale_channel = 'distributor'
      THEN 'Venta en distribuidor confirmada (Pedido #' || v_new_order.order_number || ') por ' || v_user_name
      ELSE 'Pedido de fábrica #' || v_new_order.order_number || ' confirmado por ' || v_user_name
    END,
    NOW(),
    'order_created',
    p_budget_id,
    v_new_order.id
  );

  v_result := jsonb_build_object(
    'success', true,
    'id', v_new_order.id,
    'order_id', v_new_order.id,
    'orderId', v_new_order.id,
    'order_number', v_new_order.order_number,
    'orderNumber', v_new_order.order_number,
    'total_amount', v_order_total,
    'totalAmount', v_order_total,
    'status', v_new_order.status,
    'budget_id', p_budget_id,
    'budgetId', p_budget_id,
    'budget_status', CASE
      WHEN v_all_items_fully_converted THEN
        CASE WHEN p_sale_channel = 'distributor' THEN 'distributor_sale' ELSE 'converted' END
      ELSE 'partially_converted'
    END,
    'budgetStatus', CASE
      WHEN v_all_items_fully_converted THEN
        CASE WHEN p_sale_channel = 'distributor' THEN 'distributor_sale' ELSE 'converted' END
      ELSE 'partially_converted'
    END,
    'sale_channel', p_sale_channel,
    'saleChannel', p_sale_channel,
    'distributor_id', v_order_distributor_id,
    'distributorId', v_order_distributor_id,
    'distributor_name', v_dist_company_name,
    'distributorName', v_dist_company_name,
    'purchase_date', v_new_order.purchase_date,
    'purchaseDate', v_new_order.purchase_date,
    'distributor_reference', v_new_order.distributor_reference,
    'distributorReference', v_new_order.distributor_reference,
    'is_fully_converted', v_all_items_fully_converted,
    'isFullyConverted', v_all_items_fully_converted
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
END;
$$;

-- 13. RPC: EMISIÓN DE ORDEN DE FABRICACIÓN (issue_manufacturing_order_transactional)
CREATE OR REPLACE FUNCTION public.issue_manufacturing_order_transactional(
  p_user_id UUID,
  p_order_id UUID,
  p_order_item_id UUID,
  p_quantity INTEGER,
  p_bom_id UUID,
  p_configuration_snapshot JSONB,
  p_manufacturing_instructions_snapshot JSONB,
  p_supplies_snapshot JSONB,
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_request_hash TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_is_administration BOOLEAN := false;
  v_user_name TEXT := 'Administración';
  v_order RECORD;
  v_order_item RECORD;
  v_bom RECORD;
  v_existing_rec RECORD;
  v_new_mfg_order RECORD;
  v_order_seq INTEGER;
  v_mfg_order_number VARCHAR(50);
  v_issued_so_far INTEGER := 0;
  v_supplies_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- A. AUTORIZACIÓN ESTRICTA: Solo Administración o ADMIN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: La emisión de órdenes de fabricación está reservada exclusivamente a Administración y ADMIN.';
  END IF;

  -- Resolver nombre
  SELECT full_name INTO v_user_name FROM public.administration_users WHERE user_id = p_user_id;
  IF v_user_name IS NULL THEN
    SELECT full_name INTO v_user_name FROM public.admin_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN v_user_name := 'Administración FiveSaint'; END IF;

  -- B. IDEMPOTENCIA
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    INSERT INTO public.idempotency_records (user_id, operation_type, idempotency_key, request_hash, status)
    VALUES (p_user_id, 'issue_manufacturing_order', p_idempotency_key, COALESCE(p_request_hash, p_idempotency_key), 'processing')
    ON CONFLICT (user_id, operation_type, idempotency_key) DO NOTHING
    RETURNING * INTO v_existing_rec;

    IF NOT FOUND OR v_existing_rec.id IS NULL THEN
      SELECT * INTO v_existing_rec
      FROM public.idempotency_records
      WHERE user_id = p_user_id
        AND operation_type = 'issue_manufacturing_order'
        AND idempotency_key = p_idempotency_key
      FOR UPDATE;

      IF FOUND THEN
        IF p_request_hash IS NOT NULL AND v_existing_rec.request_hash <> p_request_hash THEN
          RAISE EXCEPTION 'Conflicto de idempotencia: clave ya enviada con payload diferente.';
        END IF;
        IF v_existing_rec.status = 'completed' THEN
          RETURN v_existing_rec.response_body;
        ELSE
          RAISE EXCEPTION 'Operación de emisión en proceso por otra transacción concurrente.';
        END IF;
      END IF;
    END IF;
  END IF;

  -- C. BLOQUEAR Y VALIDAR PEDIDO
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado.';
  END IF;

  -- Control 1: No emitir desde pedidos de distribuidores
  IF v_order.sale_channel = 'distributor' OR v_order.distributor_id IS NOT NULL OR v_order.order_type = 'distributor_sale' THEN
    RAISE EXCEPTION 'CONTROL DE FÁBRICA: Las ventas en distribuidores no generan órdenes de fabricación interna.';
  END IF;

  -- Control 2: No emitir desde pedidos cancelados
  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'CONTROL DE FÁBRICA: No se puede emitir fabricación para un pedido cancelado.';
  END IF;

  -- D. BLOQUEAR Y VALIDAR ÍTEM DE PEDIDO
  SELECT * INTO v_order_item FROM public.order_items WHERE id = p_order_item_id AND order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El ítem indicado no pertenece al pedido.';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad a fabricar debe ser mayor a cero.';
  END IF;

  -- Control 3: No superar cantidades disponibles para fabricación
  SELECT COALESCE(SUM(quantity), 0) INTO v_issued_so_far
  FROM public.manufacturing_orders
  WHERE order_item_id = p_order_item_id
    AND status IN ('issued', 'in_production', 'completed');

  IF (v_issued_so_far + p_quantity) > v_order_item.quantity THEN
    RAISE EXCEPTION 'CANTIDAD EXCEDIDA: El ítem cuenta con % unidades vendidas, % ya emitidas, y se intentan emitir % (máximo disponible: %).',
      v_order_item.quantity, v_issued_so_far, p_quantity, (v_order_item.quantity - v_issued_so_far);
  END IF;

  -- E. VALIDAR COMPOSICIÓN TÉCNICA (BOM)
  IF p_bom_id IS NULL THEN
    RAISE EXCEPTION 'CONTROL DE FÁBRICA: Se requiere indicar obligatoriamente una composición técnica (BOM) publicada para emitir fabricación.';
  END IF;

  SELECT * INTO v_bom FROM public.product_compositions WHERE id = p_bom_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La composición base indicada no existe.';
  END IF;

  IF v_bom.status <> 'published' THEN
    RAISE EXCEPTION 'CONTROL DE FÁBRICA: La composición técnica seleccionada no se encuentra publicada (estado actual: %).', v_bom.status;
  END IF;

  -- Comprobar concordancia exacta con producto y variante del ítem si la orden tiene producto asignado
  IF v_order_item.product_id IS NOT NULL AND v_bom.product_id <> v_order_item.product_id THEN
    RAISE EXCEPTION 'DISCORDANCIA TÉCNICA: La composición seleccionada no corresponde al producto del pedido.';
  END IF;

  IF v_order_item.variant_id IS NOT NULL AND v_bom.variant_id IS NOT NULL AND v_bom.variant_id <> v_order_item.variant_id THEN
    RAISE EXCEPTION 'DISCORDANCIA TÉCNICA: La composición seleccionada no corresponde a la variante del ítem solicitado.';
  END IF;

  -- Control de Revisión Administrativa Previa:
  -- El ítem debe haber sido revisado y aprobado formalmente antes de emitirse a producción
  IF v_order_item.configuration_status <> 'approved' THEN
    RAISE EXCEPTION 'CONTROL DE FÁBRICA: La configuración del ítem se encuentra en estado "%". Debe revisarse y aprobarse en Administración antes de emitir la orden de fabricación.',
      v_order_item.configuration_status;
  END IF;

  -- F. VALIDAR CAPACIDAD DE UNA ÚNICA HOJA A4
  IF p_supplies_snapshot IS NOT NULL AND jsonb_typeof(p_supplies_snapshot) = 'array' THEN
    v_supplies_count := jsonb_array_length(p_supplies_snapshot);
    -- Capacidad técnica documentada: máximo 16 filas de insumos consolidables en A4 sin overflow
    IF v_supplies_count > 16 THEN
      RAISE EXCEPTION 'BLOQUEO DE FORMATO A4: La orden contiene % ítems de insumos. La plantilla de hoja única A4 admite un máximo de 16 líneas para garantizar legibilidad y controles de calidad sin desborde.',
        v_supplies_count;
    END IF;
  END IF;

  -- G. GENERAR NÚMERO CORRELATIVO
  v_order_seq := nextval('public.manufacturing_orders_number_seq');
  v_mfg_order_number := 'OF-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_order_seq::TEXT, 5, '0');

  -- H. INSERTAR ORDEN DE FABRICACIÓN
  INSERT INTO public.manufacturing_orders (
    order_number,
    order_id,
    order_item_id,
    product_id,
    variant_id,
    product_name,
    variant_name,
    quantity,
    status,
    bom_id,
    bom_version,
    configuration_snapshot,
    manufacturing_instructions_snapshot,
    supplies_snapshot,
    notes,
    issued_at,
    issued_by_user_id,
    issued_by_name,
    revision_number,
    idempotency_key
  ) VALUES (
    v_mfg_order_number,
    p_order_id,
    p_order_item_id,
    v_order_item.product_id,
    v_order_item.variant_id,
    v_order_item.product_name,
    v_order_item.variant_name,
    p_quantity,
    'issued',
    p_bom_id,
    COALESCE(v_bom.version, 1),
    COALESCE(p_configuration_snapshot, '{}'::jsonb),
    COALESCE(p_manufacturing_instructions_snapshot, '[]'::jsonb),
    COALESCE(p_supplies_snapshot, '[]'::jsonb),
    NULLIF(TRIM(p_notes), ''),
    NOW(),
    p_user_id,
    v_user_name,
    1,
    p_idempotency_key
  ) RETURNING * INTO v_new_mfg_order;

  -- I. ACTUALIZAR CANTIDAD EMITIDA EN EL ÍTEM
  UPDATE public.order_items
  SET manufacturing_issued_quantity = v_issued_so_far + p_quantity,
      configuration_status = 'approved',
      configuration_reviewed_by = p_user_id,
      configuration_reviewed_at = NOW()
  WHERE id = p_order_item_id;

  -- J. ACTUALIZAR ESTADO DEL PEDIDO SI ESTÁ PENDIENTE
  IF v_order.status = 'pending' THEN
    UPDATE public.orders
    SET status = 'processing',
        status_updated_at = NOW(),
        status_updated_by = p_user_id
    WHERE id = p_order_id;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'manufacturingOrderId', v_new_mfg_order.id,
    'orderNumber', v_new_mfg_order.order_number,
    'quantity', v_new_mfg_order.quantity,
    'status', v_new_mfg_order.status,
    'orderId', p_order_id,
    'orderItemId', p_order_item_id
  );

  -- K. REGISTRAR IDEMPOTENCIA
  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    UPDATE public.idempotency_records
    SET status = 'completed',
        response_body = v_result,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND operation_type = 'issue_manufacturing_order'
      AND idempotency_key = p_idempotency_key;
  END IF;

  RETURN v_result;
END;
$$;

-- 14. RPC: REVISIÓN TRAZABLE DE ORDEN EMITIDA (revise_manufacturing_order_transactional)
CREATE OR REPLACE FUNCTION public.revise_manufacturing_order_transactional(
  p_user_id UUID,
  p_manufacturing_order_id UUID,
  p_reason TEXT,
  p_new_configuration_snapshot JSONB,
  p_new_instructions_snapshot JSONB,
  p_new_supplies_snapshot JSONB,
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
  v_user_name TEXT := 'Administración';
  v_parent RECORD;
  v_new_mfg_order RECORD;
  v_new_order_number VARCHAR(50);
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: Solo Administración o ADMIN pueden revisar órdenes de fabricación.';
  END IF;

  IF p_reason IS NULL OR char_length(trim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'Debe justificar la revisión de la orden (mínimo 3 caracteres).';
  END IF;

  SELECT * INTO v_parent FROM public.manufacturing_orders WHERE id = p_manufacturing_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de fabricación no encontrada.';
  END IF;

  IF v_parent.status = 'cancelled' THEN
    RAISE EXCEPTION 'No se puede generar una revisión sobre una orden cancelada.';
  END IF;

  SELECT full_name INTO v_user_name FROM public.administration_users WHERE user_id = p_user_id;
  IF v_user_name IS NULL THEN
    SELECT full_name INTO v_user_name FROM public.admin_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN v_user_name := 'Administración FiveSaint'; END IF;

  -- Marcar orden previa como cancelada / revisada
  UPDATE public.manufacturing_orders
  SET status = 'cancelled',
      notes = COALESCE(notes, '') || ' [Superada por revisión R' || (v_parent.revision_number + 1) || ']'
  WHERE id = p_manufacturing_order_id;

  v_new_order_number := SPLIT_PART(v_parent.order_number, '-R', 1) || '-R' || (v_parent.revision_number + 1);

  INSERT INTO public.manufacturing_orders (
    order_number,
    order_id,
    order_item_id,
    product_id,
    variant_id,
    product_name,
    variant_name,
    quantity,
    status,
    bom_id,
    bom_version,
    configuration_snapshot,
    manufacturing_instructions_snapshot,
    supplies_snapshot,
    notes,
    issued_at,
    issued_by_user_id,
    issued_by_name,
    revision_number,
    parent_manufacturing_order_id,
    revision_reason
  ) VALUES (
    v_new_order_number,
    v_parent.order_id,
    v_parent.order_item_id,
    v_parent.product_id,
    v_parent.variant_id,
    v_parent.product_name,
    v_parent.variant_name,
    v_parent.quantity,
    'issued',
    v_parent.bom_id,
    v_parent.bom_version,
    COALESCE(p_new_configuration_snapshot, v_parent.configuration_snapshot),
    COALESCE(p_new_instructions_snapshot, v_parent.manufacturing_instructions_snapshot),
    COALESCE(p_new_supplies_snapshot, v_parent.supplies_snapshot),
    NULLIF(TRIM(p_notes), ''),
    NOW(),
    p_user_id,
    v_user_name,
    v_parent.revision_number + 1,
    v_parent.id,
    trim(p_reason)
  ) RETURNING * INTO v_new_mfg_order;

  RETURN jsonb_build_object(
    'success', true,
    'newManufacturingOrderId', v_new_mfg_order.id,
    'orderNumber', v_new_mfg_order.order_number,
    'revisionNumber', v_new_mfg_order.revision_number,
    'parentOrderId', v_parent.id
  );
END;
$$;

-- 15. RPC: REVISIÓN DE CONFIGURACIÓN DE ÍTEM DE PEDIDO (review_order_item_configuration_transactional)
CREATE OR REPLACE FUNCTION public.review_order_item_configuration_transactional(
  p_user_id UUID,
  p_order_item_id UUID,
  p_status VARCHAR(30),
  p_review_notes TEXT,
  p_adjusted_configuration JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_is_administration BOOLEAN := false;
  v_user_name TEXT := 'Administración';
  v_order_item RECORD;
BEGIN
  -- A. Autorización estricta: Solo Administración o ADMIN
  SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_admin;
  IF NOT v_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = p_user_id AND is_active = true) INTO v_is_administration;
  END IF;

  IF NOT v_is_admin AND NOT v_is_administration THEN
    RAISE EXCEPTION 'ACCESO DENEGADO: La revisión técnica de configuración está reservada a Administración y ADMIN.';
  END IF;

  IF p_status NOT IN ('approved', 'rejected', 'pending_review') THEN
    RAISE EXCEPTION 'Estado de revisión no válido. Debe ser approved, rejected o pending_review.';
  END IF;

  SELECT full_name INTO v_user_name FROM public.administration_users WHERE user_id = p_user_id;
  IF v_user_name IS NULL THEN
    SELECT full_name INTO v_user_name FROM public.admin_users WHERE user_id = p_user_id;
  END IF;
  IF v_user_name IS NULL THEN v_user_name := 'Administración FiveSaint'; END IF;

  SELECT * INTO v_order_item FROM public.order_items WHERE id = p_order_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El ítem de pedido no existe.';
  END IF;

  UPDATE public.order_items
  SET configuration_status = p_status,
      configuration_reviewed_by = p_user_id,
      configuration_reviewed_at = NOW(),
      configuration_review_notes = NULLIF(TRIM(p_review_notes), ''),
      configuration = COALESCE(p_adjusted_configuration, configuration)
  WHERE id = p_order_item_id;

  RETURN jsonb_build_object(
    'success', true,
    'orderItemId', p_order_item_id,
    'order_item_id', p_order_item_id,
    'configurationStatus', p_status,
    'configuration_status', p_status,
    'reviewedByName', v_user_name
  );
END;
$$;

-- 16. SEGURIDAD Y PERMISOS DE TABLAS
ALTER TABLE public.client_assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.composition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configurable_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturing_orders ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.client_assignment_history FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.supplies FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.product_compositions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.composition_items FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.configurable_options FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.manufacturing_orders FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.client_assignment_history TO service_role;
GRANT ALL ON TABLE public.supplies TO service_role;
GRANT ALL ON TABLE public.product_compositions TO service_role;
GRANT ALL ON TABLE public.composition_items TO service_role;
GRANT ALL ON TABLE public.configurable_options TO service_role;
GRANT ALL ON TABLE public.manufacturing_orders TO service_role;

GRANT USAGE, SELECT ON SEQUENCE public.manufacturing_orders_number_seq TO service_role;

-- Políticas de lectura controlada si el cliente usa Supabase Client directo
DROP POLICY IF EXISTS p_admin_supplies_all ON public.supplies;
CREATE POLICY p_admin_supplies_all ON public.supplies FOR ALL TO authenticated
  USING (
    EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true) OR
    EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS p_admin_compositions_all ON public.product_compositions;
CREATE POLICY p_admin_compositions_all ON public.product_compositions FOR ALL TO authenticated
  USING (
    EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true) OR
    EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS p_admin_composition_items_all ON public.composition_items;
CREATE POLICY p_admin_composition_items_all ON public.composition_items FOR ALL TO authenticated
  USING (
    EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true) OR
    EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS p_options_read_sellers ON public.configurable_options;
CREATE POLICY p_options_read_sellers ON public.configurable_options FOR SELECT TO authenticated
  USING (
    is_active = true OR
    EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true) OR
    EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS p_admin_options_modify ON public.configurable_options;
CREATE POLICY p_admin_options_modify ON public.configurable_options FOR ALL TO authenticated
  USING (
    EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true) OR
    EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS p_admin_mfg_orders_all ON public.manufacturing_orders;
CREATE POLICY p_admin_mfg_orders_all ON public.manufacturing_orders FOR ALL TO authenticated
  USING (
    EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true) OR
    EXISTS(SELECT 1 FROM public.administration_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- 17. PERMISOS ESTRICTOS DE RPCS: REVOCAR DE ANON Y AUTHENTICATED
-- Las funciones de negocio transaccionales deben ser ejecutadas exclusivamente por el backend seguro (service_role)
DO $$
DECLARE fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN (
      'reassign_client_transactional',
      'fn_delete_client_safe',
      'publish_product_composition_transactional',
      'issue_manufacturing_order_transactional',
      'revise_manufacturing_order_transactional',
      'review_order_item_configuration_transactional'
    )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
  END LOOP;
END;
$$;

COMMIT;
