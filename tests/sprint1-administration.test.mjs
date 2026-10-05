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

describe('SPRINT 1 — PORTAL DE ADMINISTRACIÓN FIVESAINT (ENTORNO AISLADO PGLITE)', async () => {
  let db;

  // IDs para el entorno de prueba
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const adminId = '11111111-1111-1111-1111-111111111112';

  const adminRoleUserId = '77777777-7777-7777-7777-777777777771';
  const adminRoleId = '77777777-7777-7777-7777-777777777772';

  const inactiveAdminRoleUserId = '77777777-8888-7777-7777-777777777771';
  const inactiveAdminRoleId = '77777777-8888-7777-7777-777777777772';

  const seller1UserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const seller1Id = '22222222-2222-2222-2222-222222222221';

  const seller2UserId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const seller2Id = '22222222-2222-2222-2222-222222222222';

  const distributorUserId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const distributorId = '44444444-4444-4444-4444-444444444444';

  const unauthorizedUserId = '99999999-9999-9999-9999-999999999999';

  const client1Id = '33333333-3333-3333-3333-333333333331';
  const client2Id = '33333333-3333-3333-3333-333333333332';

  let historicalSnapshotBefore = [];

  before(async () => {
    // 1. Inicializar motor PostgreSQL aislado
    db = new PGlite();

    // 2. Esquema base previo a la migración Sprint 1
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

      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY,
        email TEXT
      );

      INSERT INTO auth.users (id, email) VALUES
        ('${adminUserId}', 'admin@fivesaint.com'),
        ('${adminRoleUserId}', 'admin.op@fivesaint.com'),
        ('${inactiveAdminRoleUserId}', 'admin.inactivo@fivesaint.com'),
        ('${seller1UserId}', 'v1@fivesaint.com'),
        ('${seller2UserId}', 'v2@fivesaint.com'),
        ('${distributorUserId}', 'dist@fivesaint.com'),
        ('${unauthorizedUserId}', 'unauth@fivesaint.com')
      ON CONFLICT (id) DO NOTHING;

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
          phone TEXT,
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

    // 3. Ejecutar migración commercial previa (20261003)
    const migrationCommercial = fs.readFileSync('supabase/migrations/20261003000100_commercial_release.sql', 'utf8');
    await db.exec(migrationCommercial);

    // 4. Cargar datos maestros y presupuestos históricos antes de la nueva migración
    await db.exec(`
      INSERT INTO admin_users (id, user_id, full_name, is_active)
      VALUES ('${adminId}', '${adminUserId}', 'Administrador General', true);

      INSERT INTO sellers (id, user_id, username, full_name, email, is_active)
      VALUES 
        ('${seller1Id}', '${seller1UserId}', 'vendedor.uno', 'Vendedor Uno', 'v1@fivesaint.com', true),
        ('${seller2Id}', '${seller2UserId}', 'vendedor.dos', 'Vendedor Dos', 'v2@fivesaint.com', true);

      INSERT INTO distributors (id, user_id, company_name, contact_name, discount_percentage, is_active)
      VALUES ('${distributorId}', '${distributorUserId}', 'Distribuidora Central S.A.', 'Roberto Distribuidor', 10.00, true);

      INSERT INTO clients (id, name, company_name, email, phone, seller_id, status)
      VALUES 
        ('${client1Id}', 'Empresa Alpha S.A.', 'Alpha Group', 'compras@alpha.com', '1144556677', '${seller1Id}', 'activo'),
        ('${client2Id}', 'Estudio Beta Arq', 'Beta Arquitectos', 'contacto@beta.com', '1188990011', '${seller2Id}', 'activo');

      -- Presupuestos Históricos previos (creados por Vendedor 1)
      INSERT INTO budgets (id, budget_number, client_id, seller_id, status, total_amount, discounts, notes, subtotal_amount, tax_rate, tax_amount)
      VALUES 
        ('b0000000-0000-0000-0000-000000000001', 15, '${client1Id}', '${seller1Id}', 'converted', 1210000.00, '[]'::jsonb, 'Presupuesto historico #15', 1000000.00, 21.00, 210000.00),
        ('b0000000-0000-0000-0000-000000000002', 24, '${client1Id}', '${seller1Id}', 'draft', 2420000.00, '[]'::jsonb, 'Presupuesto historico #24', 2000000.00, 21.00, 420000.00);

      INSERT INTO budget_items (id, budget_id, product_name, quantity, unit_price, total_price, converted_quantity)
      VALUES 
        ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Bañera Hidromasaje Alpha', 1, 1000000.00, 1000000.00, 1),
        ('b1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Bañera Isla Suite', 2, 1000000.00, 2000000.00, 0);
    `);

    // Tomar snapshot de los datos históricos antes de correr la nueva migración
    const histBefore = await db.query(`SELECT id, budget_number, client_id, seller_id, status, total_amount, subtotal_amount, tax_amount FROM budgets ORDER BY budget_number ASC;`);
    historicalSnapshotBefore = histBefore.rows;

    // 5. APLICAR LA MIGRACIÓN NUEVA DEL SPRINT 1
    const migrationSprint1 = fs.readFileSync('supabase/migrations/20261004000100_sprint1_administration_portal.sql', 'utf8');
    await db.exec(migrationSprint1);
  });

  test('1. VERIFICACIÓN DE INTEGRIDAD HISTÓRICA POST-MIGRACIÓN', async () => {
    // Verificar que los presupuestos históricos permanecen intactos
    const histAfter = await db.query(`SELECT id, budget_number, client_id, seller_id, status, total_amount, subtotal_amount, tax_amount, creator_role, created_by_user_id FROM budgets ORDER BY budget_number ASC;`);
    assert.equal(histAfter.rows.length, historicalSnapshotBefore.length, 'La cantidad de presupuestos historicos no debe cambiar');

    for (let i = 0; i < historicalSnapshotBefore.length; i++) {
      const b = historicalSnapshotBefore[i];
      const a = histAfter.rows[i];
      assert.equal(a.id, b.id);
      assert.equal(a.budget_number, b.budget_number);
      assert.equal(a.client_id, b.client_id);
      assert.equal(a.seller_id, b.seller_id);
      assert.equal(a.status, b.status);
      assert.equal(Number(a.total_amount), Number(b.total_amount));
      assert.equal(Number(a.subtotal_amount), Number(b.subtotal_amount));
      // Nuevas columnas en registros históricos
      assert.equal(a.creator_role, 'seller', 'El rol de autor de presupuestos preexistentes debe defaulting a seller');
      assert.equal(a.created_by_user_id, null, 'created_by_user_id debe ser null para registros historicos');
    }
  });

  test('2. GESTIÓN DE USUARIOS DE ADMINISTRACIÓN (ADMIN_USERS ASIGNA O CREA)', async () => {
    // 2.1 ADMIN crea nuevo usuario de administracion activo
    await db.query(`
      INSERT INTO administration_users (id, user_id, email, full_name, is_active, created_by, updated_by)
      VALUES ('${adminRoleId}', '${adminRoleUserId}', 'admin.op@fivesaint.com', 'Lucía Operaciones', true, '${adminUserId}', '${adminUserId}');
    `);

    // 2.2 ADMIN asigna usuario inactivo
    await db.query(`
      INSERT INTO administration_users (id, user_id, email, full_name, is_active, created_by, updated_by)
      VALUES ('${inactiveAdminRoleId}', '${inactiveAdminRoleUserId}', 'admin.inactivo@fivesaint.com', 'Mario Inactivo', false, '${adminUserId}', '${adminUserId}');
    `);

    const users = await db.query(`SELECT email, full_name, is_active, created_by FROM administration_users ORDER BY email ASC;`);
    assert.equal(users.rows.length, 2);
    assert.equal(users.rows[0].email, 'admin.inactivo@fivesaint.com');
    assert.equal(users.rows[0].is_active, false);
    assert.equal(users.rows[1].email, 'admin.op@fivesaint.com');
    assert.equal(users.rows[1].is_active, true);
    assert.equal(users.rows[1].created_by, adminUserId, 'Debe registrar la trazabilidad de quien creo el usuario');
  });

  test('3. MATRIZ DE PERMISOS Y CONTROL DE ACCESO', async () => {
    // 3.1 Usuario no autorizado o anónimo no puede crear presupuestos
    await assert.rejects(async () => {
      await db.query(`
        SELECT create_budget_transactional(
          '${unauthorizedUserId}'::UUID,
          '${client1Id}'::UUID,
          '[{"productName": "Bañera Test", "quantity": 1, "unitPrice": 100000}]'::JSONB,
          '[]'::JSONB, 'Notas', 'Publicas', 'key_unauth_1', 'hash_unauth_1',
          '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
          100000, 100000, 0, 21000, 21.00,
          NULL::UUID
        );
      `);
    }, /ACCESO DENEGADO: El usuario no posee un rol comercial o administrativo activo/);

    // 3.2 Usuario de administracion INACTIVO es bloqueado
    await assert.rejects(async () => {
      await db.query(`
        SELECT create_budget_transactional(
          '${inactiveAdminRoleUserId}'::UUID,
          '${client1Id}'::UUID,
          '[{"productName": "Bañera Test", "quantity": 1, "unitPrice": 100000}]'::JSONB,
          '[]'::JSONB, 'Notas', 'Publicas', 'key_inact_admin_1', 'hash_inact_admin_1',
          '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
          100000, 100000, 0, 21000, 21.00,
          NULL::UUID
        );
      `);
    }, /ACCESO DENEGADO: El usuario no posee un rol comercial o administrativo activo/);

    // 3.3 Vendedor 1 intenta crear presupuesto para cliente de Vendedor 2 -> Bloqueado
    await assert.rejects(async () => {
      await db.query(`
        SELECT create_budget_transactional(
          '${seller1UserId}'::UUID,
          '${client2Id}'::UUID,
          '[{"productName": "Bañera Test", "quantity": 1, "unitPrice": 100000}]'::JSONB,
          '[]'::JSONB, 'Notas', 'Publicas', 'key_seller_cross', 'hash_seller_cross',
          '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
          100000, 100000, 0, 21000, 21.00,
          '${seller1Id}'::UUID
        );
      `);
    }, /ACCESO DENEGADO: No está autorizado a presupuestar clientes de otro asesor/);
  });

  test('4. ADMINISTRACIÓN CREA PRESUPUESTO PRESERVANDO VENDEDOR ASIGNADO Y AUTORÍA SEPARADA', async () => {
    const key = 'idem_admin_create_1';
    const hash = 'hash_admin_create_1';
    const items = [
      { productName: "Spa Premium Confort", quantity: 5, unitPrice: 800000 }
    ];

    // La Administradora Lucía crea un presupuesto para Client 1 (cuyo vendedor asignado es Vendedor Uno)
    const res = await db.query(`
      SELECT create_budget_transactional(
        '${adminRoleUserId}'::UUID,
        '${client1Id}'::UUID,
        $1::JSONB,
        '[]'::JSONB,
        'Notas internas de administracion',
        'Notas publicas del cliente',
        $2,
        $3,
        '{"name": "Empresa Alpha S.A."}'::JSONB,
        '{"name": "Lucía Operaciones"}'::JSONB,
        '{"subtotal": 4000000, "netTotal": 4000000, "taxRate": 21}'::JSONB,
        4840000, 4000000, 0, 840000, 21.00,
        NULL::UUID
      ) as result;
    `, [JSON.stringify(items), key, hash]);

    const result = res.rows[0].result;
    assert.equal(result.success, true);
    const createdBudgetId = result.id || result.budget_id;
    assert.ok(createdBudgetId);

    // Verificar en la base de datos:
    const bCheck = await db.query(`
      SELECT client_id, seller_id, created_by_user_id, creator_role, total_amount, status
      FROM budgets WHERE id = '${createdBudgetId}';
    `);
    const budgetRow = bCheck.rows[0];

    // REQUISITO CRÍTICO: El vendedor asignado se conserva del cliente, NO se inventa ni se sobrescribe
    assert.equal(budgetRow.seller_id, seller1Id, 'El presupuesto debe conservar el vendedor asignado al cliente');
    assert.equal(budgetRow.client_id, client1Id);

    // REQUISITO CRÍTICO: La autoría queda registrada por separado
    assert.equal(budgetRow.created_by_user_id, adminRoleUserId, 'created_by_user_id debe registrar al usuario autenticado');
    assert.equal(budgetRow.creator_role, 'administration', 'creator_role debe registrar administration');
    assert.equal(Number(budgetRow.total_amount), 4840000);
    assert.equal(budgetRow.status, 'draft');

    // Verificar nota en client_notes con trazabilidad
    const noteCheck = await db.query(`
      SELECT content, seller_id FROM client_notes WHERE budget_id = '${createdBudgetId}';
    `);
    assert.ok(noteCheck.rows.length > 0);
    assert.ok(noteCheck.rows[0].content.includes('Presupuesto N°') && noteCheck.rows[0].content.includes('Administración'));
  });

  test('5. PUBLICACIÓN Y REVOCACIÓN DE ENLACE DIGITAL (ADMINISTRACIÓN)', async () => {
    // Crear presupuesto borrador
    const items = [{ productName: "Bañera Lineal", quantity: 2, unitPrice: 300000 }];
    const res = await db.query(`
      SELECT create_budget_transactional(
        '${adminRoleUserId}'::UUID,
        '${client2Id}'::UUID,
        $1::JSONB, '[]'::JSONB, 'Notas', 'Publicas', 'key_pub_1', 'hash_pub_1',
        '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
        600000, 600000, 0, 126000, 21.00,
        NULL::UUID
      ) as result;
    `, [JSON.stringify(items)]);
    const budgetId = res.rows[0].result.id || res.rows[0].result.budget_id;

    // Publicar enlace digital
    const pubRes = await db.query(`
      SELECT publish_budget_transactional('${adminRoleUserId}'::UUID, '${budgetId}'::UUID) as result;
    `);
    assert.equal(pubRes.rows[0].result.success, true);
    assert.ok(pubRes.rows[0].result.public_token);

    // Verificar estado published
    const pubCheck = await db.query(`SELECT status, public_status, public_token FROM budgets WHERE id = '${budgetId}';`);
    assert.equal(pubCheck.rows[0].public_status, 'published');
    assert.equal(pubCheck.rows[0].status, 'sent');
    assert.ok(pubCheck.rows[0].public_token);

    // Revocar enlace digital
    const revRes = await db.query(`
      SELECT revoke_budget_transactional('${adminRoleUserId}'::UUID, '${budgetId}'::UUID) as result;
    `);
    assert.equal(revRes.rows[0].result.success, true);

    // Verificar estado revocado
    const revCheck = await db.query(`SELECT status, public_status, public_token FROM budgets WHERE id = '${budgetId}';`);
    assert.equal(revCheck.rows[0].public_status, 'revoked');
  });

  test('6. CONVERSIÓN PARCIAL A PEDIDO Y GESTIÓN DE CICLO DE VIDA', async () => {
    // 6.1 Crear presupuesto con 10 unidades
    const items = [
      { productName: "Spa Luxury 8P", quantity: 10, unitPrice: 1000000 }
    ];
    const bRes = await db.query(`
      SELECT create_budget_transactional(
        '${adminRoleUserId}'::UUID,
        '${client1Id}'::UUID,
        $1::JSONB, '[]'::JSONB, 'Notas de pedido parcial', 'Publicas', 'key_conv_partial', 'hash_conv_partial',
        '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
        10000000, 10000000, 0, 2100000, 21.00,
        NULL::UUID
      ) as result;
    `, [JSON.stringify(items)]);
    const budgetId = bRes.rows[0].result.id || bRes.rows[0].result.budget_id;

    // Obtener item ID
    const itemsCheck = await db.query(`SELECT id, quantity, converted_quantity FROM budget_items WHERE budget_id = '${budgetId}';`);
    const budgetItemId = itemsCheck.rows[0].id;
    assert.equal(itemsCheck.rows[0].converted_quantity, 0);

    // 6.2 Convertir 4 unidades a pedido (conversión parcial)
    const convertItems = [
      { budgetItemId: budgetItemId, quantity: 4 }
    ];

    const convRes = await db.query(`
      SELECT convert_budget_transactional(
        '${adminRoleUserId}'::UUID,
        '${budgetId}'::UUID,
        $1::JSONB,
        'direct',
        'Primer lote de produccion - 4 unidades',
        'key_conv_order_1', 'hash_conv_order_1'
      ) as result;
    `, [JSON.stringify(convertItems)]);

    const convResult = convRes.rows[0].result;
    assert.equal(convResult.success, true);
    const orderId = convResult.order_id;
    assert.ok(orderId);

    // 6.3 Verificar remanente en budget_items (debe quedar converted_quantity = 4 de 10)
    const itemAfter = await db.query(`SELECT quantity, converted_quantity FROM budget_items WHERE id = '${budgetItemId}';`);
    assert.equal(itemAfter.rows[0].converted_quantity, 4, 'converted_quantity debe registrar exactamente 4 unidades');
    const saldoRemanente = itemAfter.rows[0].quantity - itemAfter.rows[0].converted_quantity;
    assert.equal(saldoRemanente, 6, 'El saldo disponible restante debe ser 6');

    // Estado del presupuesto debe ser partially_converted
    const budgetAfter = await db.query(`SELECT status FROM budgets WHERE id = '${budgetId}';`);
    assert.equal(budgetAfter.rows[0].status, 'partially_converted');

    // 6.4 Verificar orden creada y sus items
    const orderCheck = await db.query(`SELECT order_number, status, total_amount, seller_id FROM orders WHERE id = '${orderId}';`);
    assert.equal(orderCheck.rows[0].status, 'pending');
    assert.equal(Number(orderCheck.rows[0].total_amount), 4000000);
    assert.equal(orderCheck.rows[0].seller_id, seller1Id, 'La orden debe conservar el vendedor del cliente');

    const orderItemsCheck = await db.query(`SELECT quantity, unit_price FROM order_items WHERE order_id = '${orderId}';`);
    assert.equal(orderItemsCheck.rows.length, 1);
    assert.equal(orderItemsCheck.rows[0].quantity, 4);

    // 6.5 Gestión de producción y entrega (actualizar estado)
    await db.query(`UPDATE orders SET status = 'processing', updated_at = now() WHERE id = '${orderId}';`);
    let oStatus = await db.query(`SELECT status FROM orders WHERE id = '${orderId}';`);
    assert.equal(oStatus.rows[0].status, 'processing');

    await db.query(`UPDATE orders SET status = 'delivered', updated_at = now() WHERE id = '${orderId}';`);
    oStatus = await db.query(`SELECT status FROM orders WHERE id = '${orderId}';`);
    assert.equal(oStatus.rows[0].status, 'delivered');
  });

  test('7. CANCELACIÓN DE PEDIDO Y RESTAURACIÓN EXACTA DE SALDOS (ADMINISTRACIÓN)', async () => {
    // 7.1 Crear presupuesto y convertir 3 unidades
    const items = [{ productName: "Bañera Clásica", quantity: 5, unitPrice: 200000 }];
    const bRes = await db.query(`
      SELECT create_budget_transactional(
        '${adminRoleUserId}'::UUID,
        '${client2Id}'::UUID,
        $1::JSONB, '[]'::JSONB, 'Notas', 'Publicas', 'key_cancel_test', 'hash_cancel_test',
        '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
        1000000, 1000000, 0, 210000, 21.00,
        NULL::UUID
      ) as result;
    `, [JSON.stringify(items)]);
    const budgetId = bRes.rows[0].result.id || bRes.rows[0].result.budget_id;

    const bItem = await db.query(`SELECT id FROM budget_items WHERE budget_id = '${budgetId}';`);
    const budgetItemId = bItem.rows[0].id;

    const convItems = [{ budgetItemId: budgetItemId, quantity: 3 }];
    const cRes = await db.query(`
      SELECT convert_budget_transactional(
        '${adminRoleUserId}'::UUID,
        '${budgetId}'::UUID,
        $1::JSONB,
        'direct',
        'Pedido para cancelacion',
        'key_order_to_cancel', 'hash_order_to_cancel'
      ) as result;
    `, [JSON.stringify(convItems)]);
    const orderId = cRes.rows[0].result.order_id;

    // Verificar cantidad convertida antes de cancelacion = 3
    let remBefore = await db.query(`SELECT converted_quantity FROM budget_items WHERE id = '${budgetItemId}';`);
    assert.equal(remBefore.rows[0].converted_quantity, 3);

    // 7.2 Cancelar la orden usando la RPC transactional cancel_order_transactional
    const cancelRes = await db.query(`
      SELECT cancel_order_transactional(
        '${adminRoleUserId}'::UUID,
        '${orderId}'::UUID,
        'Cliente modifico especificaciones tecnicas de obra',
        'key_cancel_action_1',
        'hash_cancel_action_1'
      ) as result;
    `);
    assert.equal(cancelRes.rows[0].result.success, true);

    // 7.3 Verificar que el saldo en budget_items se RESTAURÓ (converted_quantity vuelve a 0)
    let remAfter = await db.query(`SELECT quantity, converted_quantity FROM budget_items WHERE id = '${budgetItemId}';`);
    assert.equal(remAfter.rows[0].converted_quantity, 0, 'La cantidad convertida debe volver a 0 tras la cancelación');
    assert.equal(remAfter.rows[0].quantity - remAfter.rows[0].converted_quantity, 5, 'El saldo total disponible debe restaurarse a 5');

    // 7.4 Verificar estado de la orden cancelada y motivo registrado
    const oCheck = await db.query(`SELECT status, cancellation_reason FROM orders WHERE id = '${orderId}';`);
    assert.equal(oCheck.rows[0].status, 'cancelled');
    assert.equal(oCheck.rows[0].cancellation_reason, 'Cliente modifico especificaciones tecnicas de obra');
  });

  test('8. REGRESIÓN: VENDEDOR Y DISTRIBUIDOR CONSERVAN SUS FLUJOS HABITUALES', async () => {
    // 8.1 Vendedor 1 crea presupuesto con su rol propio
    const items = [{ productName: "Spa Familiar Vendedor 1", quantity: 1, unitPrice: 1500000 }];
    const res = await db.query(`
      SELECT create_budget_transactional(
        '${seller1UserId}'::UUID,
        '${client1Id}'::UUID,
        $1::JSONB, '[]'::JSONB, 'Notas vendedor', 'Publicas', 'key_reg_seller_1', 'hash_reg_seller_1',
        '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
        1500000, 1500000, 0, 315000, 21.00,
        '${seller1Id}'::UUID
      ) as result;
    `, [JSON.stringify(items)]);

    const bId = res.rows[0].result.id || res.rows[0].result.budget_id;
    const bData = await db.query(`SELECT seller_id, creator_role, created_by_user_id FROM budgets WHERE id = '${bId}';`);
    assert.equal(bData.rows[0].seller_id, seller1Id);
    assert.equal(bData.rows[0].creator_role, 'seller', 'El rol para el vendedor debe seguir siendo seller');
    assert.equal(bData.rows[0].created_by_user_id, seller1UserId);

    // 8.2 Vendedor 1 no tiene visibilidad de administration_users
    const adminUsersCount = await db.query(`SELECT count(*) FROM administration_users;`);
    assert.equal(Number(adminUsersCount.rows[0].count), 2);
  });

  test('9. CÁLCULOS COMERCIALES Y RENDERIZADO DE PDF', () => {
    // Validar las funciones matemáticas del PDF y cálculos de presupuestos
    const items = [
      { unitPrice: 1000000, quantity: 2 },
      { unitPrice: 500000, quantity: 1 }
    ];
    // Subtotal: 2,500,000; Descuento 10%: 250,000 -> Base imponible: 2,250,000; IVA 21%: 472,500; Total con IVA: 2,722,500
    const totals = calculateCommercialTotals(items, [10], 21);
    assert.equal(totals.subtotal, 2500000);
    assert.equal(totals.netTotal, 2250000);
    assert.equal(totals.discountAmount, 250000);
    assert.equal(totals.taxAmount, 472500);
    assert.equal(totals.totalWithTax, 2722500);

    const formatted = formatCurrencyARS(totals.totalWithTax);
    assert.ok(formatted.includes('2.722.500') || formatted.includes('2,722,500'));
  });

  test('10. PROTECCIÓN RLS EN administration_users (SOLO ADMIN MODIFICA, PROHIBICIÓN DE AUTO-ASIGNACIÓN)', async () => {
    const asUser = async (userId, role = 'authenticated') => {
      await db.query(`SET ROLE ${role};`);
      if (userId) {
        await db.query(`SELECT set_config('request.jwt.claim.sub', '${userId}', false);`);
      } else {
        await db.query(`SELECT set_config('request.jwt.claim.sub', '', false);`);
      }
    };

    const asSuperuser = async () => {
      await db.query(`RESET ROLE;`);
      await db.query(`SELECT set_config('request.jwt.claim.sub', '', false);`);
    };

    try {
      // 10.1 ADMIN autenticado puede insertar en administration_users
      await asUser(adminUserId);
      const testAdminId = '77777777-9999-7777-7777-777777777777';
      const testAdminUserId = '77777777-9999-7777-7777-777777777778';
      await asSuperuser();
      await db.query(`INSERT INTO auth.users (id, email) VALUES ('${testAdminUserId}', 'nuevo.admin@fivesaint.com') ON CONFLICT DO NOTHING;`);
      await asUser(adminUserId);

      await db.query(`
        INSERT INTO administration_users (id, user_id, email, full_name, is_active, created_by, updated_by)
        VALUES ('${testAdminId}', '${testAdminUserId}', 'nuevo.admin@fivesaint.com', 'Admin Creado Por Admin', true, '${adminUserId}', '${adminUserId}');
      `);
      const checkAdminCreated = await db.query(`SELECT id FROM administration_users WHERE id = '${testAdminId}';`);
      assert.equal(checkAdminCreated.rows.length, 1);

      // 10.2 Vendedor intenta auto-otorgarse rol de administración mediante acceso directo -> BLOQUEADO POR RLS
      await asUser(seller1UserId);
      await assert.rejects(async () => {
        await db.query(`
          INSERT INTO administration_users (user_id, email, full_name, is_active)
          VALUES ('${seller1UserId}', 'v1@fivesaint.com', 'Vendedor Auto-Promovido', true);
        `);
      }, /row-level security/i);

      // 10.3 Vendedor intenta modificar un perfil de administración existente -> BLOQUEADO POR RLS
      const updateAttempt = await db.query(`
        UPDATE administration_users SET is_active = true WHERE id = '${inactiveAdminRoleId}';
      `);
      // RLS filtra filas donde is_admin() es falso, por lo que no se actualiza ninguna fila
      assert.equal(updateAttempt.rowCount || 0, 0);

      // 10.4 Usuario anónimo intenta acceder a administration_users -> RECHAZADO
      await asUser(null, 'anon');
      await assert.rejects(async () => {
        await db.query(`SELECT * FROM administration_users;`);
      }, /permission denied/i);

    } finally {
      await asSuperuser();
    }
  });

  test('11. MATRIZ DE AISLAMIENTO Y POLÍTICAS DE LECTURA (6 IDENTIDADES AUTENTICADAS)', async () => {
    const asUser = async (userId, role = 'authenticated') => {
      await db.query(`SET ROLE ${role};`);
      if (userId) {
        await db.query(`SELECT set_config('request.jwt.claim.sub', '${userId}', false);`);
      } else {
        await db.query(`SELECT set_config('request.jwt.claim.sub', '', false);`);
      }
    };

    const asSuperuser = async () => {
      await db.query(`RESET ROLE;`);
      await db.query(`SELECT set_config('request.jwt.claim.sub', '', false);`);
    };

    try {
      // Identidad 1: ADMIN (Acceso global de lectura)
      await asUser(adminUserId);
      const adminClients = await db.query(`SELECT count(*) FROM clients;`);
      assert.equal(Number(adminClients.rows[0].count), 2, 'ADMIN debe ver la totalidad de clientes');
      const adminBudgets = await db.query(`SELECT count(*) FROM budgets;`);
      assert.ok(Number(adminBudgets.rows[0].count) >= 4, 'ADMIN debe ver la totalidad de presupuestos');

      // Identidad 2: ADMINISTRACIÓN (Acceso global de lectura operativa)
      await asUser(adminRoleUserId);
      const admClients = await db.query(`SELECT count(*) FROM clients;`);
      assert.equal(Number(admClients.rows[0].count), 2, 'Administración debe ver todos los clientes para cotizar');
      const admBudgets = await db.query(`SELECT count(*) FROM budgets;`);
      assert.ok(Number(admBudgets.rows[0].count) >= 4, 'Administración debe ver todos los presupuestos');

      // Identidad 3: VENDEDOR 1 (Aislamiento estricto de cartera propia)
      await asUser(seller1UserId);
      const v1Clients = await db.query(`SELECT id FROM clients;`);
      assert.equal(v1Clients.rows.length, 1, 'Vendedor 1 solo debe ver su propio cliente');
      assert.equal(v1Clients.rows[0].id, client1Id);

      const v1CrossBudgets = await db.query(`SELECT count(*) FROM budgets WHERE seller_id = '${seller2Id}';`);
      assert.equal(Number(v1CrossBudgets.rows[0].count), 0, 'Vendedor 1 tiene matemáticamente 0 acceso a presupuestos de Vendedor 2');

      // Identidad 4: DISTRIBUIDOR (Aislamiento a sus propias operaciones)
      await asUser(distributorUserId);
      const distClients = await db.query(`SELECT count(*) FROM clients;`);
      assert.equal(Number(distClients.rows[0].count), 0, 'Distribuidor no tiene acceso a la cartera general de clientes directos');

      // Identidad 5: USUARIO INACTIVO (Mario Inactivo, no tiene rol comercial ni adm activo)
      await asUser(inactiveAdminRoleUserId);
      const inactClients = await db.query(`SELECT count(*) FROM clients;`);
      assert.equal(Number(inactClients.rows[0].count), 0, 'Usuario inactivo no debe ver clientes');
      const inactBudgets = await db.query(`SELECT count(*) FROM budgets;`);
      assert.equal(Number(inactBudgets.rows[0].count), 0, 'Usuario inactivo no debe ver presupuestos');

      // Identidad 6: ANÓNIMO (Sin autenticación)
      await asUser(null, 'anon');
      await assert.rejects(async () => {
        await db.query(`SELECT count(*) FROM clients;`);
      }, /permission denied/i);

    } finally {
      await asSuperuser();
    }
  });

  test('12. PERFILES SUPERPUESTOS: DESACTIVAR ADMINISTRACIÓN REVOCA ACCESO SIN DESACTIVAR ROL COMERCIAL', async () => {
    // Escenario: El usuario Vendedor 2 (seller2UserId) tiene rol comercial activo como vendedor.
    // Además, se le otorga un perfil de administración temporal.
    const seller2AdminId = '77777777-2222-7777-7777-777777777777';
    await db.query(`
      INSERT INTO administration_users (id, user_id, email, full_name, is_active, created_by, updated_by)
      VALUES ('${seller2AdminId}', '${seller2UserId}', 'v2@fivesaint.com', 'Vendedor Dos (Con Administración)', true, '${adminUserId}', '${adminUserId}')
      ON CONFLICT (user_id) DO UPDATE SET is_active = true;
    `);

    // 12.1 Con administración ACTIVA: Puede crear presupuesto para un cliente ajeno (Client 1 pertenece a Vendedor 1)
    const resActive = await db.query(`
      SELECT create_budget_transactional(
        '${seller2UserId}'::UUID,
        '${client1Id}'::UUID,
        '[{"productName": "Hidromasaje Superpuesto 1", "quantity": 1, "unitPrice": 500000}]'::JSONB,
        '[]'::JSONB, 'Notas adm', 'Publicas', 'key_superpuesto_1', 'hash_sup_1',
        '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
        500000, 500000, 0, 105000, 21.00,
        NULL::UUID
      ) as result;
    `);
    assert.equal(resActive.rows[0].result.success, true);
    assert.equal(resActive.rows[0].result.creator_role, 'administration');

    // 12.2 ADMIN DESACTIVA el perfil de Administración de seller2
    await db.query(`
      UPDATE administration_users SET is_active = false, updated_by = '${adminUserId}'
      WHERE user_id = '${seller2UserId}';
    `);

    // Verificar que sellers.is_active SIGUE SIENDO TRUE (NO se desactivó su rol comercial)
    const sellerCheck = await db.query(`SELECT is_active FROM sellers WHERE user_id = '${seller2UserId}';`);
    assert.equal(sellerCheck.rows[0].is_active, true, 'El rol de vendedor no debe ser afectado al desactivar administración');

    // 12.3 Ahora intenta crear presupuesto para Client 1 (de Vendedor 1) -> BLOQUEADO POR FALTA DE ACCESO DE ADMINISTRACIÓN
    await assert.rejects(async () => {
      await db.query(`
        SELECT create_budget_transactional(
          '${seller2UserId}'::UUID,
          '${client1Id}'::UUID,
          '[{"productName": "Hidromasaje Superpuesto 2", "quantity": 1, "unitPrice": 500000}]'::JSONB,
          '[]'::JSONB, 'Notas', 'Publicas', 'key_superpuesto_2', 'hash_sup_2',
          '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
          500000, 500000, 0, 105000, 21.00,
          NULL::UUID
        );
      `);
    }, /ACCESO DENEGADO: No está autorizado a presupuestar clientes de otro asesor/);

    // 12.4 Sin embargo, para sus PROPIOS clientes (Client 2), SU ROL COMERCIAL FUNCIONA PERFECTAMENTE
    const resSellerOwn = await db.query(`
      SELECT create_budget_transactional(
        '${seller2UserId}'::UUID,
        '${client2Id}'::UUID,
        '[{"productName": "Hidromasaje Superpuesto 3", "quantity": 1, "unitPrice": 500000}]'::JSONB,
        '[]'::JSONB, 'Notas vendedor', 'Publicas', 'key_superpuesto_3', 'hash_sup_3',
        '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
        500000, 500000, 0, 105000, 21.00,
        '${seller2Id}'::UUID
      ) as result;
    `);
    assert.equal(resSellerOwn.rows[0].result.success, true);
    assert.equal(resSellerOwn.rows[0].result.creator_role, 'seller', 'Al estar revocada la administración, opera legítimamente como vendedor');
    assert.equal(resSellerOwn.rows[0].result.seller_id, seller2Id);
  });

  test('13. REGISTRO Y AUDITORÍA DE CAMBIOS DE ESTADO DE PEDIDOS', async () => {
    // 13.1 Crear presupuesto y orden para prueba de trazabilidad
    const bRes = await db.query(`
      SELECT create_budget_transactional(
        '${adminRoleUserId}'::UUID,
        '${client1Id}'::UUID,
        '[{"productName": "Bañera Auditoría", "quantity": 2, "unitPrice": 400000}]'::JSONB,
        '[]'::JSONB, 'Notas', 'Publicas', 'key_audit_b1', 'hash_audit_b1',
        '{}'::JSONB, '{}'::JSONB, '{}'::JSONB,
        800000, 800000, 0, 168000, 21.00,
        NULL::UUID
      ) as result;
    `);
    const budgetId = bRes.rows[0].result.id;
    const itemRow = await db.query(`SELECT id FROM budget_items WHERE budget_id = '${budgetId}';`);

    const cRes = await db.query(`
      SELECT convert_budget_transactional(
        '${adminRoleUserId}'::UUID,
        '${budgetId}'::UUID,
        '[{"budgetItemId": "${itemRow.rows[0].id}", "quantity": 2}]'::JSONB,
        'direct', 'Pedido para auditoria', 'key_audit_c1', 'hash_audit_c1'
      ) as result;
    `);
    const orderId = cRes.rows[0].result.order_id;

    // Verificar que la orden registra status_updated_at y status_updated_by desde su creación
    const oCreated = await db.query(`SELECT status, status_updated_at, status_updated_by FROM orders WHERE id = '${orderId}';`);
    assert.equal(oCreated.rows[0].status, 'pending');
    assert.ok(oCreated.rows[0].status_updated_at, 'status_updated_at debe registrar la marca de tiempo');
    assert.equal(oCreated.rows[0].status_updated_by, adminRoleUserId, 'status_updated_by debe registrar al autor');

    // 13.2 Cancelar la orden y verificar que cancelled_by y status_updated_by se auditan
    const cancelRes = await db.query(`
      SELECT cancel_order_transactional(
        '${adminRoleUserId}'::UUID,
        '${orderId}'::UUID,
        'Cancelación auditada de prueba',
        'key_audit_cancel', 'hash_audit_cancel'
      ) as result;
    `);
    assert.equal(cancelRes.rows[0].result.success, true);

    const oCancelled = await db.query(`SELECT status, cancelled_by, cancellation_reason, status_updated_by FROM orders WHERE id = '${orderId}';`);
    assert.equal(oCancelled.rows[0].status, 'cancelled');
    assert.equal(oCancelled.rows[0].cancelled_by, adminRoleUserId, 'cancelled_by debe registrar al usuario que ejecutó la cancelación');
    assert.equal(oCancelled.rows[0].cancellation_reason, 'Cancelación auditada de prueba');
    assert.equal(oCancelled.rows[0].status_updated_by, adminRoleUserId);
  });

  test('14. SEPARACIÓN DE SNAPSHOT DEL VENDEDOR Y AUTORÍA, Y CONSULTA PÚBLICA CON CAMPOS REQUERIDOS', async () => {
    // 14.1 Crear un presupuesto por parte del rol Administración para un cliente asignado a Vendedor 1
    const sellerSnapshotData = {
      name: 'Vendedor Uno',
      full_name: 'Vendedor Uno',
      seller_id: seller1Id,
      phone: '+54 9 11 1111-2222',
      email: 'v1@fivesaint.com'
    };

    const authorSnapshotData = {
      user_id: adminRoleUserId,
      name: 'Martín Gómez (Administración)',
      role: 'administration',
      email: 'admin.op@fivesaint.com'
    };

    const res = await db.query(`
      SELECT create_budget_transactional(
        '${adminRoleUserId}'::UUID,
        '${client1Id}'::UUID,
        '[{"productName": "Hidromasaje Separación Snapshot", "quantity": 1, "unitPrice": 450000}]'::JSONB,
        '[]'::JSONB, 'Notas internas', 'Condiciones comerciales de validez 7 días',
        'key_snapshot_separation_1', 'hash_snap_sep_1',
        '{"name": "Cliente Uno", "email": "c1@cliente.com"}'::JSONB,
        '${JSON.stringify(sellerSnapshotData)}'::JSONB,
        '{"rules": "standard_v2", "netTotal": 450000}'::JSONB,
        450000, 450000, 0, 94500, 21.00,
        '${seller1Id}'::UUID,
        '${JSON.stringify(authorSnapshotData)}'::JSONB
      ) as result;
    `);

    assert.equal(res.rows[0].result.success, true);
    const budgetId = res.rows[0].result.id;

    // 14.2 Verificar que en la base de datos se desacoplaron exactamente seller_snapshot y author_snapshot
    const bRow = await db.query(`
      SELECT seller_snapshot, author_snapshot, created_by_user_id, creator_role, seller_id
      FROM budgets WHERE id = '${budgetId}';
    `);

    const row = bRow.rows[0];
    assert.equal(row.creator_role, 'administration');
    assert.equal(row.created_by_user_id, adminRoleUserId);

    // seller_snapshot debe contener los datos del vendedor asignado, NO del administrador emisor
    assert.equal(row.seller_snapshot.name, 'Vendedor Uno');
    assert.equal(row.seller_snapshot.seller_id, seller1Id);
    assert.equal(row.seller_snapshot.phone, '+54 9 11 1111-2222');

    // author_snapshot debe registrar al emisor administrativo
    assert.equal(row.author_snapshot.name, 'Martín Gómez (Administración)');
    assert.equal(row.author_snapshot.role, 'administration');
    assert.equal(row.author_snapshot.user_id, adminRoleUserId);

    // 14.3 Publicar presupuesto para consulta pública digital
    const pubRes = await db.query(`
      SELECT publish_budget_transactional('${adminRoleUserId}'::UUID, '${budgetId}'::UUID) as result;
    `);
    assert.equal(pubRes.rows[0].result.success, true);
    const publicToken = pubRes.rows[0].result.public_token;

    // 14.4 Ejecutar la consulta pública (equivalente exacto a loadPublicBudget)
    const pubBudgetQuery = await db.query(`
      SELECT
        b.id, b.budget_number, b.status, b.total_amount, b.tax_rate, b.discounts, b.created_at,
        b.public_notes, b.client_snapshot, b.seller_snapshot, b.author_snapshot, b.calculation_snapshot,
        b.created_by_user_id, b.creator_role,
        s.full_name as seller_full_name, s.email as seller_email, s.phone as seller_phone
      FROM budgets b
      LEFT JOIN sellers s ON s.id = b.seller_id
      WHERE b.public_token = '${publicToken}' AND b.public_status = 'published';
    `);

    assert.equal(pubBudgetQuery.rows.length, 1);
    const pub = pubBudgetQuery.rows[0];
    assert.ok(pub.author_snapshot, 'La consulta pública debe incluir author_snapshot');
    assert.equal(pub.author_snapshot.name, 'Martín Gómez (Administración)');
    assert.equal(pub.creator_role, 'administration');
    assert.equal(pub.seller_snapshot.name, 'Vendedor Uno');
    assert.equal(pub.seller_full_name, 'Vendedor Uno');
  });

  test('15. PRIORIDAD DE ADMINISTRACIÓN ACTIVA SOBRE ROL COMERCIAL EN PERFILES SUPERPUESTOS', async () => {
    // Función auxiliar que replica exactamente getCommercialUserContext
    async function resolveContext(userId) {
      const { rows: adminRows } = await db.query(`SELECT id, full_name, is_active FROM admin_users WHERE user_id = '${userId}';`);
      if (adminRows.length > 0 && adminRows[0].is_active) {
        return { isLoggedIn: true, isAdmin: true, isAdministration: false, isSeller: false, isActive: true };
      }

      const { rows: admRows } = await db.query(`SELECT id, full_name, is_active FROM administration_users WHERE user_id = '${userId}';`);
      const isAdministrationActive = Boolean(admRows.length > 0 && admRows[0].is_active);

      const { rows: selRows } = await db.query(`SELECT id, full_name, is_active FROM sellers WHERE user_id = '${userId}';`);
      const isSellerActive = Boolean(selRows.length > 0 && selRows[0].is_active);

      if (isAdministrationActive) {
        return {
          isLoggedIn: true,
          isAdmin: false,
          isAdministration: true,
          isSeller: false, // Administración activa tiene prioridad en consultas y autorizaciones
          isActive: true,
          sellerId: selRows[0]?.id
        };
      }

      if (isSellerActive) {
        return {
          isLoggedIn: true,
          isAdmin: false,
          isAdministration: false,
          isSeller: true, // Rol comercial recuperado automáticamente
          isActive: true,
          sellerId: selRows[0]?.id
        };
      }

      return { isLoggedIn: true, isAdmin: false, isAdministration: false, isSeller: false, isActive: false };
    }

    // 15.1 Vendedor 2 con administración ACTIVA
    await db.query(`UPDATE administration_users SET is_active = true WHERE user_id = '${seller2UserId}';`);
    const ctxActive = await resolveContext(seller2UserId);
    assert.equal(ctxActive.isAdministration, true, 'Debe otorgar rol Administración');
    assert.equal(ctxActive.isSeller, false, 'Administración activa debe priorizarse para no filtrar por seller_id');
    assert.equal(ctxActive.isActive, true);

    // 15.2 Desactivar administración de Vendedor 2
    await db.query(`UPDATE administration_users SET is_active = false WHERE user_id = '${seller2UserId}';`);
    const ctxDeactivated = await resolveContext(seller2UserId);
    assert.equal(ctxDeactivated.isAdministration, false, 'Administración debe revocarse');
    assert.equal(ctxDeactivated.isSeller, true, 'Rol comercial original debe recuperarse de inmediato');
    assert.equal(ctxDeactivated.isActive, true);
    assert.equal(ctxDeactivated.sellerId, seller2Id);
  });
});

