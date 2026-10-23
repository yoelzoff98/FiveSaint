// Isolated browser contract: no credentials, production requests or database writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {build} from 'esbuild';
import puppeteer from 'puppeteer-core';
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'fivesaint-notification-performance-'));
await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {OrderRequestNotifications} from './src/components/comercial/OrderRequestNotifications';window.__calls=0;window.__refreshes=0;window.__active=0;window.__maximum=0;window.__feed={data:[],count:0,userId:'admin',isAdministration:true};createRoot(document.getElementById('app')).render(<><input aria-label="Notas del pedido"/><OrderRequestNotifications/></>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,format:'iife',platform:'browser',jsx:'automatic',outfile:path.join(temporary,'app.js'),plugins:[{name:'fixtures',setup(b){
 b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'fixture'}));
 b.onResolve({filter:/^next\/navigation$/},()=>({path:'router',namespace:'fixture'}));
 b.onResolve({filter:/^@\/lib\/supabase\//},a=>({path:a.path.endsWith('browser')?'browser':'actions',namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',resolveDir:process.cwd(),contents:a.path==='link'?`import React from 'react';export default function Link(p){return React.createElement('a',p,p.children)}`:a.path==='router'?`export function useRouter(){return {refresh(){window.__refreshes++}}}`:a.path==='browser'?`
  export function createSupabaseBrowserClient(){return {channel(){const c={on(type,filter,callback){window.__event=callback;window.__filter=filter;return c},subscribe(callback){callback('SUBSCRIBED');return c}};return c},removeChannel(){}}}
 `:`export async function getRequestNotifications(){window.__calls++;window.__active++;window.__maximum=Math.max(window.__maximum,window.__active);await new Promise(r=>setTimeout(r,60));window.__active--;return structuredClone(window.__feed)};export async function markRequestNotificationRead(id){window.__feed={...window.__feed,count:0,data:[]};}` }));
}}]});
const server=http.createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','application/javascript');res.end(fs.readFileSync(path.join(temporary,'app.js')))}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><div id="app"></div><script src="/app.js"></script>')}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Users/yoelz/.cache/puppeteer/chrome/win64-154.0.8037.57/chrome-win64/chrome.exe',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.waitForFunction(()=>window.__event&&window.__calls>=2&&window.__active===0);
 await page.type('input','Pedido sin guardar');
 const baseline=await page.evaluate(()=>window.__calls);
 await page.evaluate(()=>{window.__feed={...window.__feed,count:1,data:[{id:'n',request_id:'request-one',title:'Nueva solicitud',message:'Pedido confirmado'}]};for(let i=0;i<20;i++)window.__event({eventType:'INSERT',new:{title:'Nueva solicitud'}})});
 await page.waitForSelector('button[aria-label="Notificaciones: 1 sin leer"]');
 await page.waitForFunction(()=>window.__active===0);
 const result=await page.evaluate(()=>({calls:window.__calls,maximum:window.__maximum,refreshes:window.__refreshes,input:document.querySelector('input').value,filter:window.__filter.filter}));
 assert.ok(result.calls-baseline<=2);assert.equal(result.maximum,1);assert.equal(result.refreshes,0);assert.equal(result.input,'Pedido sin guardar');assert.equal(result.filter,'recipient_user_id=eq.admin');
 await page.click('button[aria-label="Notificaciones: 1 sin leer"]');
 assert.ok(await page.$('a[href="/administracion/solicitudes/request-one"]'));
 assert.deepEqual(errors,[]);
 console.log('PASS: 20 realtime events coalesce into at most 2 feed queries, no page refresh, unsaved input preserved, recipient filter and request navigation intact.');
}finally{await browser.close();await new Promise(r=>server.close(r));assert.equal(path.dirname(temporary),os.tmpdir());assert.ok(path.basename(temporary).startsWith('fivesaint-notification-performance-'));fs.rmSync(temporary,{recursive:true});}
