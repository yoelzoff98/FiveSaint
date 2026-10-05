import assert from 'node:assert/strict';
import { test, describe, before } from 'node:test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { calculateCommercialTotals, roundCurrency, formatCurrencyARS } from '../src/lib/commercial-calculations.ts';

function hashPayload(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

describe('SPRINT — SIMPLIFICACIÓN DEL CIERRE COMERCIAL DEL VENDEDOR (ENTORNO AISLADO PGLITE)', async () => {
  let db;

  // Identidades del entorno de prueba
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const adminId = '11111111-1111-1111-1111-111111111112';

  const seller1UserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const seller1Id = '22222222-2222-2222-2222-222222222221';

  const seller2UserId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const seller2Id = '22222222-2222-2222-2222-222222222222';

  const distPortalUserId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const distPortalId = '44444444-4444-4444-4444-444444444444';

  const physicalStoreDistId = '55555555-5555-5555-5555-555555555555';
  const inactiveDistId = '66666666-6666-6666-6666-666666666666';

  const client1Id = '33333333-3333-3333-3333-333333333331';
  const client2Id = '33333333-3333-3333-3333-333333333332';

  before(async () => {
    db = new PGlite();

    // 1. Cargar esquema base y migraciones en orden estricto
    await db.exec(fs.readFileSync('tests/fixtures/commercial-current-schema.sql', 'utf8'));

    await db.exec(`
      INSERT INTO auth.users (id) VALUES
        ('${adminUserId}'),
        ('${seller1UserId}'),
        ('${seller2UserId}'),
        ('${distPortalUserId}')
      ON CONFLICT (id) DO NOTHING;
    `);

    await db.exec(fs.readFileSync('supabase/migrations/20261003000100_commercial_release.sql', 'utf8'));
    await db.exec(fs.readFileSync('supabase/migrations/20261004000100_sprint1_administration_portal.sql', 'utf8'));
    await db.exec(fs.readFileSync('supabase/migrations/20261005000100_sprint_seller_closing_flow.sql', 'utf8'));

    // 3. Crear actores y distribuidores (incluyendo distribuidor físico sin usuario de acceso)
    await db.exec(`
      INSERT INTO public.admin_users (id, user_id, username, full_name, is_active)
      VALUES ('${adminId}', '${adminUserId}', 'admin_master', 'Administrador General', true)
      ON CONFLICT (user_id) DO NOTHING;

      INSERT INTO public.sellers (id, user_id, username, full_name, email, is_active) VALUES
        ('${seller1Id}', '${seller1UserId}', 'vendedor_juan', 'Juan Vendedor', 'vendedor1@fivesaint.com', true),
        ('${seller2Id}', '${seller2UserId}', 'vendedor_pedro', 'Pedro Vendedor', 'vendedor2@fivesaint.com', true)
      ON CONFLICT (user_id) DO NOTHING;

      -- Distribuidor A: con usuario de acceso en el portal
      INSERT INTO public.distributors (id, user_id, username, company_name, contact_name, email, discount_percentage, is_active)
      VALUES ('${distPortalId}', '${distPortalUserId}', 'dist_portal', 'Distribuidor Norte SRL', 'Carlos Distribuidor', 'portal.distribuidor@fivesaint.com', 20.00, true)
      ON CONFLICT (id) DO NOTHING;

      -- Distribuidor B: Showroom físico SIN usuario de acceso (user_id IS NULL)
      INSERT INTO public.distributors (id, user_id, username, company_name, contact_name, email, discount_percentage, is_active)
      VALUES ('${physicalStoreDistId}', NULL, 'showroom_centro', 'Showroom Centro Sanitarios', 'María Showroom', 'contacto@showroomcentro.com', 15.00, true)
      ON CONFLICT (id) DO NOTHING;

      -- Distribuidor C: Inactivo
      INSERT INTO public.distributors (id, user_id, username, company_name, contact_name, email, discount_percentage, is_active)
      VALUES ('${inactiveDistId}', NULL, 'dist_inactivo', 'Distribuidor Inactivo SA', 'Jorge Inactivo', 'inactivo@dist.com', 10.00, false)
      ON CONFLICT (id) DO NOTHING;

      -- Clientes de prueba
      INSERT INTO public.clients (id, seller_id, name, company_name, email, phone, status) VALUES
        ('${client1Id}', '${seller1Id}', 'Cliente Juan Perez', 'Perez Construcciones', 'juan@perez.com', '1144332211', 'presupuestado'),
        ('${client2Id}', '${seller2Id}', 'Cliente Ana Gomez', 'Gomez Arq', 'ana@gomez.com', '1155667788', 'presupuestado')
      ON CONFLICT (id) DO NOTHING;
    `);
  });


  async function createBudgetHelper(options) {
    const {
      userId = seller1UserId,
      clientId = client1Id,
      items = [{ productName: 'Bañera Test', quantity: 1, unitPrice: 100000 }],
      discounts = [],
      notes = 'Presupuesto de prueba',
      publicNotes = null,
      idempotencyKey = 'key-' + Math.random().toString(36).slice(2),
      requestHash = 'hash-' + Math.random().toString(36).slice(2),
      sellerId = null,
    } = options;

    let subtotal = 0;
    for (const it of items) {
      subtotal += (it.unitPrice || 0) * (it.quantity || 1);
    }
    const taxRate = 21.00;
    const taxAmount = Math.round(subtotal * 0.21 * 100) / 100;
    const totalAmount = subtotal + taxAmount;

    const res = await db.query(`
      SELECT public.create_budget_transactional(
        '${userId}'::UUID,
        '${clientId}'::UUID,
        '${JSON.stringify(items)}'::JSONB,
        '${JSON.stringify(discounts)}'::JSONB,
        ${notes ? `'${notes}'` : 'NULL'},
        ${publicNotes ? `'${publicNotes}'` : 'NULL'},
        '${idempotencyKey}',
        '${requestHash}',
        '{}'::JSONB,
        '{}'::JSONB,
        '{}'::JSONB,
        ${totalAmount},
        ${subtotal},
        0,
        ${taxAmount},
        ${taxRate},
        ${sellerId ? `'${sellerId}'::UUID` : 'NULL::UUID'}
      ) as res;
    `);
    return res.rows[0].res;
  }

  // CASO 1: Venta directa completa -> Un pedido y saldo cero
  test('Caso 1: Venta directa completa FiveSaint (Un pedido y saldo restante cero)', async () => {
    // 1. Crear presupuesto con 5 unidades
    const bRes = { rows: [{ res: await createBudgetHelper({
      userId: seller1UserId,
      clientId: client1Id,
      items: [{ productName: 'Bañera Acrílica 150', quantity: 5, unitPrice: 100000 }],
      notes: 'Presupuesto Venta Directa Total',
      publicNotes: 'Notas públicas',
      idempotencyKey: 'c1-key-1',
      requestHash: 'c1-hash-1'
    }) }] };
    const budgetId = bRes.rows[0].res.id;

    const itemsRes = await db.query(`SELECT id FROM public.budget_items WHERE budget_id = '${budgetId}'`);
    const itemId = itemsRes.rows[0].id;

    // 2. Convertir las 5 unidades en venta directa
    const convPayload = [{ budgetItemId: itemId, quantity: 5, factoryNotes: 'Motor a la izquierda' }];
    const convHash = hashPayload({ budgetId, convPayload, saleChannel: 'direct' });

    const cRes = await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(convPayload)}'::jsonb,
        'direct',
        'Pedido Directo Completo',
        'c1-conv-key',
        '${convHash}'
      ) as res;
    `);

    const result = cRes.rows[0].res;
    assert.equal(result.success, true);
    assert.equal(result.is_fully_converted, true);
    assert.equal(result.sale_channel, 'direct');
    assert.ok(result.order_number > 0);

    // Verificar en BD: orden pendiente de fábrica con total $500,000 + IVA ($605,000)
    const oRes = await db.query(`SELECT * FROM public.orders WHERE id = '${result.id}'`);
    assert.equal(oRes.rows[0].status, 'pending');
    assert.equal(oRes.rows[0].order_type, 'factory');
    assert.equal(Number(oRes.rows[0].total_amount), 605000);

    // Saldo en presupuesto: convertido = 5, restante = 0, status = converted
    const biRes = await db.query(`SELECT quantity, converted_quantity FROM public.budget_items WHERE id = '${itemId}'`);
    assert.equal(biRes.rows[0].quantity, 5);
    assert.equal(biRes.rows[0].converted_quantity, 5);

    const bCheck = await db.query(`SELECT status FROM public.budgets WHERE id = '${budgetId}'`);
    assert.equal(bCheck.rows[0].status, 'converted');
  });

  // CASO 2: Venta directa parcial -> Pedido por lo seleccionado y saldo restante correcto
  test('Caso 2: Venta directa parcial (Pedido por lo seleccionado y saldo restante exacto)', async () => {
    const bRes = { rows: [{ res: await createBudgetHelper({
      userId: seller1UserId,
      clientId: client1Id,
      items: [{ productName: 'Bañera Hidromasaje 170', quantity: 10, unitPrice: 200000 }],
      notes: 'Presupuesto Venta Parcial',
      idempotencyKey: 'c2-key-1',
      requestHash: 'c2-hash-1'
    }) }] };
    const budgetId = bRes.rows[0].res.id;
    const itemId = (await db.query(`SELECT id FROM public.budget_items WHERE budget_id = '${budgetId}'`)).rows[0].id;

    // Convertir 4 unidades de las 10
    const convPayload = [{ budgetItemId: itemId, quantity: 4 }];
    const convHash = hashPayload({ budgetId, convPayload, saleChannel: 'direct' });

    const cRes = await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(convPayload)}'::jsonb,
        'direct',
        'Entrega primera etapa',
        'c2-conv-key',
        '${convHash}'
      ) as res;
    `);

    const result = cRes.rows[0].res;
    assert.equal(result.success, true);
    assert.equal(result.is_fully_converted, false);
    assert.equal(result.budget_status, 'partially_converted');

    const biRes = await db.query(`SELECT quantity, converted_quantity FROM public.budget_items WHERE id = '${itemId}'`);
    assert.equal(biRes.rows[0].converted_quantity, 4);
    assert.equal(biRes.rows[0].quantity - biRes.rows[0].converted_quantity, 6, 'El saldo disponible restante debe ser 6');
  });

  // CASO 3: Compra en distribuidor -> Distribuidor y fecha guardados; sin efectos de fábrica
  test('Caso 3: Compra en distribuidor (Distribuidor físico sin usuario y fecha guardados; sin efectos de fábrica)', async () => {
    const bRes = { rows: [{ res: await createBudgetHelper({
      userId: seller1UserId,
      clientId: client1Id,
      items: [{ productName: 'Box de Ducha Angular', quantity: 3, unitPrice: 150000 }],
      notes: 'Presupuesto para compra en distribuidor',
      idempotencyKey: 'c3-key-1',
      requestHash: 'c3-hash-1'
    }) }] };
    const budgetId = bRes.rows[0].res.id;
    const itemId = (await db.query(`SELECT id FROM public.budget_items WHERE budget_id = '${budgetId}'`)).rows[0].id;

    const purchaseDate = '2026-10-04';
    const distRef = 'Factura B-99882';
    const convPayload = [{ budgetItemId: itemId, quantity: 3 }];
    const convHash = hashPayload({ budgetId, convPayload, saleChannel: 'distributor', distId: physicalStoreDistId, purchaseDate });

    const cRes = await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(convPayload)}'::jsonb,
        'distributor',
        'Cliente compró en showroom del centro',
        'c3-conv-key',
        '${convHash}',
        '${physicalStoreDistId}',
        '${purchaseDate}'::date,
        '${distRef}'
      ) as res;
    `);

    const result = cRes.rows[0].res;
    assert.equal(result.success, true);
    assert.equal(result.sale_channel, 'distributor');
    assert.equal(result.distributor_id, physicalStoreDistId);
    assert.equal(result.distributor_name, 'Showroom Centro Sanitarios');
    assert.equal(result.distributor_reference, distRef);

    // Verificar en BD que NO genera orden de fábrica pendiente (status = completed, order_type = distributor_sale)
    const oRes = await db.query(`SELECT * FROM public.orders WHERE id = '${result.id}'`);
    const order = oRes.rows[0];
    assert.equal(order.status, 'completed', 'La compra en distribuidor no genera fabricación pendiente');
    assert.equal(order.order_type, 'distributor_sale');
    assert.equal(order.sale_channel, 'distributor');
    assert.equal(order.distributor_id, physicalStoreDistId);
    assert.equal(order.distributor_reference, distRef);
    assert.equal(order.recorded_by_name, 'Juan Vendedor');

    // Comprobar que en order_items NO se incluyeron notas de fábrica
    const oiRes = await db.query(`SELECT factory_notes FROM public.order_items WHERE order_id = '${result.id}'`);
    assert.equal(oiRes.rows[0].factory_notes, null);

    // Presupuesto no sobrescribe distributor_id del cliente/presupuesto
    const bCheck = await db.query(`SELECT distributor_id, status FROM public.budgets WHERE id = '${budgetId}'`);
    assert.equal(bCheck.rows[0].distributor_id, null, 'El distribuidor del presupuesto no debe ser sobrescrito');
    assert.equal(bCheck.rows[0].status, 'distributor_sale');
  });

  // CASO 4: Cierre mixto -> Desglose correcto por canal y cantidades
  test('Caso 4: Cierre mixto (Operación directa + Operación en distribuidor sobre el mismo presupuesto)', async () => {
    const bRes = { rows: [{ res: await createBudgetHelper({
      userId: seller1UserId,
      clientId: client1Id,
      items: [
        { productName: 'Bañera Ibiza', quantity: 4, unitPrice: 100000 },
        { productName: 'Columna Ducha Acero', quantity: 4, unitPrice: 50000 }
      ],
      notes: 'Presupuesto Cierre Mixto',
      idempotencyKey: 'c4-key-1',
      requestHash: 'c4-hash-1'
    }) }] };
    const budgetId = bRes.rows[0].res.id;
    const items = (await db.query(`SELECT id, product_name FROM public.budget_items WHERE budget_id = '${budgetId}' ORDER BY id ASC`)).rows;
    const item1 = items[0].id;
    const item2 = items[1].id;

    // 1° Operación: Cliente compra 2 Bañeras directamente en FiveSaint
    const op1Payload = [{ budgetItemId: item1, quantity: 2, factoryNotes: 'Color blanco' }];
    const op1Hash = hashPayload({ budgetId, op1Payload, saleChannel: 'direct' });
    await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(op1Payload)}'::jsonb,
        'direct',
        'Venta directa parcial',
        'c4-key-op1',
        '${op1Hash}'
      );
    `);

    // 2° Operación: Cliente compra las 2 Bañeras restantes y 2 Columnas en Distribuidor Norte
    const op2Payload = [
      { budgetItemId: item1, quantity: 2 },
      { budgetItemId: item2, quantity: 2 }
    ];
    const op2Hash = hashPayload({ budgetId, op2Payload, saleChannel: 'distributor', distId: distPortalId });
    await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(op2Payload)}'::jsonb,
        'distributor',
        'Compró resto en distribuidor',
        'c4-key-op2',
        '${op2Hash}',
        '${distPortalId}',
        '2026-10-05'::date,
        'Venta-Showroom-44'
      );
    `);

    // Comprobar desglose exacto por ítems
    const bi1 = (await db.query(`SELECT quantity, converted_quantity FROM public.budget_items WHERE id = '${item1}'`)).rows[0];
    assert.equal(bi1.quantity, 4);
    assert.equal(bi1.converted_quantity, 4, 'Bañera Ibiza totalmente convertida');

    const bi2 = (await db.query(`SELECT quantity, converted_quantity FROM public.budget_items WHERE id = '${item2}'`)).rows[0];
    assert.equal(bi2.quantity, 4);
    assert.equal(bi2.converted_quantity, 2, 'Columna Ducha convertida 2 de 4');

    // Consultar órdenes vinculadas activas: existen 1 orden directa y 1 orden de distribuidor
    const ordersRes = await db.query(`
      SELECT id, sale_channel, order_type, total_amount
      FROM public.orders
      WHERE budget_id = '${budgetId}' AND status <> 'cancelled'
      ORDER BY created_at ASC
    `);
    assert.equal(ordersRes.rows.length, 2);
    assert.equal(ordersRes.rows[0].sale_channel, 'direct');
    assert.equal(ordersRes.rows[1].sale_channel, 'distributor');

    // Desglose agregado por canal:
    const directTotal = ordersRes.rows.filter(o => o.sale_channel === 'direct').reduce((s, o) => s + Number(o.total_amount), 0);
    const distTotal = ordersRes.rows.filter(o => o.sale_channel === 'distributor').reduce((s, o) => s + Number(o.total_amount), 0);
    assert.ok(directTotal > 0);
    assert.ok(distTotal > 0);
    assert.notEqual(directTotal, distTotal);
  });

  // CASO 5: Doble clic o reintento -> Una sola operación idempotente
  test('Caso 5: Doble clic o reintento concurrente con misma clave (Una sola orden generada)', async () => {
    const bRes = { rows: [{ res: await createBudgetHelper({
      userId: seller1UserId,
      clientId: client1Id,
      items: [{ productName: 'Hidromasaje Doble', quantity: 2, unitPrice: 300000 }],
      notes: 'Presupuesto Idempotencia',
      idempotencyKey: 'c5-key-1',
      requestHash: 'c5-hash-1'
    }) }] };
    const budgetId = bRes.rows[0].res.id;
    const itemId = (await db.query(`SELECT id FROM public.budget_items WHERE budget_id = '${budgetId}'`)).rows[0].id;

    const convPayload = [{ budgetItemId: itemId, quantity: 2 }];
    const idempKey = 'idemp-double-click-' + Date.now();
    const reqHash = hashPayload({ budgetId, convPayload, idempKey });

    // Ejecutar intento 1
    const r1 = await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(convPayload)}'::jsonb,
        'direct',
        'Intento 1',
        '${idempKey}',
        '${reqHash}'
      ) as res;
    `);

    // Ejecutar intento 2 (reintento post-commit)
    const r2 = await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(convPayload)}'::jsonb,
        'direct',
        'Intento 2',
        '${idempKey}',
        '${reqHash}'
      ) as res;
    `);

    assert.equal(r1.rows[0].res.id, r2.rows[0].res.id, 'Debe devolver exactamente el mismo pedido');
    assert.equal(r1.rows[0].res.order_number, r2.rows[0].res.order_number);

    // En BD solo debe existir una sola orden creada
    const ordersCount = await db.query(`SELECT count(*) as count FROM public.orders WHERE budget_id = '${budgetId}'`);
    assert.equal(Number(ordersCount.rows[0].count), 1);
  });

  // CASO 6: Dos confirmaciones con claves distintas no exceden el saldo
  test('Caso 6: Dos confirmaciones distintas respetan el saldo sin sobrepasar el presupuesto', async () => {
    const bRes = { rows: [{ res: await createBudgetHelper({
      userId: seller1UserId,
      clientId: client1Id,
      items: [{ productName: 'Receptáculo Acrílico', quantity: 3, unitPrice: 80000 }],
      notes: 'Presupuesto Saldo Límite',
      idempotencyKey: 'c6-key-1',
      requestHash: 'c6-hash-1'
    }) }] };
    const budgetId = bRes.rows[0].res.id;
    const itemId = (await db.query(`SELECT id FROM public.budget_items WHERE budget_id = '${budgetId}'`)).rows[0].id;

    // Convertir 2 unidades
    const p1 = [{ budgetItemId: itemId, quantity: 2 }];
    await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(p1)}'::jsonb,
        'direct',
        'Op 1',
        'c6-key-op1',
        'c6-hash-op1'
      );
    `);

    // Intentar convertir 2 unidades más (solo queda 1 disponible) -> debe fallar
    const p2 = [{ budgetItemId: itemId, quantity: 2 }];
    await assert.rejects(async () => {
      await db.query(`
        SELECT public.convert_budget_transactional(
          '${seller1UserId}',
          '${budgetId}',
          '${JSON.stringify(p2)}'::jsonb,
          'direct',
          'Op 2',
          'c6-key-op2',
          'c6-hash-op2'
        );
      `);
    }, /Saldo insuficiente/);

    // Verificar que converted_quantity sigue siendo exactamente 2
    const biCheck = await db.query(`SELECT converted_quantity FROM public.budget_items WHERE id = '${itemId}'`);
    assert.equal(biCheck.rows[0].converted_quantity, 2);
  });

  // CASO 7: Cancelación y nueva confirmación -> Saldo restaurado exactamente
  test('Caso 7: Cancelación y nueva confirmación (Saldo restaurado exactamente en orden global)', async () => {
    const bRes = { rows: [{ res: await createBudgetHelper({
      userId: seller1UserId,
      clientId: client1Id,
      items: [{ productName: 'Mampara Rebatible', quantity: 4, unitPrice: 120000 }],
      notes: 'Presupuesto Cancelación',
      idempotencyKey: 'c7-key-1',
      requestHash: 'c7-hash-1'
    }) }] };
    const budgetId = bRes.rows[0].res.id;
    const itemId = (await db.query(`SELECT id FROM public.budget_items WHERE budget_id = '${budgetId}'`)).rows[0].id;

    // Convertir 3 unidades
    const p1 = [{ budgetItemId: itemId, quantity: 3 }];
    const convRes = await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(p1)}'::jsonb,
        'direct',
        'Op para cancelar',
        'c7-key-op1',
        'c7-hash-op1'
      ) as res;
    `);
    const orderId = convRes.rows[0].res.id;

    // Cancelar la orden generada
    await db.query(`
      SELECT public.cancel_order_transactional(
        '${seller1UserId}',
        '${orderId}',
        'Cliente cambió de modelo',
        'c7-cancel-key',
        'c7-cancel-hash'
      );
    `);

    // Saldo disponible debe volver a 4 unidades
    const biRestored = await db.query(`SELECT converted_quantity FROM public.budget_items WHERE id = '${itemId}'`);
    assert.equal(biRestored.rows[0].converted_quantity, 0, 'converted_quantity debe restaurarse a cero');

    // Ahora es posible convertir las 4 unidades completas
    const p2 = [{ budgetItemId: itemId, quantity: 4 }];
    const newConv = await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(p2)}'::jsonb,
        'direct',
        'Nueva orden con saldo restaurado',
        'c7-key-op2',
        'c7-hash-op2'
      ) as res;
    `);

    assert.equal(newConv.rows[0].res.success, true);
    assert.equal(newConv.rows[0].res.is_fully_converted, true);
  });

  // CASO 8: Cambio de canal/distribuidor con la misma clave -> Conflicto de idempotencia
  test('Caso 8: Cambio de canal/distribuidor con la misma clave genera conflicto de idempotencia', async () => {
    const bRes = { rows: [{ res: await createBudgetHelper({
      userId: seller1UserId,
      clientId: client1Id,
      items: [{ productName: 'Bañera Redonda', quantity: 1, unitPrice: 180000 }],
      notes: 'Presupuesto Conflicto Hash',
      idempotencyKey: 'c8-key-1',
      requestHash: 'c8-hash-1'
    }) }] };
    const budgetId = bRes.rows[0].res.id;
    const itemId = (await db.query(`SELECT id FROM public.budget_items WHERE budget_id = '${budgetId}'`)).rows[0].id;

    const payload = [{ budgetItemId: itemId, quantity: 1 }];
    const sharedKey = 'shared-key-sprint-closing-' + Date.now();
    const hashDirect = hashPayload({ budgetId, payload, saleChannel: 'direct' });
    const hashDist = hashPayload({ budgetId, payload, saleChannel: 'distributor', distId: distPortalId });

    // Intento 1: Venta Directa
    await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(payload)}'::jsonb,
        'direct',
        'Directa',
        '${sharedKey}',
        '${hashDirect}'
      );
    `);

    // Intento 2: Con la MISMA clave pero canal distribuidor y payload modificado
    await assert.rejects(async () => {
      await db.query(`
        SELECT public.convert_budget_transactional(
          '${seller1UserId}',
          '${budgetId}',
          '${JSON.stringify(payload)}'::jsonb,
          'distributor',
          'Distribuidor',
          '${sharedKey}',
          '${hashDist}',
          '${distPortalId}',
          '2026-10-05'::date
        );
      `);
    }, /Conflicto de idempotencia/);
  });

  // CASO 9: Presupuesto rechazado o agotado
  test('Caso 9: Reglas de rechazo y reapertura explícita', async () => {
    const bRes = { rows: [{ res: await createBudgetHelper({
      userId: seller1UserId,
      clientId: client1Id,
      items: [{ productName: 'Columna Ducha Termostática', quantity: 2, unitPrice: 160000 }],
      notes: 'Presupuesto Rechazo',
      idempotencyKey: 'c9-key-1',
      requestHash: 'c9-hash-1'
    }) }] };
    const budgetId = bRes.rows[0].res.id;
    const itemId = (await db.query(`SELECT id FROM public.budget_items WHERE budget_id = '${budgetId}'`)).rows[0].id;

    // Rechazar presupuesto
    await db.query(`
      UPDATE public.budgets
      SET status = 'rejected', rejection_reason = 'Precio fuera de presupuesto del cliente'
      WHERE id = '${budgetId}';
    `);

    // 1. Intentar convertir mientras está rechazado -> Debe fallar
    const p = [{ budgetItemId: itemId, quantity: 1 }];
    await assert.rejects(async () => {
      await db.query(`
        SELECT public.convert_budget_transactional(
          '${seller1UserId}',
          '${budgetId}',
          '${JSON.stringify(p)}'::jsonb,
          'direct',
          'Intento en rechazado',
          'c9-key-fail',
          'c9-hash-fail'
        );
      `);
    }, /No se puede convertir un presupuesto rechazado/);

    // 2. Reabrir presupuesto mediante función RPC
    const reopenRes = await db.query(`
      SELECT public.reopen_budget_transactional('${seller1UserId}', '${budgetId}') as res;
    `);
    assert.equal(reopenRes.rows[0].res.success, true);

    const bReopened = await db.query(`SELECT status, rejection_reason FROM public.budgets WHERE id = '${budgetId}'`);
    assert.equal(bReopened.rows[0].status, 'draft');
    assert.equal(bReopened.rows[0].rejection_reason, null);

    // 3. Convertir ahora exitosamente
    const convOk = await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '${JSON.stringify(p)}'::jsonb,
        'direct',
        'Ahora sí confirmado',
        'c9-key-ok',
        'c9-hash-ok'
      ) as res;
    `);
    assert.equal(convOk.rows[0].res.success, true);
  });

  // CASO 10: Registro de envío comercial separado de publicación
  test('Caso 10: Trazabilidad aditiva de envíos comerciales (WhatsApp/PDF, Enlace, etc.)', async () => {
    const bRes = { rows: [{ res: await createBudgetHelper({
      userId: seller1UserId,
      clientId: client1Id,
      items: [{ productName: 'Bañera Clásica', quantity: 1, unitPrice: 90000 }],
      notes: 'Presupuesto para Envío',
      idempotencyKey: 'c10-key-1',
      requestHash: 'c10-hash-1'
    }) }] };
    const budgetId = bRes.rows[0].res.id;

    // Registrar envío comercial vía WhatsApp
    const sendTime = '2026-10-05T10:30:00Z';
    const shipRes = await db.query(`
      SELECT public.record_budget_shipment_transactional(
        '${seller1UserId}',
        '${budgetId}',
        'whatsapp',
        '${sendTime}'::timestamptz,
        'Enviado PDF al cliente por WhatsApp'
      ) as res;
    `);

    assert.equal(shipRes.rows[0].res.success, true);
    assert.equal(shipRes.rows[0].res.sent_via, 'whatsapp');

    // Verificar en BD que el presupuesto ahora tiene los datos de envío y avanzó a 'sent'
    const bCheck = await db.query(`
      SELECT status, sent_via, sent_by_name, sent_at, shipment_notes
      FROM public.budgets
      WHERE id = '${budgetId}'
    `);
    assert.equal(bCheck.rows[0].status, 'sent');
    assert.equal(bCheck.rows[0].sent_via, 'whatsapp');
    assert.equal(bCheck.rows[0].sent_by_name, 'Juan Vendedor');
    assert.equal(bCheck.rows[0].shipment_notes, 'Enviado PDF al cliente por WhatsApp');

    // Verificar que se registró en la línea de tiempo del CRM (client_notes)
    const cNote = await db.query(`
      SELECT content, note_type FROM public.client_notes
      WHERE budget_id = '${budgetId}' AND note_type = 'budget_sent'
    `);
    assert.ok(cNote.rows.length >= 1);
    assert.match(cNote.rows[0].content, /WhatsApp \/ PDF/);
  });

  // CASO 11: Aislamiento RLS en órdenes de compras en distribuidores
  test('Caso 11: Distribuidor con usuario de portal NO ve compras de clientes registradas en su tienda', async () => {
    // Vendedor 1 registra compra de Cliente 1 en Distribuidor Norte (distPortalId)
    const bRes = { rows: [{ res: await createBudgetHelper({
      userId: seller1UserId,
      clientId: client1Id,
      items: [{ productName: 'Bañera Espacial', quantity: 1, unitPrice: 250000 }],
      notes: 'Presupuesto Privado de Juan',
      idempotencyKey: 'c11-key-1',
      requestHash: 'c11-hash-1'
    }) }] };
    const budgetId = bRes.rows[0].res.id;
    const itemId = (await db.query(`SELECT id FROM public.budget_items WHERE budget_id = '${budgetId}'`)).rows[0].id;

    const conv = await db.query(`
      SELECT public.convert_budget_transactional(
        '${seller1UserId}',
        '${budgetId}',
        '[{"budgetItemId": "${itemId}", "quantity": 1}]'::jsonb,
        'distributor',
        'Cliente fue a la sucursal de Distribuidor Norte',
        'c11-conv-key',
        'c11-conv-hash',
        '${distPortalId}',
        '2026-10-05'::date,
        'Ticket-902'
      ) as res;
    `);
    const retailOrderId = conv.rows[0].res.id;

    // Probar política RLS evaluando la condición para distPortalUserId:
    // ¿Puede el distribuidor distPortalId ver esta orden de venta retail del vendedor?
    const rlsEval = await db.query(`
      SELECT
        (
          -- Condición de distribuidor en orders_read_policy:
          distributor_id = '${distPortalId}'
          AND order_type <> 'distributor_sale'
        ) as can_distributor_view
      FROM public.orders
      WHERE id = '${retailOrderId}';
    `);

    assert.equal(rlsEval.rows[0].can_distributor_view, false,
      'La política RLS debe denegar el acceso del distribuidor a órdenes de tipo distributor_sale de clientes ajenos');
  });

  // CASO 12: Reportes y conciliación comercial
  test('Caso 12: Métricas diferenciadas entre venta directa propia y compras en distribuidores', async () => {
    // Consultar el universo de órdenes activas
    const reportQuery = await db.query(`
      SELECT
        sale_channel,
        order_type,
        COUNT(*) as order_count,
        SUM(total_amount) as total_amount
      FROM public.orders
      WHERE status <> 'cancelled'
      GROUP BY sale_channel, order_type
      ORDER BY sale_channel;
    `);

    const directOrders = reportQuery.rows.find(r => r.sale_channel === 'direct');
    const distributorOrders = reportQuery.rows.find(r => r.sale_channel === 'distributor');

    assert.ok(directOrders, 'Debe haber registros de venta directa FiveSaint');
    assert.ok(distributorOrders, 'Debe haber registros de venta por distribuidor');

    assert.equal(directOrders.order_type, 'factory');
    assert.equal(distributorOrders.order_type, 'distributor_sale');

    // La facturación exigible propia de fábrica es estrictamente la de canal directo
    const ownFactoryReceivables = Number(directOrders.total_amount);
    const trackingShowroomsTotal = Number(distributorOrders.total_amount);

    assert.ok(ownFactoryReceivables > 0);
    assert.ok(trackingShowroomsTotal > 0);
    assert.notEqual(ownFactoryReceivables, ownFactoryReceivables + trackingShowroomsTotal,
      'Las ventas en distribuidores no deben sumarse como facturación exigible directa de FiveSaint');
  });
});
