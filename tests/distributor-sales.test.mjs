import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AppRouterContext} from 'next/dist/shared/lib/app-router-context.shared-runtime.js';
import {projectDistributorSales,legacyDistributorAmount} from '../src/lib/distributor-sales.ts';
import {OrdersListClient} from '../src/app/admin-comercial/pedidos/OrdersListClient.tsx';
import {DashboardClient} from '../src/app/admin-comercial/dashboard/DashboardClient.tsx';
import {SellerPerformanceClient} from '../src/app/admin-comercial/vendedores/[id]/SellerPerformanceClient.tsx';

const budget={id:'budget',budget_number:54,status:'draft',total_amount:999999,created_at:'2026-08-01T12:00:00Z',client_id:'client',clients:{name:'Synthetic client',company_name:null},sellers:{full_name:'Synthetic seller'},orders:[]};
const note=(amount='989.767,35',date='2026-08-28T14:13:05Z')=>({id:date,budget_id:budget.id,client_id:'client',order_id:null,created_at:date,content:`Se registró la venta por distribuidor desde el presupuesto N° 54 por un monto total de $\u00a0${amount}.`,budgets:budget});
const order=(id,amount)=>({id,budget_id:'budget',client_id:'client',order_number:25,status:'completed',sale_channel:'distributor',order_type:'distributor_sale',total_amount:amount,created_at:'2026-10-19T12:00:00Z',clients:budget.clients,sellers:budget.sellers});

test('Legacy closure uses the recorded amount and first date, deduplicating repeated confirmations across months',()=>{
 const result=projectDistributorSales([],[note(),note('989.767,35','2026-09-03T12:00:00Z')]);
 assert.equal(result.data.length,1);assert.equal(result.data[0].total_amount,989767.35);
 assert.equal(result.data[0].created_at,'2026-08-28T14:13:05Z');assert.equal(result.issues.length,0);
 assert.equal(legacyDistributorAmount('Texto libre $ 999,00',54),null);
 assert.equal(legacyDistributorAmount(note().content,55),null);
});

test('Two partial distributor orders use their own amounts once, without adding the full original budget or a duplicate note',()=>{
 const result=projectDistributorSales([order('one',100.01),order('two',50.02)],[note()],[{...budget,status:'distributor_sale'}]);
 assert.equal(result.data.length,2);
 assert.equal(result.data.reduce((sum,s)=>sum+Math.round(s.total_amount*100),0),15003);
});

test('Cancelled operations do not reappear through old budgets or notes; conflicting/direct histories require review',()=>{
 assert.equal(projectDistributorSales([{...order('cancelled',100),status:'cancelled'}],[note()],[{...budget,status:'distributor_sale'}]).data.length,0);
 const direct=projectDistributorSales([],[{...note(),budgets:{...budget,orders:[{id:'factory',status:'delivered'}]}}]);
 assert.equal(direct.data.length,0);assert.deepEqual(direct.issues,['budget']);
 const inconsistent=projectDistributorSales([],[note(),note('100,00','2026-09-03T12:00:00Z')]);
 assert.equal(inconsistent.data.length,0);assert.deepEqual(inconsistent.issues,['budget']);
});

test('Sales screen displays canonical distributor rows, count and matching subtotal even when absent from the factory page',()=>{
 const data=projectDistributorSales([order('one',100.01),{...order('two',50.02),order_number:26}],[]).data;
 const html=renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:{}},React.createElement(OrdersListClient,{
  initialOrders:[],initialDistributorSales:data,initialSaleChannel:'distributor',isAdmin:true,ordersBasePath:'/administracion/pedidos',budgetsBasePath:'/administracion/presupuestos'
 })));
 assert.ok(html.includes('Vendido por Distribuidor (2)'));assert.ok(html.includes('150,03'));
 assert.ok(html.includes('/administracion/pedidos/one'));assert.ok(html.includes('/administracion/pedidos/two'));
 assert.ok(html.includes('#25'));assert.ok(html.includes('#26'));
});

test('Latest transactional closing records a distributor sale atomically and retries do not duplicate it',async()=>{
 const db=new PGlite();
 try {
  await db.exec(fs.readFileSync('tests/fixtures/commercial-current-schema.sql','utf8'));
  for(const file of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(`supabase/migrations/${file}`,'utf8'));
  const user='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';await db.query('insert into auth.users(id) values($1)',[user]);
  const seller=(await db.query("insert into sellers(user_id,username,full_name,email) values($1,'dist-test','Seller','seller@example.invalid') returning id",[user])).rows[0].id;
  const client=(await db.query("insert into clients(seller_id,name) values($1,'Synthetic client') returning id",[seller])).rows[0].id;
  const b=(await db.query('insert into budgets(client_id,seller_id,total_amount,subtotal_amount,tax_rate,tax_amount) values($1,$2,1000,1000,0,0) returning id',[client,seller])).rows[0].id;
  const item=(await db.query("insert into budget_items(budget_id,product_name,quantity,unit_price,total_price) values($1,'Bath',5,200,1000) returning id",[b])).rows[0].id;
  const args=[user,b,JSON.stringify([{budgetItemId:item,quantity:2}])];
  const run=async()=>(await db.query("select convert_budget_transactional($1,$2,$3::jsonb,'distributor',null,'same-key','same-hash',null,'2026-10-19',null) result",args)).rows[0].result;
  const first=await run();const retry=await run();assert.equal(first.order_id,retry.order_id);
  const orders=(await db.query('select * from orders')).rows;assert.equal(orders.length,1);assert.equal(orders[0].sale_channel,'distributor');
  assert.equal(orders[0].order_type,'distributor_sale');assert.equal(orders[0].status,'completed');assert.equal(Number(orders[0].total_amount),400);
  assert.equal((await db.query('select status from budgets where id=$1',[b])).rows[0].status,'partially_converted');
  assert.equal(Number((await db.query('select count(*) c from manufacturing_orders')).rows[0].c),0);
 }finally{await db.close();}
});

test('Dashboard and seller performance use the same distributor operations rather than full quote amounts or client CRM status',()=>{
 const current=new Date().toISOString();
 const data=projectDistributorSales([{...order('one',100.01),created_at:current},{...order('two',50.02),created_at:current}],[]).data;
 const render=component=>renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:{}},component));
 const dashboard=render(React.createElement(DashboardClient,{initialClients:[],initialBudgets:[],initialOrders:[],initialDistributorSales:data,profileName:'Admin',isAdmin:true}));
 assert.ok(dashboard.includes('150,03'));
 const seller=render(React.createElement(SellerPerformanceClient,{seller:{id:'seller',username:'seller',full_name:'Synthetic seller',email:'seller@example.invalid',is_active:true,created_at:current},budgets:[],orders:[],distributorSales:data}));
 assert.ok(seller.includes('150,03'));assert.ok(seller.includes('2 venta(s) concretada(s)'));
});
