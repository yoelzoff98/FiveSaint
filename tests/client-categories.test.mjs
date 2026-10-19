import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AppRouterContext} from 'next/dist/shared/lib/app-router-context.shared-runtime.js';
import {ClientsAdminClient} from '../src/app/administracion/clientes/ClientsAdminClient.tsx';
import {ClientCategorySchema} from '../src/lib/client-categories.ts';
import {AdminClientUpdateSchema} from '../src/lib/validations/admin-client.ts';
import {EditClientDialog} from '../src/components/administracion/EditClientDialog.tsx';

test('Client category migration preserves existing data and operations, defaults new clients, validates categories and can run twice',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`CREATE TABLE clients(id integer PRIMARY KEY,name text,phone text,created_at timestamptz DEFAULT now());
   CREATE TABLE budgets(id integer PRIMARY KEY,client_id integer REFERENCES clients(id),amount numeric);
   INSERT INTO clients(id,name,phone) VALUES(1,'Cliente histórico','1122334455');
   INSERT INTO budgets VALUES(1,1,123.45);`);
  const migration=readFileSync(new URL('../supabase/migrations/20261018000300_client_categories.sql',import.meta.url),'utf8');
  const original=(await db.query('SELECT * FROM clients')).rows;
  await db.exec(migration);
  assert.equal((await db.query('SELECT category FROM clients WHERE id=1')).rows[0].category,'consumidor_final');
  for(const category of ['arquitecto','distribuidor','constructor']) {
   await db.query('UPDATE clients SET category=$1 WHERE id=1',[category]);
   assert.equal((await db.query('SELECT count(*)::int AS n FROM clients WHERE category=$1',[category])).rows[0].n,1);
  }
  await assert.rejects(db.query("UPDATE clients SET category='otra' WHERE id=1"));
  await assert.rejects(db.query('UPDATE clients SET category=NULL WHERE id=1'));
  await db.exec(migration);
  assert.equal((await db.query('SELECT category FROM clients WHERE id=1')).rows[0].category,'constructor');
  assert.deepEqual((await db.query('SELECT id,name,phone,created_at FROM clients')).rows,original);
  assert.deepEqual((await db.query('SELECT * FROM budgets')).rows,[{id:1,client_id:1,amount:'123.45'}]);
  await db.exec("INSERT INTO clients(id,name) VALUES(2,'Cliente nuevo')");
  assert.equal((await db.query('SELECT category FROM clients WHERE id=2')).rows[0].category,'consumidor_final');
  assert.throws(()=>ClientCategorySchema.parse('otra'));
 }finally{await db.close();}
});

test('Administration displays category between client and contact and exposes the four category filters',()=>{
 const html=renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:{}},React.createElement(ClientsAdminClient,{
  initialClients:[{id:'client',name:'Cliente histórico',company_name:null,email:null,phone:'1122334455',address:null,notes:null,status:'nuevo',seller_id:null,category:'arquitecto'}],
  totalCount:1,serverPage:1,serverPageSize:20,serverTotalPages:1,sellers:[],isAdmin:true,initialCategory:'arquitecto'
 })));
 const head=html.slice(html.indexOf('<thead'),html.indexOf('</thead>'));
 assert.ok(head.indexOf('Cliente / Razón Social')<head.indexOf('Categoría'));
 assert.ok(head.indexOf('Categoría')<head.indexOf('Contacto'));
 for(const name of ['Consumidor Final','Arquitecto','Distribuidor','Constructor'])assert.ok(html.includes(name));
 assert.ok(html.includes('Filtrar por categoría'));
 assert.ok(html.includes('Editar cliente Cliente histórico'));
 assert.ok(html.includes('value="arquitecto" selected=""'));
});

test('Client editor preserves field values and allows clearing optional data while rejecting invalid input',()=>{
 const client={id:'client',name:'Nombre original',company_name:'Empresa original',category:'constructor',email:'cliente@example.com',phone:'+54 9 11 1234-5678',address:'Dirección original',notes:'Observaciones originales'};
 const html=renderToStaticMarkup(React.createElement(EditClientDialog,{client,onClose:()=>{},onSaved:()=>{}}));
 for(const key of ['name','company_name','category','email','phone','address','notes'])assert.ok(html.includes(`name="${key}"`),key);
 for(const value of ['Nombre original','Empresa original','cliente@example.com','Dirección original','Observaciones originales','Guardar cambios'])assert.ok(html.includes(value),value);
 assert.ok(!html.includes('name="seller_id"'),'Seller assignment must remain a separate audited action');
 assert.equal(AdminClientUpdateSchema.parse({email:'',phone:'',address:'',notes:''}).email,'');
 assert.equal(AdminClientUpdateSchema.parse({name:'  Nombre válido  '}).name,'Nombre válido');
 assert.equal(AdminClientUpdateSchema.safeParse({name:'   '}).success,false);
 assert.equal(AdminClientUpdateSchema.safeParse({email:'invalid'}).success,false);
 assert.equal(AdminClientUpdateSchema.safeParse({category:'inventada'}).success,false);
 assert.equal(AdminClientUpdateSchema.safeParse({created_by_user_id:'forged'}).success,false);
});
