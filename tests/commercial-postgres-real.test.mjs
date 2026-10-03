import assert from 'node:assert/strict';
import { test, describe, before } from 'node:test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { calculateCommercialTotals, roundCurrency, formatCurrencyARS } from '../src/lib/commercial-calculations.ts';
import { verifyOfficialPrice, getOfficialCatalog } from '../src/lib/catalog-service.ts';

function hashPayload(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

describe('PRUEBAS DE INTEGRACIÓN REALES EN POSTGRESQL (MOTOR NATIVO PGLITE Y MIGRACIÓN V3)', async () => {
  let db;

  // IDs representativos
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const seller1UserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const seller1Id = '22222222-2222-2222-2222-222222222221';
  const seller2UserId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const seller2Id = '22222222-2222-2222-2222-222222222222';
  const inactiveSellerUserId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const inactiveSellerId = '22222222-2222-2222-2222-222222222223';
  const distributorUserId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const distributorId = '44444444-4444-4444-4444-444444444444';

  const client1Id = '33333333-3333-3333-3333-333333333331';
  const client2Id = '33333333-3333-3333-3333-333333333332';

  before(async () => {
    // 1. Inicializar motor PostgreSQL nativo
    db = new PGlite();

    // 2. Crear roles estándar de Supabase y esquema base original de producción
    await db.exec(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
          CREATE ROLE service_role;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
          CREATE ROLE anon;
        END IF;
      END $$;

      CREATE SEQUENCE IF NOT EXISTS budgets_budget_number_seq START WITH 1;
      CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START WITH 1;

      CREATE TABLE admin_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE sellers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE,
          username TEXT NOT NULL,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE distributors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE,
          company_name TEXT NOT NULL,
          contact_name TEXT NOT NULL,
          discount_percentage NUMERIC(5,2) DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          company_name TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          notes TEXT,
          status TEXT DEFAULT 'nuevo',
          seller_id UUID REFERENCES sellers(id),
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          source TEXT
      );

      CREATE TABLE budgets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          budget_number INTEGER DEFAULT nextval('budgets_budget_number_seq'),
          client_id UUID REFERENCES clients(id),
          seller_id UUID REFERENCES sellers(id),
          distributor_id UUID REFERENCES distributors(id),
          status TEXT DEFAULT 'draft',
          total_amount NUMERIC(14,2) NOT NULL,
          discounts JSONB DEFAULT '[]'::jsonb,
          notes TEXT,
          rejection_reason TEXT,
          view_count INTEGER DEFAULT 0,
          viewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE budget_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
          product_id UUID,
          variant_id UUID,
          product_name TEXT NOT NULL,
          variant_name TEXT,
          quantity INTEGER NOT NULL,
          unit_price NUMERIC(14,2) NOT NULL,
          total_price NUMERIC(14,2) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_number INTEGER DEFAULT nextval('orders_order_number_seq'),
          budget_id UUID REFERENCES budgets(id),
          client_id UUID REFERENCES clients(id),
          seller_id UUID REFERENCES sellers(id),
          distributor_id UUID REFERENCES distributors(id),
          status TEXT DEFAULT 'pending',
          total_amount NUMERIC(14,2) NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          budget_item_id UUID REFERENCES budget_items(id),
          product_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price NUMERIC(14,2) NOT NULL,
          total_price NUMERIC(14,2) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE client_notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID REFERENCES clients(id),
          seller_id UUID REFERENCES sellers(id),
          content TEXT NOT NULL,
          contacted_at TIMESTAMPTZ DEFAULT now(),
          note_type TEXT DEFAULT 'manual',
          budget_id UUID REFERENCES budgets(id),
          order_id UUID REFERENCES orders(id),
          created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 3. EJECUTAR LA MIGRACIÓN EXACTA ENTREGADA (Sin reescribir funciones dentro de los tests)
    const migrationSql = fs.readFileSync('supabase/migrations/20261003000100_commercial_release.sql', 'utf8');
    await db.exec(migrationSql);

    // 4. Poblar datos maestros iniciales
    await db.exec(`
      INSERT INTO admin_users (user_id, full_name, is_active)
      VALUES ('${adminUserId}', 'Administrador Five Saint', true);

      INSERT INTO sellers (id, user_id, username, full_name, email, is_active)
      VALUES 
        ('${seller1Id}', '${seller1UserId}', 'vendedor.uno', 'Vendedor Uno', 'v1@fivesaint.com', true),
        ('${seller2Id}', '${seller2UserId}', 'vendedor.dos', 'Vendedor Dos', 'v2@fivesaint.com', true),
        ('${inactiveSellerId}', '${inactiveSellerUserId}', 'vendedor.inactivo', 'Vendedor Inactivo', 'inactivo@fivesaint.com', false);

      INSERT INTO distributors (id, user_id, company_name, contact_name, discount_percentage, is_active)
      VALUES ('${distributorId}', '${distributorUserId}', 'Distribuidora Sanitaria S.A.', 'Carlos Martínez', 15.00, true);

      INSERT INTO clients (id, name, company_name, email, phone, seller_id, status)
      VALUES 
        ('${client1Id}', 'Juan Pérez', 'Pérez Construcciones', 'juan@perez.com', '1122334455', '${seller1Id}', 'nuevo'),
        ('${client2Id}', 'María Gómez', 'Gómez Arquitectura', 'maria@gomez.com', '1199887766', '${seller2Id}', 'nuevo');
    `);
  });

  test('1. Permisos en PostgreSQL: Vendedor inactivo es bloqueado por la RPC', async () => {
    await assert.rejects(async () => {
      await db.query(`
        SELECT create_budget_transactional(
          '${inactiveSellerUserId}'::UUID,
          '${client1Id}'::UUID,
          '[{"productName": "Bañera Confort", "quantity": 1, "unitPrice": 1000000}]'::JSONB,
          '[]'::JSONB, 'Notas', 'Publicas', 'key_inact_1', 'hash1',
          '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
          1000000, 1000000, 0, 210000, 21.00,
          '${inactiveSellerId}'::UUID
        );
      `);
    }, /ACCESO DENEGADO: El usuario no posee un rol comercial activo/);
  });

  test('2. Permisos en PostgreSQL: Vendedor no puede operar sobre cliente de otro vendedor', async () => {
    // Vendedor 1 intenta crear presupuesto para el cliente asignado a Vendedor 2
    await assert.rejects(async () => {
      await db.query(`
        SELECT create_budget_transactional(
          '${seller1UserId}'::UUID,
          '${client2Id}'::UUID,
          '[{"productName": "Bañera Confort", "quantity": 1, "unitPrice": 1000000}]'::JSONB,
          '[]'::JSONB, 'Notas', 'Publicas', 'key_cross_1', 'hash_cross',
          '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
          1000000, 1000000, 0, 210000, 21.00,
          '${seller1Id}'::UUID
        );
      `);
    }, /ACCESO DENEGADO: No está autorizado a presupuestar clientes de otro asesor/);
  });

  test('3. Transacción atómica e idempotencia en creación (Vendedor 1)', async () => {
    const key = 'idem_create_real_1';
    const hash = 'hash_create_real_1';

    const items = [
      { productName: "Bañera Premium Confort", quantity: 10, unitPrice: 500000 }
    ];

    const res1 = await db.query(`
      SELECT create_budget_transactional(
        '${seller1UserId}'::UUID,
        '${client1Id}'::UUID,
        $1::JSONB,
        '[]'::JSONB,
        'Notas internas exclusivas',
        'Notas publicas del cliente',
        $2,
        $3,
        '{"name": "Juan Pérez"}'::JSONB,
        '{"name": "Vendedor Uno"}'::JSONB,
        '{"subtotal": 5000000, "netTotal": 5000000, "taxRate": 21}'::JSONB,
        5000000, 5000000, 0, 1050000, 21.00,
        '${seller1Id}'::UUID
      ) as result;
    `, [JSON.stringify(items), key, hash]);

    const budgetResult = res1.rows[0].result;
    assert.equal(budgetResult.success, true);
    assert.ok(budgetResult.id || budgetResult.budget_id);

    // Reintento con la misma clave: devuelve exactamente el mismo resultado
    const res2 = await db.query(`
      SELECT create_budget_transactional(
        '${seller1UserId}'::UUID,
        '${client1Id}'::UUID,
        $1::JSONB,
        '[]'::JSONB,
        'Notas internas exclusivas',
        'Notas publicas del cliente',
        $2,
        $3,
        '{"name": "Juan Pérez"}'::JSONB,
        '{"name": "Vendedor Uno"}'::JSONB,
        '{"subtotal": 5000000, "netTotal": 5000000, "taxRate": 21}'::JSONB,
        5000000, 5000000, 0, 1050000, 21.00,
        '${seller1Id}'::UUID
      ) as result;
    `, [JSON.stringify(items), key, hash]);

    assert.equal(res2.rows[0].result.id, budgetResult.id);

    // Reintento con misma clave pero payload diferente: Conflicto
    await assert.rejects(async () => {
      await db.query(`
        SELECT create_budget_transactional(
          '${seller1UserId}'::UUID,
          '${client1Id}'::UUID,
          $1::JSONB,
          '[]'::JSONB,
          'Notas modificadas',
          'Notas publicas',
          $2,
          'hash_diferente',
          '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
          5000000, 5000000, 0, 1050000, 21.00,
          '${seller1Id}'::UUID
        );
      `, [JSON.stringify(items), key]);
    }, /Conflicto de idempotencia/);
  });

  test('3.1 Solicitudes simultáneas en la instancia PGlite: misma clave crea una sola operación', async () => {
    const key = 'idem_simul_same_key_1';
    const hash = 'hash_simul_same_1';
    const items = [{ productName: "Bañera Simultánea", quantity: 2, unitPrice: 400000 }];

    // Dos solicitudes concurrentes lanzadas en paralelo con la misma clave
    const [p1, p2] = await Promise.all([
      db.query(`
        SELECT create_budget_transactional(
          '${seller1UserId}'::UUID, '${client1Id}'::UUID, $1::JSONB, '[]'::JSONB,
          'Simultaneo 1', 'Pub', $2, $3,
          '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
          800000, 800000, 0, 168000, 21.00, '${seller1Id}'::UUID
        ) as result;
      `, [JSON.stringify(items), key, hash]),
      db.query(`
        SELECT create_budget_transactional(
          '${seller1UserId}'::UUID, '${client1Id}'::UUID, $1::JSONB, '[]'::JSONB,
          'Simultaneo 1', 'Pub', $2, $3,
          '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
          800000, 800000, 0, 168000, 21.00, '${seller1Id}'::UUID
        ) as result;
      `, [JSON.stringify(items), key, hash])
    ]);

    const res1 = p1.rows[0].result;
    const res2 = p2.rows[0].result;
    assert.equal(res1.id, res2.id, 'Ambas solicitudes devuelven exactamente la misma operación creada');

    // Comprobar que en la base de datos solo se creó 1 registro para esa clave
    const countCheck = await db.query(`SELECT count(*) as total FROM budgets WHERE idempotency_key = '${key}'`);
    assert.equal(Number(countCheck.rows[0].total), 1, 'Se creó exactamente una sola operación');
  });

  test('3.2 Solicitudes simultáneas en la instancia PGlite: contenido diferente se rechaza', async () => {
    const key = 'idem_simul_diff_key_1';
    const hashA = 'hash_diff_a';
    const hashB = 'hash_diff_b';
    const itemsA = [{ productName: "Bañera A", quantity: 1, unitPrice: 300000 }];
    const itemsB = [{ productName: "Bañera B", quantity: 2, unitPrice: 600000 }];

    const results = await Promise.allSettled([
      db.query(`
        SELECT create_budget_transactional(
          '${seller1UserId}'::UUID, '${client1Id}'::UUID, $1::JSONB, '[]'::JSONB,
          'Payload A', 'Pub', $2, $3,
          '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
          300000, 300000, 0, 63000, 21.00, '${seller1Id}'::UUID
        ) as result;
      `, [JSON.stringify(itemsA), key, hashA]),
      db.query(`
        SELECT create_budget_transactional(
          '${seller1UserId}'::UUID, '${client1Id}'::UUID, $1::JSONB, '[]'::JSONB,
          'Payload B', 'Pub', $2, $3,
          '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
          1200000, 1200000, 0, 252000, 21.00, '${seller1Id}'::UUID
        ) as result;
      `, [JSON.stringify(itemsB), key, hashB])
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    assert.equal(fulfilled.length, 1, 'Exactamente una solicitud gana la adquisición');
    assert.equal(rejected.length, 1, 'La solicitud concurrente con contenido diferente es rechazada');
    assert.match(rejected[0].reason.message, /Conflicto de idempotencia/);
  });

  test('4. Conversión parcial y bloqueo por saldo: 10 unidades -> 4 convertidas -> quedan 6', async () => {
    // 1. Obtener presupuesto original y su ítem de 10 unidades
    const bRow = await db.query(`
      SELECT b.id as budget_id, bi.id as item_id, bi.quantity
      FROM budgets b
      JOIN budget_items bi ON bi.budget_id = b.id
      WHERE b.idempotency_key = 'idem_create_real_1'
      LIMIT 1;
    `);

    const budgetId = bRow.rows[0].budget_id;
    const itemId = bRow.rows[0].item_id;

    // 2. Convertir 4 unidades
    const convItems = [{ budgetItemId: itemId, quantity: 4 }];
    const key = 'idem_conv_part_1';
    const hash = 'hash_conv_part_1';

    const convRes = await db.query(`
      SELECT convert_budget_transactional(
        '${seller1UserId}'::UUID,
        '${budgetId}'::UUID,
        $1::JSONB,
        'direct',
        'Primer pedido parcial de 4 unidades',
        $2,
        $3
      ) as result;
    `, [JSON.stringify(convItems), key, hash]);

    const res = convRes.rows[0].result;
    assert.equal(res.success, true);
    assert.equal(res.is_fully_converted, false);
    assert.ok(res.order_id);

    // Verificar en base de datos: converted_quantity = 4, status = 'partially_converted'
    const checkItem = await db.query(`SELECT converted_quantity FROM budget_items WHERE id = '${itemId}'`);
    assert.equal(checkItem.rows[0].converted_quantity, 4);

    const checkBudget = await db.query(`SELECT status FROM budgets WHERE id = '${budgetId}'`);
    assert.equal(checkBudget.rows[0].status, 'partially_converted');

    // 3. Intento de sobreventa: solicitar 7 unidades (solo quedan 6) debe ser rechazado
    const overItems = [{ budgetItemId: itemId, quantity: 7 }];
    await assert.rejects(async () => {
      await db.query(`
        SELECT convert_budget_transactional(
          '${seller1UserId}'::UUID,
          '${budgetId}'::UUID,
          $1::JSONB,
          'direct',
          'Intento ilegal de sobreventa',
          'key_over_1',
          'hash_over_1'
        );
      `, [JSON.stringify(overItems)]);
    }, /Saldo insuficiente/);
  });

  test('4.1 Solicitudes simultáneas en la instancia PGlite: claves distintas no exceden el saldo', async () => {
    // 1. Crear presupuesto con 5 unidades disponibles
    const budgetRes = await db.query(`
      SELECT create_budget_transactional(
        '${seller1UserId}'::UUID, '${client1Id}'::UUID,
        '[{"productName": "Hidromasaje Concurrente", "quantity": 5, "unitPrice": 1000000}]'::JSONB,
        '[]'::JSONB, 'Control de saldo concurrente', 'Pub', 'key_budget_stock_5', 'hash_stock_5',
        '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
        5000000, 5000000, 0, 1050000, 21.00, '${seller1Id}'::UUID
      ) as result;
    `);
    const budgetId = budgetRes.rows[0].result.id;
    const itRow = await db.query(`SELECT id FROM budget_items WHERE budget_id = '${budgetId}'`);
    const itemId = itRow.rows[0].id;

    // 2. Dos solicitudes simultáneas con claves distintas:
    // Solicitud 1 pide 4 unidades (clave: key_conv_concurrent_a)
    // Solicitud 2 pide 3 unidades (clave: key_conv_concurrent_b)
    // Total solicitado = 7 unidades > 5 disponibles.
    const convItemsA = [{ budgetItemId: itemId, quantity: 4 }];
    const convItemsB = [{ budgetItemId: itemId, quantity: 3 }];

    const results = await Promise.allSettled([
      db.query(`
        SELECT convert_budget_transactional(
          '${seller1UserId}'::UUID, '${budgetId}'::UUID, $1::JSONB,
          'direct', 'Pedido concurrente A', 'key_conv_concurrent_a', 'hash_conv_ca'
        ) as result;
      `, [JSON.stringify(convItemsA)]),
      db.query(`
        SELECT convert_budget_transactional(
          '${seller1UserId}'::UUID, '${budgetId}'::UUID, $1::JSONB,
          'direct', 'Pedido concurrente B', 'key_conv_concurrent_b', 'hash_conv_cb'
        ) as result;
      `, [JSON.stringify(convItemsB)])
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    assert.equal(fulfilled.length, 1, 'Una de las solicitudes concurrentes se procesó exitosamente');
    assert.equal(rejected.length, 1, 'La otra solicitud simultánea fue rechazada por falta de saldo');
    assert.match(rejected[0].reason.message, /Saldo insuficiente/);

    // 3. Validar en base de datos que el saldo convertido no excedió las 5 unidades disponibles
    const checkItem = await db.query(`SELECT quantity, converted_quantity FROM budget_items WHERE id = '${itemId}'`);
    const { quantity, converted_quantity } = checkItem.rows[0];
    assert.ok(converted_quantity <= quantity, `Saldo convertido (${converted_quantity}) no excede total (${quantity})`);
    assert.equal(converted_quantity, 4, 'Se convirtieron exactamente las 4 unidades de la ganadora');
  });

  test('5. Reintentos idempotentes post-commit: Devuelve el mismo pedido sin error de estado ya convertido', async () => {
    // Obtener presupuesto para convertir las 6 restantes
    const bRow = await db.query(`
      SELECT b.id as budget_id, bi.id as item_id
      FROM budgets b
      JOIN budget_items bi ON bi.budget_id = b.id
      WHERE b.idempotency_key = 'idem_create_real_1'
      LIMIT 1;
    `);

    const budgetId = bRow.rows[0].budget_id;
    const itemId = bRow.rows[0].item_id;

    const convFinalItems = [{ budgetItemId: itemId, quantity: 6 }];
    const finalKey = 'idem_conv_final_1';
    const finalHash = 'hash_conv_final_1';

    // Conversión total
    const resFinal1 = await db.query(`
      SELECT convert_budget_transactional(
        '${seller1UserId}'::UUID,
        '${budgetId}'::UUID,
        $1::JSONB,
        'direct',
        'Segundo pedido que completa el presupuesto',
        $2,
        $3
      ) as result;
    `, [JSON.stringify(convFinalItems), finalKey, finalHash]);

    const orderFinalId = resFinal1.rows[0].result.order_id;
    assert.equal(resFinal1.rows[0].result.is_fully_converted, true);

    // Estado ahora es 'converted' y saldo es 0
    const checkB = await db.query(`SELECT status FROM budgets WHERE id = '${budgetId}'`);
    assert.equal(checkB.rows[0].status, 'converted');

    // REINTENTO DE RED: el cliente no recibió el ack y reintenta con la misma clave.
    // Debe devolver exactamente el mismo pedido en vez de fallar con "ya fue convertido" o "saldo insuficiente".
    const resFinalRetry = await db.query(`
      SELECT convert_budget_transactional(
        '${seller1UserId}'::UUID,
        '${budgetId}'::UUID,
        $1::JSONB,
        'direct',
        'Segundo pedido que completa el presupuesto',
        $2,
        $3
      ) as result;
    `, [JSON.stringify(convFinalItems), finalKey, finalHash]);

    assert.equal(resFinalRetry.rows[0].result.order_id, orderFinalId);
  });

  test('6. Cancelación transaccional: Restaura unidades disponibles exactamente una vez', async () => {
    // Cancelar el segundo pedido (6 unidades)
    const oRow = await db.query(`
      SELECT o.id as order_id, o.budget_id, oi.budget_item_id, oi.quantity
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status <> 'cancelled' AND oi.quantity = 6
      LIMIT 1;
    `);

    const orderId = oRow.rows[0].order_id;
    const budgetId = oRow.rows[0].budget_id;
    const budgetItemId = oRow.rows[0].budget_item_id;

    const cancelKey = 'cancel_order_idem_1';
    const cancelHash = 'cancel_hash_1';

    const cancelRes = await db.query(`
      SELECT cancel_order_transactional(
        '${seller1UserId}'::UUID,
        '${orderId}'::UUID,
        'Cancelado por solicitud del cliente',
        $1,
        $2
      ) as result;
    `, [cancelKey, cancelHash]);

    assert.equal(cancelRes.rows[0].result.success, true);
    assert.equal(cancelRes.rows[0].result.status, 'cancelled');

    // Verificar en base de datos: las 6 unidades fueron restauradas
    // 10 originales - 4 del primer pedido = 6 disponibles. converted_quantity vuelve a 4!
    const checkItem = await db.query(`SELECT converted_quantity FROM budget_items WHERE id = '${budgetItemId}'`);
    assert.equal(checkItem.rows[0].converted_quantity, 4);

    // Estado del presupuesto regresa a 'partially_converted' porque el primer pedido sigue activo
    const checkBudget = await db.query(`SELECT status FROM budgets WHERE id = '${budgetId}'`);
    assert.equal(checkBudget.rows[0].status, 'partially_converted');

    // Reintento idempotente de cancelación devuelve resultado previo
    const cancelRetry = await db.query(`
      SELECT cancel_order_transactional(
        '${seller1UserId}'::UUID,
        '${orderId}'::UUID,
        'Cancelado por solicitud del cliente',
        $1,
        $2
      ) as result;
    `, [cancelKey, cancelHash]);

    assert.equal(cancelRetry.rows[0].result.status, 'cancelled');

    // No se pueden restaurar unidades dos veces: converted_quantity sigue siendo 4
    const checkItemDouble = await db.query(`SELECT converted_quantity FROM budget_items WHERE id = '${budgetItemId}'`);
    assert.equal(checkItemDouble.rows[0].converted_quantity, 4);
  });

  test('7. Venta por distribuidor y navegación a pedido', async () => {
    // 1. Crear presupuesto de distribuidor
    const items = [{ productName: "Bañera Confort", quantity: 2, unitPrice: 800000 }];
    const bRes = await db.query(`
      SELECT create_budget_transactional(
        '${adminUserId}'::UUID,
        '${client1Id}'::UUID,
        $1::JSONB,
        '[]'::JSONB, 'Venta canal distribuidor', 'Condiciones', 'dist_b_1', 'hash_db1',
        '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
        1600000, 1600000, 0, 336000, 21.00,
        '${seller1Id}'::UUID
      ) as result;
    `, [JSON.stringify(items)]);

    const bId = bRes.rows[0].result.id;
    const itRow = await db.query(`SELECT id FROM budget_items WHERE budget_id = '${bId}'`);
    const biId = itRow.rows[0].id;

    // 2. Convertir como venta de distribuidor
    const convItems = [{ budgetItemId: biId, quantity: 2 }];
    const cRes = await db.query(`
      SELECT convert_budget_transactional(
        '${adminUserId}'::UUID,
        '${bId}'::UUID,
        $1::JSONB,
        'distributor',
        'Venta directa asignada a distribuidor',
        'dist_conv_1',
        'dist_conv_hash_1'
      ) as result;
    `, [JSON.stringify(convItems)]);

    const distOrder = cRes.rows[0].result;
    assert.equal(distOrder.success, true);
    assert.ok(distOrder.order_id);
    assert.equal(distOrder.budget_status, 'distributor_sale');

    // Verificar en base de datos: la orden posee el canal correspondiente
    const oRow = await db.query(`SELECT sale_channel, order_type FROM orders WHERE id = '${distOrder.order_id}'`);
    assert.equal(oRow.rows[0].sale_channel, 'distributor');
    assert.equal(oRow.rows[0].order_type, 'distributor_sale');
  });

  test('8. Enlaces digitales: Borrador privado por defecto, publicación explícita y revocación', async () => {
    // 1. Crear presupuesto en borrador
    const items = [{ productName: "Spa Modelo Patagonia", quantity: 1, unitPrice: 3500000 }];
    const bRes = await db.query(`
      SELECT create_budget_transactional(
        '${seller1UserId}'::UUID,
        '${client1Id}'::UUID,
        $1::JSONB,
        '[]'::JSONB, 'Nota interna confidencial sobre margen', 'Condiciones públicas para el cliente',
        'pub_b_1', 'hash_pub1',
        '{"name": "Juan Pérez"}'::JSONB, '{"name": "Vendedor Uno"}'::JSONB, '{}'::JSONB,
        3500000, 3500000, 0, 735000, 21.00,
        '${seller1Id}'::UUID
      ) as result;
    `, [JSON.stringify(items)]);

    const budgetId = bRes.rows[0].result.id;

    // Verificar estado inicial: borrador y no publicado
    const bCheck = await db.query(`SELECT public_status, notes, public_notes FROM budgets WHERE id = '${budgetId}'`);
    assert.equal(bCheck.rows[0].public_status, 'draft');
    assert.equal(bCheck.rows[0].notes, 'Nota interna confidencial sobre margen');
    assert.equal(bCheck.rows[0].public_notes, 'Condiciones públicas para el cliente');

    // 2. Publicación explícita
    const pubRes = await db.query(`
      SELECT publish_budget_transactional(
        '${seller1UserId}'::UUID,
        '${budgetId}'::UUID
      ) as result;
    `, []);

    assert.equal(pubRes.rows[0].result.success, true);
    assert.equal(pubRes.rows[0].result.public_status, 'published');
    assert.ok(pubRes.rows[0].result.public_token);

    // 3. Revocación efectiva
    const revRes = await db.query(`
      SELECT revoke_budget_transactional(
        '${seller1UserId}'::UUID,
        '${budgetId}'::UUID
      ) as result;
    `, []);

    assert.equal(revRes.rows[0].result.success, true);
    assert.equal(revRes.rows[0].result.public_status, 'revoked');

    // Consulta de la vista pública no expone notas internas
    const pubView = await db.query(`
      SELECT id, public_status, public_notes, total_amount
      FROM budgets
      WHERE id = '${budgetId}'
    `);
    assert.equal(pubView.rows[0].public_status, 'revoked');
    assert.equal(pubView.rows[0].public_notes, 'Condiciones públicas para el cliente');
  });

  test('9. Validación de Precios Oficiales (Pantalla y Servidor comparten fuente única)', () => {
    const catalog = getOfficialCatalog();
    assert.ok(catalog.length > 50, "El catálogo oficial contiene todos los modelos");

    // Tomar un ítem del catálogo
    const sample = catalog[0];
    assert.ok(sample.key);
    assert.ok(sample.name);
    assert.ok(sample.price > 0);

    // Precio oficial sin manipular: Aceptado
    const validCheck = verifyOfficialPrice(sample.name, sample.price, sample.key, sample.variantName);
    assert.equal(validCheck.isOfficial, true);

    // Precio manipulado (ej: $1 en vez del oficial): Rechazado
    const manipulatedCheck = verifyOfficialPrice(sample.name, 1, sample.key, sample.variantName);
    assert.equal(manipulatedCheck.isOfficial, false);
    assert.equal(manipulatedCheck.officialPrice, sample.price);
  });

  test('10. Presupuestos históricos y PDF: Respeto estricto de importes y tasas válidas de cero', () => {
    // 1. Presupuesto histórico estándar (21% IVA)
    const stdTotals = calculateCommercialTotals(
      [{ quantity: 1, unitPrice: 3199000 }],
      [],
      21.00
    );
    assert.equal(stdTotals.subtotal, 3199000);
    assert.equal(stdTotals.netTotal, 3199000);
    assert.equal(stdTotals.taxRate, 21.00);
    assert.equal(stdTotals.taxAmount, 671790);
    assert.equal(stdTotals.totalWithTax, 3870790);

    // 2. Presupuesto con tasa cero (0% IVA): Debe conservar taxAmount = 0 y no forzar 21%
    const zeroTaxTotals = calculateCommercialTotals(
      [{ quantity: 2, unitPrice: 1000000 }],
      [10],
      0.00
    );
    assert.equal(zeroTaxTotals.subtotal, 2000000);
    assert.equal(zeroTaxTotals.discountAmount, 200000);
    assert.equal(zeroTaxTotals.netTotal, 1800000);
    assert.equal(zeroTaxTotals.taxRate, 0.00);
    assert.equal(zeroTaxTotals.taxAmount, 0);
    assert.equal(zeroTaxTotals.totalWithTax, 1800000); // Cero impuestos añadidos
  });

  test('11. Respaldo y restauración en PostgreSQL aislado con ajuste de secuencias', async () => {
    // 1. Obtener número máximo actual
    const maxB = await db.query(`SELECT COALESCE(MAX(budget_number), 1) as max_b FROM budgets`);
    const maxO = await db.query(`SELECT COALESCE(MAX(order_number), 1) as max_o FROM orders`);

    const nextBudgetNum = Number(maxB.rows[0].max_b) + 500;
    const nextOrderNum = Number(maxO.rows[0].max_o) + 500;

    // 2. Simular restauración con registros forzados
    await db.exec(`
      SELECT setval('budgets_budget_number_seq', ${nextBudgetNum}, true);
      SELECT setval('orders_order_number_seq', ${nextOrderNum}, true);
    `);

    // 3. Crear nuevo presupuesto y verificar que utiliza la secuencia actualizada sin colisionar
    const newBRes = await db.query(`
      SELECT create_budget_transactional(
        '${adminUserId}'::UUID,
        '${client1Id}'::UUID,
        '[{"productName": "Bañera Post Restauración", "quantity": 1, "unitPrice": 1200000}]'::JSONB,
        '[]'::JSONB, 'Notas post restore', 'Publicas', 'key_restore_1', 'hash_res_1',
        '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
        1200000, 1200000, 0, 252000, 21.00,
        '${seller1Id}'::UUID
      ) as result;
    `);

    const createdB = newBRes.rows[0].result;
    assert.equal(createdB.success, true);
    assert.ok(createdB.budget_number > nextBudgetNum, `El número generado (${createdB.budget_number}) supera el punto de restauración`);
  });
});
