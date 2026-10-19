import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.PUBLIC_REVIEW_BASE_URL||'http://localhost:3112';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname),'Run browser verification against a local server only');
const browser=await puppeteer.launch({executablePath:process.env.PUBLIC_REVIEW_CHROME||'C:/Users/yoelz/.cache/puppeteer/chrome/win64-154.0.8037.57/chrome-win64/chrome.exe',headless:true});
const output=process.env.PUBLIC_REVIEW_OUTPUT_DIR;
if(output)fs.mkdirSync(output,{recursive:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let contactRequests=0;
 await page.setRequestInterception(true);
 page.on('request',request=>{
  if(request.method()==='POST'){
   if(request.url()===base+'/api/contact'){contactRequests++;return request.respond({status:200,contentType:'application/json',body:JSON.stringify({success:true,message:'Intercepted locally; no email sent or CRM write'})});}
   return request.abort();
  }
  request.continue();
 });
 const visit=async(route)=>{console.log('CHECK',route);await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.waitForNetworkIdle({idleTime:150,timeout:4000}).catch(()=>{});};
 await page.setViewport({width:1440,height:1000});await visit('/');
 assert.ok((await page.title()).includes('fabricación nacional'));
 assert.equal(await page.$$eval('footer a[href*="legal/"]',els=>els.length),0);
 assert.ok(await page.$$eval('a[href*="categoria=sauna"]',els=>els.length)>=2);
 await page.type('header input[name="q"]','Romana');
 await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.keyboard.press('Enter')]);
 assert.ok(page.url().includes('q=Romana'));assert.ok(await page.$('a[href="/productos/romana"]'));
 const rendered=await (await fetch(base+'/productos?q=romana')).text();assert.ok(rendered.includes('href="/productos/romana"'));
 console.log('PASS desktop header search and server-rendered catalog');
 await visit('/productos?categoria=ducha-escocesa');assert.ok(page.url().includes('categoria=ducha-escocesa'));assert.ok(await page.$('a[href="/productos/ducha-escocesa"]'));
 await visit('/productos?q=no-existe-xyz');assert.ok(await page.$eval('body',el=>el.innerText.includes('No encontramos productos')));
 await visit('/productos/spa-desing');assert.ok(await page.$eval('h1',el=>el.innerText.includes('Design')));
 await visit('/nosotros#historia');assert.ok(await page.$('#historia'));assert.ok(await page.$('#proceso'));
 console.log('PASS categories, no results, product spelling and history/process anchors');
 await visit('/contacto?ref=spas');assert.equal(await page.$eval('#productInterest',el=>el.value),'Spa y Minipiscinas');
 const submit='form:has(#name) button[type="submit"]';
 await page.click(submit);await page.waitForFunction(()=>document.querySelector('#name').getAttribute('aria-invalid')==='true');assert.equal(contactRequests,0);
 await page.type('#name','Persona de prueba');await page.type('#email','persona@example.invalid');await page.type('#message','Consulta interceptada para verificar el formulario, sin envío real.');
 await page.click(submit);await page.waitForFunction(()=>document.body.innerText.includes('Tu consulta fue enviada correctamente'));assert.equal(contactRequests,1);
 assert.equal(await page.$$eval('#productInterest option',els=>els.length),7);
 console.log('PASS empty contact validation, seven categories, legacy referral and mocked successful submission with zero actual email or DB writes');
 for(const width of [390,768]){await page.setViewport({width,height:900});for(const route of ['/','/productos?q=romana','/contacto','/nosotros']){await visit(route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route} at ${width}px`);}}
 await page.setViewport({width:390,height:844});
 for(const route of ['/productos','/contacto','/nosotros','/']){
  await visit('/');await page.click('button[aria-label="Abrir menú de navegación"]');await page.waitForSelector('#mobile-menu');
  if(output)await page.screenshot({path:output+'/menu-movil.png',fullPage:true});
  await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.click(`#mobile-menu a[href="${route}"]`)]);assert.equal(new URL(page.url()).pathname,route);
 }
 console.log('PASS mobile widths 390/768px and all mobile menu destinations');
 for(const route of ['/robots.txt','/sitemap.xml','/og']){const response=await fetch(base+route);assert.equal(response.status,200,route);const body=await response.arrayBuffer();assert.ok(body.byteLength>0);}
 assert.deepEqual(errors,[]);console.log('PASS robots, sitemap, Open Graph image and no browser runtime errors');
 if(output){await page.setViewport({width:1440,height:1000});await visit('/productos?q=romana');await page.screenshot({path:output+'/busqueda-escritorio.png',fullPage:true});}
}finally{await browser.close();}
