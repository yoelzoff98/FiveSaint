import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import { Client } from 'pg';

// Local cluster only. Never reads application environment or Supabase credentials.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fivesaint-pg-'));
const server = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'local-test-only', port: 55439, persistent: true, onLog: () => {}, onError: () => {} });
const clients = [];
try {
  await server.initialise();
  await server.start();
  for (let i = 0; i < 3; i++) {
    const c = new Client({ host: '127.0.0.1', port: 55439, user: 'postgres', password: 'local-test-only', database: 'postgres' });
    await c.connect(); clients.push(c);
  }
  const [setup, a, b] = clients;
  const pids = await Promise.all([a.query('select pg_backend_pid() pid'), b.query('select pg_backend_pid() pid')]);
  assert.notEqual(pids[0].rows[0].pid, pids[1].rows[0].pid);
  console.log('Independent PostgreSQL sessions:', pids.map(r => r.rows[0].pid).join(', '));
  const base = fs.readFileSync('tests/fixtures/commercial-current-schema.sql', 'utf8');
  await setup.query(base);
  await setup.query(fs.readFileSync('supabase/archive/20261002_commercial_stabilization_v2.sql', 'utf8'));
  await setup.query(fs.readFileSync('supabase/migrations/20261003000100_commercial_release.sql', 'utf8'));
  await setup.query(fs.readFileSync('supabase/migrations/20261004000100_sprint1_administration_portal.sql', 'utf8'));
  const privileges = await setup.query(`select bool_and(
    not has_function_privilege('anon', p.oid, 'EXECUTE') and
    not has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) secured from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('create_budget_transactional',
    'convert_budget_transactional', 'cancel_order_transactional',
    'publish_budget_transactional', 'revoke_budget_transactional', 'increment_budget_view')`);
  assert.equal(privileges.rows[0].secured, true);
  const user = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const seller = '22222222-2222-2222-2222-222222222221';
  const customer = '33333333-3333-3333-3333-333333333331';
  await setup.query('insert into auth.users(id) values($1)', [user]);
  await setup.query('insert into sellers(id,user_id,username,full_name,email) values($1,$2,$3,$3,$4)', [seller,user,'local','local@example.invalid']);
  await setup.query("insert into clients(id,name,seller_id,status) values($1,$2,$3,'nuevo')", [customer,'Synthetic test',seller]);
  const create = (c,key,hash='same') => c.query(`select create_budget_transactional($1,$2,$3::jsonb,'[]'::jsonb,null,null,$4,$5,'{}','{}','{}',500,500,0,105,21,$6) result`, [user,customer,JSON.stringify([{productName:'Synthetic',quantity:5,unitPrice:100}]),key,hash,seller]);
  // Hold the winner open so the other connection really encounters its uncommitted key.
  await a.query('begin');
  const first = await create(a,'same');
  let resolved = false;
  const waiting = create(b,'same').then(r => { resolved = true; return r; });
  await new Promise(r => setTimeout(r,150));
  assert.equal(resolved,false);
  await a.query('commit');
  assert.equal((await waiting).rows[0].result.id, first.rows[0].result.id);
  assert.equal(Number((await setup.query("select count(*) from budgets where idempotency_key='same'")).rows[0].count),1);
  await assert.rejects(create(b,'same','different'), /Conflicto de idempotencia/);
  const budget = first.rows[0].result.id;
  const item = (await setup.query('select id from budget_items where budget_id=$1',[budget])).rows[0].id;
  const convert = (c,key,qty) => c.query(`select convert_budget_transactional($1,$2,$3::jsonb,'direct',null,$4,$4) result`,[user,budget,JSON.stringify([{budgetItemId:item,quantity:qty}]),key]);
  const results = await Promise.allSettled([convert(a,'convert-a',4),convert(b,'convert-b',3)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.match(results.find(r=>r.status==='rejected').reason.message,/Saldo insuficiente/);
  const winning = results.find(r=>r.status==='fulfilled').value.rows[0].result;
  const qty = (await setup.query('select converted_quantity from budget_items where id=$1',[item])).rows[0].converted_quantity;
  assert.ok(qty===3 || qty===4);
  await Promise.all([a.query("set statement_timeout='5s'"), b.query("set statement_timeout='5s'")]);
  const simultaneous = await Promise.allSettled([
    a.query('select cancel_order_transactional($1,$2,null,$3,$3)', [user, winning.order_id, 'cancel-and-convert']),
    convert(b, 'convert-during-cancel', 1),
  ]);
  for (const result of simultaneous) {
    assert.equal(result.status, 'fulfilled', result.status === 'rejected' ? result.reason.message : '');
  }
  assert.equal((await setup.query('select converted_quantity from budget_items where id=$1', [item])).rows[0].converted_quantity, 1);
  const issued = await setup.query(`select create_budget_transactional($1,$2,$3::jsonb,
    '[35,10,10]'::jsonb,null,null,'rounding','rounding','{}','{}','{}',249.77,474.41,224.64,52.45,21,$4) result`,
    [user,customer,JSON.stringify([{productName:'First',quantity:3,unitPrice:100.01}, {productName:'Second',quantity:2,unitPrice:87.19}]),seller]);
  const issuedId = issued.rows[0].result.id;
  assert.deepEqual((await setup.query('select discounts from budgets where id=$1', [issuedId])).rows[0].discounts.map(Number), [35,10,10]);
  const lines = (await setup.query('select id, quantity from budget_items where budget_id=$1 order by id', [issuedId])).rows;
  const firstPartial = [{budgetItemId:lines[0].id,quantity:1}];
  const remaining = lines.map((line,index)=>({budgetItemId:line.id,quantity:line.quantity-(index===0?1:0)}));
  const convertIssued = (key,selected,channel='direct') => setup.query(`select convert_budget_transactional($1,$2,$3::jsonb,$4,null,$5,$5) result`, [user,issuedId,JSON.stringify(selected),channel,key]);
  await convertIssued('rounding-first',firstPartial);
  const distributorOrder = await convertIssued('rounding-rest',remaining,'distributor');
  assert.equal((await setup.query('select status from budgets where id=$1', [issuedId])).rows[0].status,'distributor_sale');
  assert.equal((await setup.query('select status from orders where id=$1', [distributorOrder.rows[0].result.order_id])).rows[0].status,'completed');
  assert.equal(Number((await setup.query('select sum(total_amount) amount from orders where budget_id=$1', [issuedId])).rows[0].amount),249.77);
  await setup.query('select cancel_order_transactional($1,$2,null,$3,$3)', [user, distributorOrder.rows[0].result.order_id, 'cancel-distributor']);
  assert.equal((await setup.query('select status from orders where id=$1', [distributorOrder.rows[0].result.order_id])).rows[0].status,'cancelled');
  await setup.query('set role anon');
  await assert.rejects(create(setup,'anonymous'),/permission denied/);
  await setup.query('reset role');
  const publication = (await setup.query('select publish_budget_transactional($1,$2) result', [user,budget])).rows[0].result;
  assert.notEqual(publication.public_token, budget);
  await Promise.all([a.query('select increment_budget_view($1)', [budget]), b.query('select increment_budget_view($1)', [budget])]);
  const views = await setup.query('select view_count, last_viewed_at from budgets where id=$1', [budget]);
  assert.equal(views.rows[0].view_count, 1);
  await a.query('select increment_budget_view($1)', [budget]);
  assert.equal((await setup.query('select last_viewed_at from budgets where id=$1', [budget])).rows[0].last_viewed_at.getTime(), views.rows[0].last_viewed_at.getTime());
  await setup.query('select revoke_budget_transactional($1,$2)', [user,budget]);
  assert.equal((await setup.query('select increment_budget_view($1) result', [budget])).rows[0].result.success,false);
  console.log('PASS: uncommitted conflict, same result, hash conflict, competing balances, cancellation/conversion locks, concurrent views, anonymous RPC denial.');
  console.log('Committed order:', winning.order_number, 'converted units:',qty);
} finally {
  await Promise.all(clients.map(c=>c.end()));
  await server.stop();
  // Verify the generated temporary target before recursively removing it.
  const target = path.resolve(dir);
  assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
  assert.ok(path.basename(target).startsWith('fivesaint-pg-'));
  await fs.promises.rm(target, { recursive: true, force: true, maxRetries: 20, retryDelay: 200 });
}
