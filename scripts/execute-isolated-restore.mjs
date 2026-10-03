import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// Offline only: no application environment, credentials, or production connections.
const order = ['admin_users','sellers','distributors','product_categories','products',
  'product_variants','clients','budgets','budget_items','orders','order_items','client_notes'];
const name = fs.readdirSync('backups').filter(file => /^commercial_backup_.*\.json$/.test(file)).sort().at(-1);
assert.ok(name, 'No commercial backup found');
const backup = JSON.parse(fs.readFileSync(path.join('backups', name), 'utf8'));
const db = new PGlite();
try {
  await db.exec(fs.readFileSync('tests/fixtures/commercial-current-schema.sql', 'utf8'));
  // Only auth IDs are stubbed to satisfy the supplied public-schema foreign keys.
  const identities = new Set(['admin_users','sellers','distributors'].flatMap(table =>
    (backup.tables[table] || []).map(row => row.user_id)));
  for (const id of identities) await db.query('insert into auth.users(id) values($1)', [id]);
  const before = {};
  for (const table of order) {
    const rows = backup.tables[table] || [];
    // jsonb_populate_recordset preserves native numeric[]/text[] types and all fields.
    if (rows.length) await db.query(`insert into public.${table}
      select * from jsonb_populate_recordset(null::public.${table}, $1::jsonb)`, [JSON.stringify(rows)]);
    const restored = await db.query(`select to_jsonb(t) document from public.${table} t order by id`);
    assert.equal(restored.rows.length, rows.length, `${table}: restored count mismatch`);
    before[table] = restored.rows.map(row => row.document);
  }
  const migration = fs.readFileSync('supabase/migrations/20261003000100_commercial_release.sql', 'utf8');
  await db.exec(migration);
  await db.exec(migration);
  for (const table of order) {
    const after = (await db.query(`select to_jsonb(t) document from public.${table} t order by id`)).rows.map(row => row.document);
    assert.equal(after.length, before[table].length);
    after.forEach((row, index) => {
      const original = before[table][index];
      const retained = Object.fromEntries(Object.keys(original).map(key => [key, row[key]]));
      assert.deepEqual(retained, original, `${table}: historical fields changed`);
    });
  }
  await db.exec(`select setval('budgets_budget_number_seq', coalesce((select max(budget_number) from budgets),0)+1, false);
    select setval('orders_order_number_seq', coalesce((select max(order_number) from orders),0)+1, false);`);
  const client = backup.tables.clients[0];
  const nextBudget = (await db.query(`insert into budgets(client_id, seller_id, total_amount)
    values($1,$2,100) returning id,budget_number`, [client.id, client.seller_id])).rows[0];
  const nextOrder = (await db.query(`insert into orders(client_id,seller_id,budget_id,total_amount)
    values($1,$2,$3,100) returning order_number`, [client.id, client.seller_id, nextBudget.id])).rows[0];
  assert.ok(nextBudget.budget_number > Math.max(...backup.tables.budgets.map(row=>row.budget_number)));
  assert.ok(nextOrder.order_number > Math.max(...backup.tables.orders.map(row=>row.order_number)));
  const summary = {
    schema: 'Supplied public schema, local auth ID stub; no policies or triggers supplied',
    restoredTables: Object.fromEntries(order.map(table=>[table,before[table].length])),
    migrationApplications: 2, originalFieldsPreserved: true,
    nextBudgetNumber: nextBudget.budget_number, nextOrderNumber: nextOrder.order_number,
  };
  fs.writeFileSync('backups/restore-summary.json', JSON.stringify(summary,null,2));
  console.log('PASS: every original field preserved across two migration applications, with actual supplied constraints and array types.');
  console.log('Restored:', before.budgets.length, 'budgets,', before.orders.length, 'orders,', order.length, 'tables.');
  console.log('New sequence numbers:', nextBudget.budget_number, nextOrder.order_number);
} finally {
  await db.close();
}
