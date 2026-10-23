import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import path from 'node:path';

// Exercise the actual authorization modules with synthetic Supabase responses.
// The cache mock supplies React's documented per-request scope; it does not
// replace the role resolution, guards, or query code under test.
const bundled=await build({stdin:{contents:`export {getCommercialUserContext,requireCommercialUser} from './src/lib/supabase/comercial'; export {getAdministrationUserContext,requireAdministrationUser} from './src/lib/supabase/administration';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'request-fixtures',setup(b){
  b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'fixture'}));
  b.onResolve({filter:/^next\//},()=>({path:'next',namespace:'fixture'}));
  b.onResolve({filter:/^\.\/server$/},args=>args.importer.includes('supabase')?({path:'db',namespace:'fixture'}):undefined);
  b.onResolve({filter:/^@\//},args=>({path:path.resolve('src',args.path.slice(2)+'.ts')}));
  b.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'js',contents:args.path==='react'?`
    export function cache(fn){return (...args)=>{const scope=globalThis.__portalAuthFixture;let results=scope.cache.get(fn);if(!results){results=new Map();scope.cache.set(fn,results);}const key=JSON.stringify(args);if(!results.has(key))results.set(key,fn(...args));return results.get(key)}};export default {};
  `:args.path==='next'?`export function redirect(url){throw new Error('REDIRECT '+url)};export function revalidatePath(){};export function revalidateTag(){};`:`
    export async function createSupabaseServerClient(){const s=globalThis.__portalAuthFixture;return {auth:{async getUser(){s.calls.push('auth');return {data:{user:s.user},error:null}}},from(table){return {select(){return this},eq(column,value){this.userId=value;return this},async maybeSingle(){s.calls.push(table);s.active++;s.maximum=Math.max(s.maximum,s.active);await new Promise(r=>setTimeout(r,10));s.active--;return {data:s.rows[table]||null,error:s.errorTable===table?{message:'offline'}:null}}}}}}
    export function createSupabaseAdminClient(){throw new Error('Unexpected privileged query in authorization test')}
  `}));
}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
function request(rows={},id='user-one'){globalThis.__portalAuthFixture={user:id?{id}:null,rows,cache:new Map(),calls:[],active:0,maximum:0};return globalThis.__portalAuthFixture;}

test('One render shares identity and profile queries across page, shell and guards',async()=>{
  const s=request({admin_users:{id:'admin',full_name:'Admin',is_active:true}});
  const results=await Promise.all([api.requireCommercialUser(),api.getAdministrationUserContext(),api.requireAdministrationUser(),api.getCommercialUserContext()]);
  assert.ok(results.every(r=>r.isAdmin));
  assert.deepEqual(s.calls,['auth','admin_users']);
});
test('Seller role lookups run concurrently and staff revocation preserves only owned commercial scope',async()=>{
  const s=request({administration_users:{id:'staff',is_active:false},sellers:{id:'seller-one',is_active:true},distributors:{id:'dist',is_active:true}});
  const result=await api.getCommercialUserContext();
  assert.equal(result.isSeller,true);assert.equal(result.isAdministration,false);assert.equal(result.isDistributor,false);assert.equal(result.sellerId,'seller-one');
  assert.equal(s.maximum,3);assert.equal(s.calls.length,5);
  await assert.rejects(api.requireAdministrationUser(),/unauthorized/);
});
test('Different request revalidates revocation and never inherits another user authorization',async()=>{
  request({admin_users:{id:'admin',is_active:true}},'admin-user');assert.equal((await api.getCommercialUserContext()).isAdmin,true);
  const s=request({sellers:{id:'seller-two',is_active:true}},'seller-user');const second=await api.getCommercialUserContext();
  assert.equal(second.user.id,'seller-user');assert.equal(second.isAdmin,false);assert.equal(second.sellerId,'seller-two');assert.equal(s.calls[0],'auth');
  request({sellers:{id:'seller-two',is_active:false}},'seller-user');await assert.rejects(api.requireCommercialUser(),/REDIRECT/);
});
test('Active staff takes priority; inactive admin and unknown or anonymous users cannot gain permissions',async()=>{
  request({administration_users:{id:'staff',is_active:true},sellers:{id:'seller',is_active:true}});const staff=await api.getCommercialUserContext();assert.equal(staff.isAdministration,true);assert.equal(staff.isSeller,false);
  request({admin_users:{id:'admin',is_active:false},sellers:{id:'seller',is_active:true}});await assert.rejects(api.requireCommercialUser(),/REDIRECT/);
  request();await assert.rejects(api.requireCommercialUser(),/REDIRECT/);
  request({},null);await assert.rejects(api.requireAdministrationUser(),/REDIRECT/);
});
test('Authorization lookup errors fail closed instead of falling back to broader access',async()=>{
  const s=request({sellers:{id:'seller',is_active:true}});s.errorTable='admin_users';await assert.rejects(api.requireCommercialUser(),/validar los permisos/);
});

