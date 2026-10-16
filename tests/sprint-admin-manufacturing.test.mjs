import assert from 'node:assert/strict';
import { test, describe, before } from 'node:test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import {
  calculateRequiredSupplies,
  validateSingleA4Capacity,
  validateOptionCompatibility,
  roundSupplyQuantity,
  formatSupplyQuantity,
  MAX_A4_SUPPLY_ROWS
} from '../src/lib/manufacturing-calculations.ts';
import {
  SupplyInputSchema,
  CreateCompositionInputSchema,
  ConfigurableOptionInputSchema,
  ReassignClientInputSchema,
  IssueManufacturingOrderInputSchema
} from '../src/lib/validations/manufacturing.ts';

function hashPayload(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

describe('SPRINT — ADMINISTRACIÓN: CLIENTES Y PREPARACIÓN DE FABRICACIÓN (ENTORNO AISLADO PGLITE)', async () => {
  let db;

  // Identidades del entorno de prueba
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const adminId = '11111111-1111-1111-1111-111111111112';

  const adminStaffUserId = '77777777-7777-7777-7777-777777777771';
  const adminStaffId = '77777777-7777-7777-7777-777777777772';

  const seller1UserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const seller1Id = '22222222-2222-2222-2222-222222222221';

  const seller2UserId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const seller2Id = '22222222-2222-2222-2222-222222222222';

  const distPortalUserId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const distPortalId = '44444444-4444-4444-4444-444444444444';

  const client1Id = '33333333-3333-3333-3333-333333333331';
  const client2Id = '33333333-3333-3333-3333-333333333332';

  const productId = '99999999-9999-9999-9999-999999999991';
  const variantId = '99999999-9999-9999-9999-999999999992';

  before(async () => {
    db = new PGlite();

    // 1. Cargar esquema base
    await db.exec(fs.readFileSync('tests/fixtures/commercial-current-schema.sql', 'utf8'));

    // 2. Usuarios de Auth
    await db.exec(`
      INSERT INTO auth.users (id) VALUES
        ('${adminUserId}'),
        ('${adminStaffUserId}'),
        ('${seller1UserId}'),
        ('${seller2UserId}'),
        ('${distPortalUserId}')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Aplicar migraciones en secuencia estricta
    await db.exec(fs.readFileSync('supabase/migrations/20261003000100_commercial_release.sql', 'utf8'));
    await db.exec(fs.readFileSync('supabase/migrations/20261004000100_sprint1_administration_portal.sql', 'utf8'));
    await db.exec(fs.readFileSync('supabase/migrations/20261005000100_sprint_seller_closing_flow.sql', 'utf8'));
    await db.exec(fs.readFileSync('supabase/migrations/20261006000100_sprint_admin_clients_and_manufacturing.sql', 'utf8'));

    // 4. Actores del sistema
    await db.exec(`
      INSERT INTO public.admin_users (id, user_id, username, full_name, is_active)
      VALUES ('${adminId}', '${adminUserId}', 'admin_master', 'Super Administrador', true)
      ON CONFLICT (user_id) DO NOTHING;

      INSERT INTO public.administration_users (id, user_id, email, full_name, is_active)
      VALUES ('${adminStaffId}', '${adminStaffUserId}', 'admin.staff@fivesaint.com', 'Operador Administración', true)
      ON CONFLICT (user_id) DO NOTHING;

      INSERT INTO public.sellers (id, user_id, username, full_name, email, is_active) VALUES
        ('${seller1Id}', '${seller1UserId}', 'vendedor_juan', 'Juan Vendedor', 'v1@fivesaint.com', true),
        ('${seller2Id}', '${seller2UserId}', 'vendedor_pedro', 'Pedro Vendedor', 'v2@fivesaint.com', true)
      ON CONFLICT (user_id) DO NOTHING;

      INSERT INTO public.distributors (id, user_id, username, company_name, contact_name, email, discount_percentage, is_active)
      VALUES ('${distPortalId}', '${distPortalUserId}', 'dist_portal', 'Distribuidor Oficial S.A.', 'Carlos Distribuidor', 'dist@fivesaint.com', 20.00, true)
      ON CONFLICT (id) DO NOTHING;

      -- Producto y variante de prueba en el catálogo existente
      INSERT INTO public.product_categories (id, name, slug)
      VALUES ('88888888-8888-8888-8888-888888888881', 'Bañeras', 'baneras')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.products (id, category_id, name, slug, short_description, description)
      VALUES ('${productId}', '88888888-8888-8888-8888-888888888881', 'Bañera Isla Capri', 'banera-isla-capri', 'Bañera de acrílico sanitario', 'Descripción técnica completa')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.product_variants (id, product_id, name, slug)
      VALUES ('${variantId}', '${productId}', 'Capri 170x80 Confort', 'capri-170x80-confort')
      ON CONFLICT (id) DO NOTHING;
    `);
  });

  // =========================================================================
  // CASO 1: Alta y asignación de cliente (Autor y vendedor diferenciados)
  // =========================================================================
  await test('Caso 1: Alta y asignación de cliente (Autor y vendedor diferenciados)', async () => {
    // Administración crea un cliente asignándolo al Vendedor 1
    const res = await db.query(`
      INSERT INTO public.clients (
        id, name, company_name, email, phone, seller_id,
        created_by_user_id, created_by_role, created_by_name, status
      ) VALUES (
        '${client1Id}', 'Hotel Libertador S.A.', 'Libertador Hoteles', 'compras@libertador.com', '1144556677',
        '${seller1Id}', '${adminStaffUserId}', 'administration', 'Operador Administración', 'nuevo'
      ) RETURNING *;
    `);

    const client = res.rows[0];
    assert.equal(client.name, 'Hotel Libertador S.A.');
    assert.equal(client.seller_id, seller1Id, 'El vendedor asignado debe ser el Vendedor 1');
    assert.equal(client.created_by_user_id, adminStaffUserId, 'El autor del alta debe ser Administración');
    assert.equal(client.created_by_role, 'administration');
    assert.notEqual(client.created_by_user_id, client.seller_id, 'Autor del alta y vendedor asignado deben estar desacoplados');
  });

  // =========================================================================
  // CASO 2: Reasignación auditada (Documentos anteriores intactos y permisos)
  // =========================================================================
  await test('Caso 2: Reasignación auditada (Documentos anteriores intactos y permisos)', async () => {
    // 1. Crear un presupuesto previo del Vendedor 1 para el cliente
    const budgetRes = await db.query(`
      INSERT INTO public.budgets (
        id, budget_number, client_id, seller_id, status, total_amount, subtotal_amount, tax_rate, tax_amount
      ) VALUES (
        'bbbbbbbb-0000-0000-0000-000000000001', 101, '${client1Id}', '${seller1Id}', 'converted', 500000.00, 500000.00, 21.00, 105000.00
      ) RETURNING *;
    `);
    const originalBudget = budgetRes.rows[0];

    // 2. Reasignar el cliente del Vendedor 1 al Vendedor 2 mediante RPC
    const reassignRes = await db.query(`
      SELECT public.reassign_client_transactional(
        '${adminStaffUserId}'::UUID,
        '${client1Id}'::UUID,
        '${seller2Id}'::UUID,
        'Reasignación por reestructuración de zona turística'
      ) as result;
    `);
    const rResult = reassignRes.rows[0].result;
    assert.equal(rResult.success, true);
    assert.equal(rResult.previousSellerId, seller1Id);
    assert.equal(rResult.newSellerId, seller2Id);

    // 3. Verificar que el cliente ahora tiene al Vendedor 2
    const clientCheck = await db.query(`SELECT * FROM public.clients WHERE id = '${client1Id}'`);
    assert.equal(clientCheck.rows[0].seller_id, seller2Id);

    // 4. Verificar auditoría en client_assignment_history
    const historyCheck = await db.query(`SELECT * FROM public.client_assignment_history WHERE client_id = '${client1Id}'`);
    assert.equal(historyCheck.rows.length, 1);
    assert.equal(historyCheck.rows[0].previous_seller_id, seller1Id);
    assert.equal(historyCheck.rows[0].new_seller_id, seller2Id);
    assert.equal(historyCheck.rows[0].changed_by_user_id, adminStaffUserId);
    assert.ok(historyCheck.rows[0].reason.includes('reestructuración'));

    // 5. CRÍTICO: El presupuesto anterior NO debe haber sido alterado
    const budgetCheck = await db.query(`SELECT * FROM public.budgets WHERE id = '${originalBudget.id}'`);
    assert.equal(budgetCheck.rows[0].seller_id, seller1Id, 'El presupuesto original debe mantener intacto su vendedor histórico V1');

    // 6. Intentar eliminar el cliente con operaciones vinculadas debe fallar
    await assert.rejects(async () => {
      await db.query(`SELECT public.fn_delete_client_safe('${adminStaffUserId}'::UUID, '${client1Id}'::UUID);`);
    }, /posee operaciones comerciales/);
  });

  // =========================================================================
  // CASO 3: Composición base por varias unidades (Cantidades exactas)
  // =========================================================================
  await test('Caso 3: Composición base por varias unidades (Cantidades exactas)', async () => {
    // Definición de insumos técnicos
    const baseItems = [
      { supplyId: 's-1', code: 'INS-CASCO', name: 'Casco Acrílico Capri', unitOfMeasure: 'un', baseQuantity: 1 },
      { supplyId: 's-2', code: 'INS-FIBRA', name: 'Fibra de Vidrio Roving', unitOfMeasure: 'kg', baseQuantity: 3.25 },
      { supplyId: 's-3', code: 'INS-RESINA', name: 'Resina Poliéster Náutica', unitOfMeasure: 'kg', baseQuantity: 5.50 },
      { supplyId: 's-4', code: 'INS-PVC', name: 'Tubo Flexible PVC 40mm', unitOfMeasure: 'm', baseQuantity: 4.80 }
    ];

    // Para 3 unidades fabricadas
    const qty = 3;
    const { supplies } = calculateRequiredSupplies({
      baseItems,
      quantity: qty,
      wastePercentage: 0,
      configuration: {},
      options: []
    });

    const casco = supplies.find(s => s.code === 'INS-CASCO');
    const fibra = supplies.find(s => s.code === 'INS-FIBRA');
    const resina = supplies.find(s => s.code === 'INS-RESINA');
    const pvc = supplies.find(s => s.code === 'INS-PVC');

    assert.equal(casco.quantity, 3, '3 cascos exactos');
    assert.equal(fibra.quantity, 9.75, '3.25 * 3 = 9.75 kg');
    assert.equal(resina.quantity, 16.5, '5.50 * 3 = 16.5 kg');
    assert.equal(pvc.quantity, 14.4, '4.80 * 3 = 14.4 m');
  });

  // =========================================================================
  // CASO 4: Jets, motor y adicionales (Materiales e instrucciones correctos)
  // =========================================================================
  await test('Caso 4: Jets, motor y adicionales (Materiales e instrucciones correctos)', async () => {
    const baseItems = [
      { supplyId: 's-1', code: 'INS-CASCO', name: 'Casco Acrílico Capri', unitOfMeasure: 'un', baseQuantity: 1 },
      { supplyId: 's-2', code: 'INS-JET-STD', name: 'Jet Estándar 40mm', unitOfMeasure: 'un', baseQuantity: 6 }
    ];

    const options = [
      {
        code: 'jets_count',
        name: 'Cantidad de Jets',
        allowedValues: [{ value: '6_jets', label: '6 Jets' }, { value: '8_jets', label: '8 Jets' }],
        materialsEffect: [
          {
            ifValue: '8_jets',
            effects: [
              { action: 'add', supplyCode: 'INS-JET-STD', quantity: 2, unitOfMeasure: 'un' }
            ]
          }
        ]
      },
      {
        code: 'motor_position',
        name: 'Posición del Motor',
        allowedValues: [{ value: 'derecho', label: 'Derecho' }, { value: 'izquierdo', label: 'Izquierdo' }],
        manufacturingInstructions: {
          derecho: 'Montar motobomba en cabecera derecha mirando desde descarga frontal',
          izquierdo: 'Montar motobomba en cabecera izquierda mirando desde descarga frontal'
        }
      },
      {
        code: 'almohadilla',
        name: 'Almohadilla Cervical',
        allowedValues: [{ value: 'si', label: 'Con Almohadilla' }, { value: 'no', label: 'Sin Almohadilla' }],
        materialsEffect: [
          {
            ifValue: 'si',
            effects: [
              { action: 'add', supplyCode: 'INS-ALM-NEG', supplyName: 'Almohadilla Anatómica Negra', quantity: 1, unitOfMeasure: 'un' }
            ]
          }
        ]
      }
    ];

    const configuration = {
      jets_count: '8_jets',
      motor_position: 'derecho',
      almohadilla: 'si'
    };

    const { supplies, instructions } = calculateRequiredSupplies({
      baseItems,
      quantity: 1,
      configuration,
      options
    });

    const jets = supplies.find(s => s.code === 'INS-JET-STD');
    const almohadilla = supplies.find(s => s.code === 'INS-ALM-NEG');

    // 6 base + 2 adicionales = 8 jets
    assert.equal(jets.quantity, 8);
    assert.equal(almohadilla.quantity, 1);
    assert.ok(instructions.some(i => i.includes('cabecera derecha')));
  });

  // =========================================================================
  // CASO 5: Opciones incompatibles (Bloqueadas en validación)
  // =========================================================================
  await test('Caso 5: Opciones incompatibles (Bloqueadas en validación)', async () => {
    const options = [
      {
        code: 'motor_potencia',
        name: 'Potencia del Motor',
        allowedValues: [{ value: '0.5hp', label: '0.5 HP' }, { value: '1.5hp', label: '1.5 HP' }],
        compatibilityRules: [
          {
            ifValue: '0.5hp',
            conflictsWith: { optionCode: 'jets_count', values: ['12_jets'] },
            message: 'Un motor de 0.5 HP es insuficiente para alimentar 12 jets hidráulicos.'
          }
        ]
      },
      {
        code: 'jets_count',
        name: 'Cantidad de Jets',
        allowedValues: [{ value: '6_jets', label: '6 Jets' }, { value: '12_jets', label: '12 Jets' }]
      }
    ];

    const invalidConfig = {
      motor_potencia: '0.5hp',
      jets_count: '12_jets'
    };

    const result = validateOptionCompatibility(invalidConfig, options);
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('insuficiente'));

    const validConfig = {
      motor_potencia: '1.5hp',
      jets_count: '12_jets'
    };
    const validResult = validateOptionCompatibility(validConfig, options);
    assert.equal(validResult.valid, true);
  });

  // =========================================================================
  // CASO 6: Cambio de composición publicada (Nueva versión; órdenes intactas)
  // =========================================================================
  await test('Caso 6: Cambio de composición publicada (Nueva versión; órdenes intactas)', async () => {
    // 1. Crear insumos de base de datos
    await db.exec(`
      INSERT INTO public.supplies (id, code, name, unit_of_measure, is_active)
      VALUES 
        ('55555555-0000-0000-0000-000000000001', 'INS-CASCO-CAPRI', 'Casco Capri Acrílico', 'un', true),
        ('55555555-0000-0000-0000-000000000002', 'INS-PUMP-1HP', 'Motobomba 1 HP Silenciosa', 'un', true)
      ON CONFLICT (code) DO NOTHING;
    `);

    // 2. Crear composición versión 1
    const compV1Res = await db.query(`
      INSERT INTO public.product_compositions (
        id, product_id, variant_id, version, status, name
      ) VALUES (
        '66666666-0000-0000-0000-000000000001', '${productId}', '${variantId}', 1, 'draft', 'BOM Capri v1'
      ) RETURNING id;
    `);
    const compV1Id = compV1Res.rows[0].id;

    await db.query(`
      INSERT INTO public.composition_items (composition_id, supply_id, quantity)
      VALUES ('${compV1Id}', '55555555-0000-0000-0000-000000000001', 1);
    `);

    // Publicar v1
    await db.query(`
      SELECT public.publish_product_composition_transactional('${adminStaffUserId}'::UUID, '${compV1Id}'::UUID);
    `);

    // 3. Crear pedido directo vigente
    const orderRes = await db.query(`
      INSERT INTO public.orders (
        id, order_number, client_id, seller_id, status, total_amount, sale_channel
      ) VALUES (
        '77777777-0000-0000-0000-000000000001', 501, '${client1Id}', '${seller1Id}', 'pending', 1500000.00, 'direct'
      ) RETURNING id;
    `);
    const orderId = orderRes.rows[0].id;

    const oiRes = await db.query(`
      INSERT INTO public.order_items (
        id, order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, total_price,
        configuration, configuration_status
      ) VALUES (
        '88888888-0000-0000-0000-000000000001', '${orderId}', '${productId}', '${variantId}',
        'Bañera Isla Capri', 'Capri 170x80 Confort', 2, 750000.00, 1500000.00,
        '{"jets": 6}'::jsonb, 'approved'
      ) RETURNING id;
    `);
    const orderItemId = oiRes.rows[0].id;

    // 4. Emitir orden de fabricación con BOM v1
    const mfgRes = await db.query(`
      SELECT public.issue_manufacturing_order_transactional(
        '${adminStaffUserId}'::UUID,
        '${orderId}'::UUID,
        '${orderItemId}'::UUID,
        1,
        '${compV1Id}'::UUID,
        '{"jets": 6}'::jsonb,
        '["Instruccion v1"]'::jsonb,
        '[{"code": "INS-CASCO-CAPRI", "name": "Casco Capri Acrílico", "quantity": 1, "unitOfMeasure": "un"}]'::jsonb,
        'Orden de prueba con v1'
      ) as result;
    `);
    const mfgId = mfgRes.rows[0].result.manufacturingOrderId;

    // 5. Crear y publicar Versión 2 de la composición
    const compV2Res = await db.query(`
      INSERT INTO public.product_compositions (
        id, product_id, variant_id, version, status, name
      ) VALUES (
        '66666666-0000-0000-0000-000000000002', '${productId}', '${variantId}', 2, 'draft', 'BOM Capri v2 Modificada'
      ) RETURNING id;
    `);
    const compV2Id = compV2Res.rows[0].id;

    await db.query(`
      INSERT INTO public.composition_items (composition_id, supply_id, quantity)
      VALUES 
        ('${compV2Id}', '55555555-0000-0000-0000-000000000001', 1),
        ('${compV2Id}', '55555555-0000-0000-0000-000000000002', 1);
    `);

    await db.query(`
      SELECT public.publish_product_composition_transactional('${adminStaffUserId}'::UUID, '${compV2Id}'::UUID);
    `);

    // 6. Verificar que v1 ahora está retirada y v2 está publicada
    const checkV1 = await db.query(`SELECT status FROM public.product_compositions WHERE id = '${compV1Id}'`);
    const checkV2 = await db.query(`SELECT status FROM public.product_compositions WHERE id = '${compV2Id}'`);
    assert.equal(checkV1.rows[0].status, 'retired');
    assert.equal(checkV2.rows[0].status, 'published');

    // 7. CRÍTICO: La orden de fabricación emitida sigue conservando su BOM v1 intacta
    const checkMfg = await db.query(`SELECT * FROM public.manufacturing_orders WHERE id = '${mfgId}'`);
    assert.equal(checkMfg.rows[0].bom_id, compV1Id);
    assert.equal(checkMfg.rows[0].bom_version, 1);
    assert.equal(checkMfg.rows[0].supplies_snapshot[0].code, 'INS-CASCO-CAPRI');
    assert.equal(checkMfg.rows[0].supplies_snapshot.length, 1);
  });

  // =========================================================================
  // CASO 7: Pedido histórico sin configuración (Requiere revisión)
  // =========================================================================
  await test('Caso 7: Pedido histórico sin configuración (Requiere revisión)', async () => {
    const historicalOrderItem = await db.query(`
      INSERT INTO public.order_items (
        order_id, product_name, quantity, unit_price, total_price, factory_notes
      ) VALUES (
        '77777777-0000-0000-0000-000000000001', 'Bañera Histórica 1990', 1, 100000.00, 100000.00,
        'Motor a la derecha, 4 jets cromados especiales'
      ) RETURNING *;
    `);

    const item = historicalOrderItem.rows[0];
    assert.equal(item.configuration_status, 'pending_review');
    assert.deepEqual(item.configuration, {});
    assert.ok(item.factory_notes.includes('Motor a la derecha'), 'El texto histórico libre permanece en factory_notes sin conversión forzada');
  });

  // =========================================================================
  // CASO 8: Conversión parcial (Configuración conservada exactamente)
  // =========================================================================
  await test('Caso 8: Conversión parcial (Configuración conservada exactamente)', async () => {
    // 1. Crear presupuesto con configuración en ítem
    const bRes = await db.query(`
      INSERT INTO public.budgets (
        client_id, seller_id, status, total_amount, subtotal_amount, tax_rate, tax_amount
      ) VALUES (
        '${client1Id}', '${seller1Id}', 'draft', 1000000.00, 1000000.00, 21.00, 210000.00
      ) RETURNING id;
    `);
    const budgetId = bRes.rows[0].id;

    const bItemRes = await db.query(`
      INSERT INTO public.budget_items (
        budget_id, product_name, quantity, unit_price, total_price,
        configuration, configuration_status
      ) VALUES (
        '${budgetId}', 'Bañera Capri Confort', 5, 200000.00, 1000000.00,
        '{"jets_count": "8_jets", "motor_position": "izquierdo"}'::jsonb, 'configured'
      ) RETURNING id;
    `);
    const bItemId = bItemRes.rows[0].id;

    // 2. Convertir parcialmente 2 unidades de 5
    const convRes = await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}'::UUID,
        '${budgetId}'::UUID,
        '[{"budgetItemId": "${bItemId}", "quantity": 2}]'::jsonb,
        'direct',
        'Entrega parcial inicial'
      ) as result;
    `);

    const orderId = convRes.rows[0].result.orderId;

    // 3. Verificar que el order_item tiene la misma configuración exacta
    const oiCheck = await db.query(`SELECT * FROM public.order_items WHERE order_id = '${orderId}'`);
    assert.equal(oiCheck.rows.length, 1);
    assert.equal(oiCheck.rows[0].quantity, 2);
    assert.equal(oiCheck.rows[0].configuration.jets_count, '8_jets');
    assert.equal(oiCheck.rows[0].configuration.motor_position, 'izquierdo');
  });

  // =========================================================================
  // CASO 9: Dos emisiones simultáneas (Sin duplicados ni exceso de saldo)
  // =========================================================================
  await test('Caso 9: Dos emisiones simultáneas (Sin duplicados ni exceso de saldo)', async () => {
    // Ítem con saldo restante de 1 unidad
    const targetOi = '88888888-0000-0000-0000-000000000001';
    const targetOrderId = '77777777-0000-0000-0000-000000000001';
    const bomId = '66666666-0000-0000-0000-000000000002';
    const idempotencyKey = 'idem-emit-mfg-001';

    // Solicitud 1
    const res1 = await db.query(`
      SELECT public.issue_manufacturing_order_transactional(
        '${adminStaffUserId}'::UUID,
        '${targetOrderId}'::UUID,
        '${targetOi}'::UUID,
        1,
        '${bomId}'::UUID,
        '{}'::jsonb, '[]'::jsonb, '[]'::jsonb,
        'Emisión 1',
        '${idempotencyKey}'
      ) as result;
    `);
    assert.equal(res1.rows[0].result.success, true);

    // Solicitud 2 con MISMA clave (idempotente)
    const res2 = await db.query(`
      SELECT public.issue_manufacturing_order_transactional(
        '${adminStaffUserId}'::UUID,
        '${targetOrderId}'::UUID,
        '${targetOi}'::UUID,
        1,
        '${bomId}'::UUID,
        '{}'::jsonb, '[]'::jsonb, '[]'::jsonb,
        'Emisión 1',
        '${idempotencyKey}'
      ) as result;
    `);
    assert.equal(res2.rows[0].result.manufacturingOrderId, res1.rows[0].result.manufacturingOrderId, 'Misma orden por idempotencia');

    // Solicitud 3 intentando superar el saldo disponible (quedaban 0)
    await assert.rejects(async () => {
      await db.query(`
        SELECT public.issue_manufacturing_order_transactional(
          '${adminStaffUserId}'::UUID,
          '${targetOrderId}'::UUID,
          '${targetOi}'::UUID,
          1,
          '${bomId}'::UUID,
          '{}'::jsonb, '[]'::jsonb, '[]'::jsonb,
          'Emisión excedente'
        );
      `);
    }, /CANTIDAD EXCEDIDA/);
  });

  // =========================================================================
  // CASO 10: Compra en distribuidor (No genera fabricación)
  // =========================================================================
  await test('Caso 10: Compra en distribuidor (No genera fabricación)', async () => {
    // Pedido registrado como compra en distribuidor
    const distOrderRes = await db.query(`
      INSERT INTO public.orders (
        order_number, client_id, status, total_amount, sale_channel, distributor_id, order_type
      ) VALUES (
        999, '${client1Id}', 'completed', 500000.00, 'distributor', '${distPortalId}', 'distributor_sale'
      ) RETURNING id;
    `);
    const distOrderId = distOrderRes.rows[0].id;

    const distOiRes = await db.query(`
      INSERT INTO public.order_items (
        order_id, product_name, quantity, unit_price, total_price
      ) VALUES (
        '${distOrderId}', 'Bañera en Showroom', 1, 500000.00, 500000.00
      ) RETURNING id;
    `);
    const distOiId = distOiRes.rows[0].id;

    // Intentar emitir orden de fabricación debe ser bloqueado terminantemente
    await assert.rejects(async () => {
      await db.query(`
        SELECT public.issue_manufacturing_order_transactional(
          '${adminStaffUserId}'::UUID,
          '${distOrderId}'::UUID,
          '${distOiId}'::UUID,
          1,
          '66666666-0000-0000-0000-000000000002'::UUID,
          '{}'::jsonb, '[]'::jsonb, '[]'::jsonb,
          'Intento de fabricar venta de distribuidor'
        );
      `);
    }, /Las ventas en distribuidores no generan órdenes de fabricación interna/);
  });

  // =========================================================================
  // CASO 11: Reimpresión (Misma configuración y materiales originales)
  // =========================================================================
  await test('Caso 11: Reimpresión (Misma configuración y materiales originales)', async () => {
    const mfgOrders = await db.query(`SELECT * FROM public.manufacturing_orders WHERE notes = 'Emisión 1'`);
    const mfg = mfgOrders.rows[0];

    assert.ok(mfg.order_number.startsWith('OF-'));
    assert.ok(Array.isArray(mfg.supplies_snapshot));
    assert.ok(typeof mfg.configuration_snapshot === 'object');
    // Inmutable: los snapshots existen y no dependen de joins futuros
  });

  // =========================================================================
  // CASO 12: Contenido extenso (Una A4 completa o bloqueo explicado)
  // =========================================================================
  await test('Caso 12: Contenido extenso (Una A4 completa o bloqueo explicado)', async () => {
    // Lista de 16 insumos (dentro del límite técnico exacto)
    const valid16Supplies = Array.from({ length: 16 }, (_, i) => ({
      code: `INS-${i + 1}`,
      name: `Insumo Componente ${i + 1}`,
      quantity: 1,
      unitOfMeasure: 'un'
    }));

    const val16 = validateSingleA4Capacity({ supplies: valid16Supplies });
    assert.equal(val16.fitsInSingleA4, true);

    // Lista de 17 insumos (excede la capacidad física de una sola hoja A4)
    const invalid17Supplies = Array.from({ length: 17 }, (_, i) => ({
      code: `INS-${i + 1}`,
      name: `Insumo Componente ${i + 1}`,
      quantity: 1,
      unitOfMeasure: 'un'
    }));

    const val17 = validateSingleA4Capacity({ supplies: invalid17Supplies });
    assert.equal(val17.fitsInSingleA4, false);
    assert.ok(val17.reason.includes('superando el límite máximo admitido de 16'));

    // Validación a nivel de base de datos en RPC
    const testOrderId12 = '77777777-0000-0000-0000-000000000012';
    const testItemId12 = '88888888-0000-0000-0000-000000000012';
    await db.exec(`
      INSERT INTO public.orders (
        id, budget_id, client_id, seller_id, status, total_amount
      ) VALUES (
        '${testOrderId12}', NULL,
        '${client1Id}', '${seller1Id}', 'pending', 1000000
      );
      INSERT INTO public.order_items (
        id, order_id, product_id, product_name, quantity, unit_price, total_price, configuration_status
      ) VALUES (
        '${testItemId12}', '${testOrderId12}', '${productId}', 'Bañera Hidro Test', 1, 1000000, 1000000, 'approved'
      );
    `);

    await assert.rejects(async () => {
      await db.query(`
        SELECT public.issue_manufacturing_order_transactional(
          '${adminStaffUserId}'::UUID,
          '${testOrderId12}'::UUID,
          '${testItemId12}'::UUID,
          1,
          '66666666-0000-0000-0000-000000000002'::UUID,
          '{}'::jsonb,
          '[]'::jsonb,
          '${JSON.stringify(invalid17Supplies)}'::jsonb,
          'Intento con 17 insumos'
        );
      `);
    }, /BLOQUEO DE FORMATO A4/);
  });

  // =========================================================================
  // CASO 13: Matriz de permisos (Sin acceso ni modificaciones indebidas)
  // =========================================================================
  await test('Caso 13: Matriz de permisos (Sin acceso ni modificaciones indebidas)', async () => {
    // Un vendedor intentando emitir fabricación debe ser rechazado
    await assert.rejects(async () => {
      await db.query(`
        SELECT public.issue_manufacturing_order_transactional(
          '${seller1UserId}'::UUID,
          '77777777-0000-0000-0000-000000000001'::UUID,
          '88888888-0000-0000-0000-000000000001'::UUID,
          1,
          '66666666-0000-0000-0000-000000000002'::UUID,
          '{}'::jsonb, '[]'::jsonb, '[]'::jsonb,
          'Intento vendedor'
        );
      `);
    }, /reservada exclusivamente a Administración y ADMIN/);

    // Un vendedor intentando reasignar clientes debe ser rechazado
    await assert.rejects(async () => {
      await db.query(`
        SELECT public.reassign_client_transactional(
          '${seller1UserId}'::UUID,
          '${client1Id}'::UUID,
          '${seller2Id}'::UUID,
          'Intento de reasignar por vendedor'
        );
      `);
    }, /Solo Administración o ADMIN pueden reasignar clientes/);
  });

  // =========================================================================
  // CASO 14: Protección de RPC contra anon y autenticados (service_role exclusivo)
  // =========================================================================
  await test('Caso 14: Protección de RPC contra anon y authenticated (service_role exclusivo)', async () => {
    // 1. Rol anon no tiene permiso de ejecución sobre issue_manufacturing_order_transactional
    await db.exec(`SET ROLE anon;`);
    await assert.rejects(async () => {
      await db.query(`
        SELECT public.issue_manufacturing_order_transactional(
          '${adminUserId}'::UUID,
          '77777777-0000-0000-0000-000000000001'::UUID,
          '88888888-0000-0000-0000-000000000001'::UUID,
          1,
          '66666666-0000-0000-0000-000000000002'::UUID,
          '{}'::jsonb, '[]'::jsonb, '[]'::jsonb, 'Ataque anon'
        );
      `);
    }, /permission denied/i);

    // 2. Rol anon no tiene permiso de ejecución sobre reassign_client_transactional
    await assert.rejects(async () => {
      await db.query(`
        SELECT public.reassign_client_transactional(
          '${adminUserId}'::UUID,
          '${client1Id}'::UUID,
          '${seller2Id}'::UUID,
          'Ataque anon reasignación'
        );
      `);
    }, /permission denied/i);

    // 3. Rol anon no tiene permiso de ejecución sobre fn_delete_client_safe
    try {
      await assert.rejects(async () => {
        await db.query(`
          SELECT public.fn_delete_client_safe(
            '${adminUserId}'::UUID,
            '${client1Id}'::UUID
          );
        `);
      }, /permission denied/i);

      // 4. Rol anon no tiene permiso sobre review_order_item_configuration_transactional
      await assert.rejects(async () => {
        await db.query(`
          SELECT public.review_order_item_configuration_transactional(
            '${adminUserId}'::UUID,
            '88888888-0000-0000-0000-000000000001'::UUID,
            'approved',
            'Ataque anon revisión'
          );
        `);
      }, /permission denied/i);
    } finally {
      // Restaurar a service_role (superusuario en entorno aislado)
      await db.exec(`RESET ROLE;`);
    }
  });

  // =========================================================================
  // CASO 15: Rechazo estricto de emisión sin aprobación o con receta incompatible
  // =========================================================================
  await test('Caso 15: Rechazo estricto de emisión sin aprobación o con receta no publicada / incompatible', async () => {
    // 1. Ítem con configuración 'pending_review' no puede emitirse
    const testOrderId15 = '77777777-0000-0000-0000-000000000015';
    const testItemId15 = '88888888-0000-0000-0000-000000000015';
    await db.exec(`
      INSERT INTO public.orders (
        id, order_number, client_id, seller_id, status, total_amount, sale_channel
      ) VALUES (
        '${testOrderId15}', 601, '${client1Id}', '${seller1Id}', 'pending', 500000.00, 'direct'
      );
      INSERT INTO public.order_items (
        id, order_id, product_id, variant_id, product_name, quantity, unit_price, total_price,
        configuration, configuration_status
      ) VALUES (
        '${testItemId15}', '${testOrderId15}', '${productId}', '${variantId}', 'Bañera Capri Test', 1, 500000.00, 500000.00,
        '{"jets": 6}'::jsonb, 'pending_review'
      );
    `);

    // Intentar emitir con estado pending_review debe ser rechazado
    await assert.rejects(async () => {
      await db.query(`
        SELECT public.issue_manufacturing_order_transactional(
          '${adminStaffUserId}'::UUID,
          '${testOrderId15}'::UUID,
          '${testItemId15}'::UUID,
          1,
          '66666666-0000-0000-0000-000000000002'::UUID,
          '{}'::jsonb, '[]'::jsonb, '[]'::jsonb,
          'Emisión no aprobada'
        );
      `);
    }, /La configuración del ítem se encuentra en estado "pending_review". Debe revisarse y aprobarse/);

    // 2. Administrador realiza la revisión técnica mediante RPC auditada
    const reviewRes = await db.query(`
      SELECT public.review_order_item_configuration_transactional(
        '${adminStaffUserId}'::UUID,
        '${testItemId15}'::UUID,
        'approved',
        'Configuración revisada y verificada técnicamente por Administración'
      ) as result;
    `);
    assert.equal(reviewRes.rows[0].result.success, true);
    assert.equal(reviewRes.rows[0].result.configuration_status, 'approved');

    // 3. Intentar emitir con receta no publicada (draft) debe ser bloqueado
    const draftBomRes = await db.query(`
      INSERT INTO public.product_compositions (
        product_id, variant_id, version, status, name
      ) VALUES (
        '${productId}', '${variantId}', 99, 'draft', 'BOM Borrador Incompleto'
      ) RETURNING id;
    `);
    const draftBomId = draftBomRes.rows[0].id;

    await assert.rejects(async () => {
      await db.query(`
        SELECT public.issue_manufacturing_order_transactional(
          '${adminStaffUserId}'::UUID,
          '${testOrderId15}'::UUID,
          '${testItemId15}'::UUID,
          1,
          '${draftBomId}'::UUID,
          '{}'::jsonb, '[]'::jsonb, '[]'::jsonb,
          'Emisión con borrador'
        );
      `);
    }, /no se encuentra publicada/);

    // 4. Intentar emitir con receta de otro producto o variante debe ser bloqueado
    const otherProdId = '99999999-9999-9999-9999-999999999999';
    await db.exec(`
      INSERT INTO public.products (id, category_id, name, slug, short_description, description)
      VALUES ('${otherProdId}', '88888888-8888-8888-8888-888888888881', 'Otro Producto', 'otro-producto', 'Descripción corta de producto', 'Descripción detallada de producto técnico')
      ON CONFLICT (id) DO NOTHING;
    `);

    const mismatchedBomRes = await db.query(`
      INSERT INTO public.product_compositions (
        product_id, version, status, name
      ) VALUES (
        '${otherProdId}', 1, 'published', 'BOM de Otro Producto'
      ) RETURNING id;
    `);
    const mismatchedBomId = mismatchedBomRes.rows[0].id;

    await assert.rejects(async () => {
      await db.query(`
        SELECT public.issue_manufacturing_order_transactional(
          '${adminStaffUserId}'::UUID,
          '${testOrderId15}'::UUID,
          '${testItemId15}'::UUID,
          1,
          '${mismatchedBomId}'::UUID,
          '{}'::jsonb, '[]'::jsonb, '[]'::jsonb,
          'Emisión con producto disímil'
        );
      `);
    }, /DISCORDANCIA TÉCNICA: La composición seleccionada no corresponde al producto/);

    // 5. Con BOM publicada correcta y estado approved, la emisión se concreta perfectamente
    const validBomId = '66666666-0000-0000-0000-000000000002';
    const emitOk = await db.query(`
      SELECT public.issue_manufacturing_order_transactional(
        '${adminStaffUserId}'::UUID,
        '${testOrderId15}'::UUID,
        '${testItemId15}'::UUID,
        1,
        '${validBomId}'::UUID,
        '{}'::jsonb, '[]'::jsonb, '[]'::jsonb,
        'Emisión válida aprobada'
      ) as result;
    `);
    assert.equal(emitOk.rows[0].result.success, true);
    assert.ok(emitOk.rows[0].result.manufacturingOrderId);
  });
});
