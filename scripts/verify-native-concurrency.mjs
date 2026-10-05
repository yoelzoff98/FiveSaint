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
  await setup.query(fs.readFileSync('supabase/migrations/20261005000100_sprint_seller_closing_flow.sql', 'utf8'));

  const privileges = await setup.query(`select bool_and(
    not has_function_privilege('anon', p.oid, 'EXECUTE') and
    not has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) secured from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('create_budget_transactional',
    'convert_budget_transactional', 'cancel_order_transactional',
    'publish_budget_transactional', 'revoke_budget_transactional', 'increment_budget_view',
    'record_budget_shipment_transactional', 'reopen_budget_transactional', 'reject_budget_transactional')`);
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

  // PRUEBA DE CONCURRENCIA INDEPENDIENTE: CONVERSIÓN VS RECHAZO
  // Sesión A intenta convertir 2 unidades mientras Sesión B intenta rechazar el presupuesto simultáneamente
  const raceBudgetRes = await create(setup, 'race-budget', 'race-hash');
  const raceBudgetId = raceBudgetRes.rows[0].result.id;
  const raceItemId = (await setup.query('select id from budget_items where budget_id=$1', [raceBudgetId])).rows[0].id;

  const raceOps = await Promise.allSettled([
    a.query(`select convert_budget_transactional($1, $2, $3::jsonb, 'direct', null, 'race-conv-key', 'race-conv-hash') result`,
      [user, raceBudgetId, JSON.stringify([{ budgetItemId: raceItemId, quantity: 2 }])]),
    b.query(`select reject_budget_transactional($1, $2, 'Cliente desistió') result`,
      [user, raceBudgetId])
  ]);

  // Una de las dos operaciones debe ganar limpiamente; la otra debe ser rechazada sin deadlocks ni estados corruptos
  const raceSuccesses = raceOps.filter(r => r.status === 'fulfilled');
  const raceFailures = raceOps.filter(r => r.status === 'rejected');
  assert.equal(raceSuccesses.length, 1, 'Exactamente una operación debe ganar el bloqueo transaccional');
  assert.equal(raceFailures.length, 1, 'La operación perdedora debe fallar por validación de estado o pedidos activos');
  console.log('Independent session race result:', raceSuccesses[0].value.rows[0].result.status || 'converted',
    '| Rejection/Conversion error caught:', raceFailures[0].reason.message);

  // PRUEBA DE SEPARACIÓN: PUBLICACIÓN DIGITAL VS REGISTRO DE ENVÍO
  const pubBudgetRes = await create(setup, 'pub-budget', 'pub-hash');
  const pubBudgetId = pubBudgetRes.rows[0].result.id;

  // 1. Publicar no debe cambiar status a 'sent' ni completar sent_at
  const pubResult = (await a.query('select publish_budget_transactional($1, $2) result', [user, pubBudgetId])).rows[0].result;
  assert.equal(pubResult.public_status, 'published');
  const pubCheck = (await setup.query('select status, sent_at, first_sent_at, last_sent_at from budgets where id=$1', [pubBudgetId])).rows[0];
  assert.equal(pubCheck.status, 'draft', 'Publicar no debe marcar el presupuesto como enviado');
  assert.equal(pubCheck.sent_at, null, 'Publicar no debe establecer fecha de envío');

  // 2. Registrar primer envío (WhatsApp)
  const shipTime1 = '2026-10-05T09:00:00Z';
  await a.query('select record_budget_shipment_transactional($1, $2, $3, $4::timestamptz, $5) result',
    [user, pubBudgetId, 'whatsapp', shipTime1, 'Primer contacto']);
  const shipCheck1 = (await setup.query('select status, sent_via, sent_at, first_sent_via, first_sent_at, last_sent_via, last_sent_at from budgets where id=$1', [pubBudgetId])).rows[0];
  assert.equal(shipCheck1.status, 'sent');
  assert.equal(shipCheck1.sent_via, 'whatsapp');
  assert.equal(shipCheck1.first_sent_via, 'whatsapp');
  assert.equal(shipCheck1.last_sent_via, 'whatsapp');

  // 3. Registrar segundo envío (Email) desde otra sesión independiente: debe conservar first_sent_* y actualizar last_sent_*
  const shipTime2 = '2026-10-05T14:30:00Z';
  await b.query('select record_budget_shipment_transactional($1, $2, $3, $4::timestamptz, $5) result',
    [user, pubBudgetId, 'email', shipTime2, 'Reenvío por correo']);
  const shipCheck2 = (await setup.query('select sent_via, sent_at, first_sent_via, first_sent_at, last_sent_via, last_sent_at from budgets where id=$1', [pubBudgetId])).rows[0];
  assert.equal(shipCheck2.first_sent_via, 'whatsapp', 'El primer envío debe permanecer intacto');
  assert.equal(shipCheck2.last_sent_via, 'email', 'El último envío debe actualizarse al nuevo medio');
  assert.equal(shipCheck2.first_sent_at.toISOString(), new Date(shipTime1).toISOString());
  assert.equal(shipCheck2.last_sent_at.toISOString(), new Date(shipTime2).toISOString());

  // COMPATIBILIDAD RETROSPECTIVA: LLAMADA LEGACY DE 7 PARÁMETROS SIN DISTRIBUIDOR
  const legacyIssued = await setup.query(`select create_budget_transactional($1,$2,$3::jsonb,
    '[35,10,10]'::jsonb,null,null,'legacy-key','legacy-hash','{}','{}','{}',249.77,474.41,224.64,52.45,21,$4) result`,
    [user,customer,JSON.stringify([{productName:'First',quantity:3,unitPrice:100.01}, {productName:'Second',quantity:2,unitPrice:87.19}]),seller]);
  const legacyId = legacyIssued.rows[0].result.id;
  const legacyLines = (await setup.query('select id, quantity from budget_items where budget_id=$1 order by id', [legacyId])).rows;
  const legacyPartial = [{budgetItemId:legacyLines[0].id,quantity:1}];

  // Conversión con signatura legacy (7 parámetros, sin pasar distribuidor ID)
  const legacyDistOrder = await setup.query(`select convert_budget_transactional($1,$2,$3::jsonb,'distributor',null,$4,$4) result`,
    [user, legacyId, JSON.stringify(legacyPartial), 'legacy-conv-key']);
  assert.equal(legacyDistOrder.rows[0].result.success, true);
  assert.equal(legacyDistOrder.rows[0].result.distributor_name, 'Distribuidor no registrado');
  assert.equal(legacyDistOrder.rows[0].result.sale_channel, 'distributor');

  const legacyRemaining = legacyLines.map((line,index)=>({budgetItemId:line.id,quantity:line.quantity-(index===0?1:0)}));
  const directOrder = await setup.query(`select convert_budget_transactional($1,$2,$3::jsonb,'direct',null,$4,$4) result`,
    [user, legacyId, JSON.stringify(legacyRemaining), 'legacy-direct-key']);
  assert.equal(directOrder.rows[0].result.success, true);
  assert.equal(directOrder.rows[0].result.sale_channel, 'direct');

  // Cancelación
  await setup.query('select cancel_order_transactional($1,$2,null,$3,$3)', [user, legacyDistOrder.rows[0].result.order_id, 'cancel-distributor']);
  assert.equal((await setup.query('select status from orders where id=$1', [legacyDistOrder.rows[0].result.order_id])).rows[0].status,'cancelled');

  // Vistas públicas
  await setup.query('set role anon');
  await assert.rejects(create(setup,'anonymous'),/permission denied/);
  await setup.query('reset role');
  await setup.query('select publish_budget_transactional($1,$2)', [user, budget]);
  await Promise.all([a.query('select increment_budget_view($1)', [budget]), b.query('select increment_budget_view($1)', [budget])]);
  const views = await setup.query('select view_count, last_viewed_at from budgets where id=$1', [budget]);
  assert.equal(views.rows[0].view_count, 1);
  await a.query('select increment_budget_view($1)', [budget]);
  assert.equal((await setup.query('select last_viewed_at from budgets where id=$1', [budget])).rows[0].last_viewed_at.getTime(), views.rows[0].last_viewed_at.getTime());
  await setup.query('select revoke_budget_transactional($1,$2)', [user,budget]);
  assert.equal((await setup.query('select increment_budget_view($1) result', [budget])).rows[0].result.success,false);

  console.log('PASS: independent PostgreSQL sessions: concurrent conversion vs rejection, publishing vs shipment separation, multiple shipment coherence, legacy 7-param compatibility, competing balances, cancel locks.');
} finally {
  await Promise.all(clients.map(c=>c.end()));
  await server.stop();
  const target = path.resolve(dir);
  assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
  assert.ok(path.basename(target).startsWith('fivesaint-pg-'));
  await fs.promises.rm(target, { recursive: true, force: true, maxRetries: 20, retryDelay: 200 });
}
