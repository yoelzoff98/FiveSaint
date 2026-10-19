import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

test('Client confirmation requires administrative acceptance, notifies both roles, preserves history and permissions',async()=>{
 const db=new PGlite();
 try {
  await db.exec(fs.readFileSync('tests/fixtures/commercial-current-schema.sql','utf8'));
  for(const file of fs.readdirSync('supabase/migrations').filter(name=>name.endsWith('.sql')).sort()) await db.exec(fs.readFileSync(`supabase/migrations/${file}`,'utf8'));
  const ids=['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','cccccccc-cccc-cccc-cccc-cccccccccccc','dddddddd-dddd-dddd-dddd-dddddddddddd'];
  const [sellerUser,adminUser,staffUser,otherUser]=ids;
  for(const id of ids) await db.query('insert into auth.users(id) values($1)',[id]);
  const seller=(await db.query("insert into sellers(user_id,username,full_name,email) values($1,'seller1','Seller One','one@example.invalid') returning id",[sellerUser])).rows[0].id;
  await db.query("insert into sellers(user_id,username,full_name,email) values($1,'seller2','Seller Two','two@example.invalid')",[otherUser]);
  await db.query("insert into admin_users(user_id,username,full_name) values($1,'admin1','Admin One')",[adminUser]);
  await db.query("insert into administration_users(user_id,full_name,email) values($1,'Staff One','staff@example.invalid')",[staffUser]);
  const client=(await db.query("insert into clients(seller_id,name) values($1,'Synthetic Client') returning id",[seller])).rows[0].id;
  async function quote(){
   const budget=(await db.query("insert into budgets(client_id,seller_id,total_amount,subtotal_amount,tax_rate,tax_amount) values($1,$2,1000,1000,21,210) returning id",[client,seller])).rows[0].id;
   const item=(await db.query("insert into budget_items(budget_id,product_name,quantity,unit_price,total_price) values($1,'Synthetic bath',5,200,1000) returning id",[budget])).rows[0].id;
   return {budget,item,items:[{budgetItemId:item,quantity:2}]};
  }
  const submit=async(q,key,actor=sellerUser,hash='same')=>(await db.query("select submit_order_request($1,$2,$3::jsonb,null,$4,$5) result",[actor,q.budget,JSON.stringify(q.items),key,hash])).rows[0].result;
  const decide=async(request,decision='approved',actor=staffUser,reason=null)=>(await db.query('select decide_order_request($1,$2,$3,$4) result',[actor,request.request_id,decision,reason])).rows[0].result;
  const q=await quote();
  await assert.rejects(submit(q,'foreign',otherUser),/no autorizado/);
  const request=await submit(q,'first');
  assert.equal(request.request_status,'pending');
  assert.equal(Number((await db.query('select count(*) c from orders')).rows[0].c),0);
  assert.equal((await db.query('select converted_quantity from budget_items where id=$1',[q.item])).rows[0].converted_quantity,0);
  assert.deepEqual(await submit(q,'first'),request);
  await assert.rejects(submit(q,'first',sellerUser,'changed'),/idempotencia/);
  const notices=(await db.query('select recipient_user_id from order_request_notifications where request_id=$1',[request.request_id])).rows.map(row=>row.recipient_user_id).sort();
  assert.deepEqual(notices,[adminUser,staffUser].sort());
  await assert.rejects(decide(request,'approved',sellerUser),/ACCESO DENEGADO/);
  await assert.rejects(db.query("select convert_budget_transactional($1,$2,$3::jsonb,'direct',null,'bypass','bypass',null,null,null)",[sellerUser,q.budget,JSON.stringify(q.items)]),/solicitud pendiente|solicitud para/);
  const accepted=await decide(request);
  assert.ok(accepted.order_id);
  assert.equal((await decide(request,'approved',adminUser)).order_id,accepted.order_id);
  await assert.rejects(decide(request,'rejected',adminUser,'No corresponde'),/ya fue resuelta/);
  const order=(await db.query('select * from orders where id=$1',[accepted.order_id])).rows[0];
  assert.equal(order.commercial_approval_status,'approved');assert.equal(order.accepted_by,staffUser);
  assert.equal(order.accepted_request_id,request.request_id);
  assert.equal(Number((await db.query('select count(*) c from orders')).rows[0].c),1);
  assert.equal(Number((await db.query("select count(*) c from order_request_notifications where request_id=$1 and event='submitted' and not is_read",[request.request_id])).rows[0].c),0);
  assert.equal(Number((await db.query("select count(*) c from order_request_notifications where recipient_user_id=$1 and event='approved'",[sellerUser])).rows[0].c),1);
  const returnedQuote=await quote();const returned=await submit(returnedQuote,'return');
  await assert.rejects(decide(returned,'returned',adminUser,'x'),/motivo/);
  await decide(returned,'returned',adminUser,'Corregir cantidades');
  const next=await submit(returnedQuote,'resubmitted');assert.notEqual(next.request_id,returned.request_id);
  await decide(next,'rejected',staffUser,'Cliente desistió');
  assert.equal((await db.query('select converted_quantity from budget_items where id=$1',[returnedQuote.item])).rows[0].converted_quantity,0);
  const staleQuote=await quote();const stale=await submit(staleQuote,'stale');
  await db.query('update budgets set total_amount=900 where id=$1',[staleQuote.budget]);
  await assert.rejects(decide(stale),/presupuesto cambió/);
  assert.equal((await db.query('select status from order_requests where id=$1',[stale.request_id])).rows[0].status,'pending');
  for(const role of ['anon','authenticated']){
   await db.exec(`set role ${role}`);
   await assert.rejects(submit(q,'blocked'),/permission denied/);
   await assert.rejects(decide(request),/permission denied/);
   await db.exec('reset role');
  }
  await db.exec('grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;');
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[sellerUser]);
  assert.ok((await db.query('select * from order_request_notifications')).rows.every(row=>row.recipient_user_id===sellerUser));
  await db.exec('reset role');
 } finally{await db.close();}
});
