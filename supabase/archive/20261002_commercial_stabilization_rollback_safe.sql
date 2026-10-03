-- =========================================================================
-- ESTRATEGIA DE REVERSIÓN SEGURA (SAFE ROLLBACK) - SIN PÉRDIDA DE DATOS
-- FiveSaint - Módulo Comercial
-- =========================================================================
-- IMPORTANTE:
-- De acuerdo a las directivas del sprint, NO se ejecutan sentencias 'DROP COLUMN'
-- ni 'DROP TABLE' en un rollback operativo. Si se eliminaran columnas añadidas,
-- se destruirían irremediablemente los snapshots de clientes, tokens públicos,
-- notas de auditoría y relaciones de pedidos creados durante la ejecución.
--
-- ESTRATEGIA ADOPTADA: COMPATIBILIDAD HACIA ADELANTE (FORWARD COMPATIBILITY).
-- 1. Las columnas aditivas se mantienen intactas y accesibles.
-- 2. El código anterior es 100% compatible con el esquema ampliado porque
--    todas las nuevas columnas tienen valores predeterminados (DEFAULT) o son NULLABLE.
-- 3. Para revertir la aplicación, se despliega la versión de código anterior en Vercel/servidor.
-- 4. Si se requiriera suspender las funciones RPC avanzadas por alguna anomalía:
--    se ejecutan únicamente los DROP FUNCTION siguientes, preservando toda la información.
-- =========================================================================

-- Desactivación opcional de funciones RPC avanzadas (solo si se requiere fallback a queries directas)
DROP FUNCTION IF EXISTS public.cancel_order_transactional(UUID, UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.convert_budget_transactional(UUID, UUID, JSONB, VARCHAR, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_budget_transactional(UUID, UUID, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC);

-- NOTA: NO se eliminan:
-- - public.idempotency_records
-- - Columnas client_snapshot, seller_snapshot, calculation_snapshot en budgets
-- - Columna converted_quantity en budget_items
-- - Columna budget_item_id en order_items
-- - Columna public_token ni public_status
-- Todos los datos creados se conservan para auditoría y continuidad operativa.
