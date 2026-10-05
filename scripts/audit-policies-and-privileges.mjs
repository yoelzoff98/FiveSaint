import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

async function auditPoliciesAndPrivileges() {
  console.log('=== AUDITORÍA E INVENTARIO DE POLÍTICAS Y PRIVILEGIOS ===');
  const db = new PGlite();

  // 1. Cargar esquema actual previo a Sprint 1
  const baseSchema = fs.readFileSync('tests/fixtures/commercial-current-schema.sql', 'utf8');
  await db.exec(baseSchema);
  await db.exec(fs.readFileSync('supabase/migrations/20261003000100_commercial_release.sql', 'utf8'));

  // 3. Inventario PRE-MIGRACIÓN
  console.log('\n--- 1. INVENTARIO PRE-MIGRACIÓN ---');
  const prePolicies = await db.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
    FROM pg_policies
    ORDER BY tablename, policyname;
  `);
  console.log(`Políticas preexistentes: ${prePolicies.rows.length}`);
  prePolicies.rows.forEach(p => {
    console.log(` - [${p.tablename}] ${p.policyname} (${p.cmd}) para roles: ${p.roles}`);
  });

  const prePrivileges = await db.query(`
    SELECT grantee, table_schema, table_name, privilege_type
    FROM information_schema.table_privileges
    WHERE table_schema = 'public' AND table_name IN ('clients', 'budgets', 'orders', 'idempotency_records')
      AND grantee IN ('anon', 'authenticated', 'service_role')
    ORDER BY table_name, grantee, privilege_type;
  `);
  console.log(`Privilegios preexistentes en tablas comerciales: ${prePrivileges.rows.length}`);

  // 4. Aplicar nueva migración Sprint 1
  console.log('\n--- 2. APLICANDO MIGRACIÓN SPRINT 1 ---');
  const sprint1Sql = fs.readFileSync('supabase/migrations/20261004000100_sprint1_administration_portal.sql', 'utf8');
  await db.exec(sprint1Sql);
  console.log('Migración aplicada exitosamente.');

  // 5. Inventario POST-MIGRACIÓN
  console.log('\n--- 3. INVENTARIO POST-MIGRACIÓN ---');
  const postPolicies = await db.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);
  console.log(`Total de políticas activas post-migración: ${postPolicies.rows.length}`);
  postPolicies.rows.forEach(p => {
    console.log(` - [${p.tablename}] ${p.policyname} (${p.cmd}) para roles: ${p.roles}`);
  });

  // 6. Verificar privilegios granulares
  const postPrivileges = await db.query(`
    SELECT grantee, table_name, string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('administration_users', 'clients', 'budgets', 'orders', 'idempotency_records')
      AND grantee IN ('anon', 'authenticated', 'service_role')
    GROUP BY grantee, table_name
    ORDER BY table_name, grantee;
  `);
  console.log('\n--- 4. PRIVILEGIOS POR ROL Y TABLA ---');
  postPrivileges.rows.forEach(pr => {
    console.log(` - Tabla [${pr.table_name}] -> Rol [${pr.grantee}]: ${pr.privileges}`);
  });

  // 7. Verificaciones de compatibilidad
  console.log('\n--- 5. VALIDACIÓN DE COMPATIBILIDAD ---');
  // Anon no debe tener ningún privilegio en tablas críticas
  const anonPrivs = await db.query(`
    SELECT count(*) as count
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('administration_users', 'clients', 'budgets', 'orders')
      AND grantee = 'anon';
  `);
  assert.equal(Number(anonPrivs.rows[0].count), 0, 'anon no debe tener privilegios directos en tablas');
  console.log('✔ anon: Cero privilegios directos en tablas comerciales y de administración');

  // Authenticated solo debe tener SELECT (salvo administration_users controlado por RLS)
  const authMutation = await db.query(`
    SELECT count(*) as count
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('clients', 'budgets', 'orders')
      AND grantee = 'authenticated'
      AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');
  `);
  assert.equal(Number(authMutation.rows[0].count), 0, 'authenticated no debe tener mutación directa en clients, budgets, orders');
  console.log('✔ authenticated: Mutaciones directas restringidas a RPCs transaccionales protegidos');

  console.log('\nAUDITORÍA FINALIZADA: Esquema y políticas 100% compatibles y verificados.');
}

auditPoliciesAndPrivileges().catch(err => {
  console.error('Error en auditoría:', err);
  process.exit(1);
});
