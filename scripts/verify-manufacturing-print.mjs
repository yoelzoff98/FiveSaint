// Local synthetic render only; no application server or Supabase credentials.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import puppeteer from 'puppeteer-core';
import { ManufacturingOrderPrintPdf } from '../src/components/pdf/ManufacturingOrderPrintPdf.tsx';
import { validateSingleA4Capacity } from '../src/lib/manufacturing-calculations.ts';

const supplies = Array.from({length:16}, (_, i) => ({code:`INS-${i}`,name:'Componente sanitario para fabricación '.repeat(2).slice(0,70),quantity:2,unitOfMeasure:'un'}));
const configuration = Object.fromEntries(Array.from({length:8},(_,i)=>[`opcion_${i}`, 'Configuración de prueba '.repeat(3).slice(0,50)]));
const instructions = Array.from({length:6},()=> 'Verificar conexiones y montaje antes de finalizar la fabricación. '.repeat(3).slice(0,140));
assert.equal(validateSingleA4Capacity({supplies,configuration,instructions,notes:'Verificar condiciones de fabricación y montaje. '.repeat(10).slice(0,350)}).fitsInSingleA4,true);
assert.equal(validateSingleA4Capacity({supplies:[{...supplies[0],name:'Extenso '.repeat(100)}]}).fitsInSingleA4,false);
const order = {order_number:'OF-TEST-00001',product_name:'Producto de prueba',variant_name:'Variante de prueba',quantity:2,status:'issued',issued_at:'2026-10-15T12:00:00Z',issued_by_name:'Administración de prueba',bom_version:1,configuration_snapshot:configuration,manufacturing_instructions_snapshot:instructions,supplies_snapshot:supplies,notes:'Verificar condiciones de fabricación y montaje. '.repeat(10).slice(0,350)};
const chunks = '.next/static/chunks';
const css = fs.readdirSync(chunks).filter(name=>name.endsWith('.css')).map(name=>fs.readFileSync(path.join(chunks,name),'utf8')).join('\n');
const logo = `data:image/svg+xml;base64,${fs.readFileSync('public/LOGO.svg').toString('base64')}`;
const html = renderToStaticMarkup(React.createElement(ManufacturingOrderPrintPdf,{order})).replace('src="/LOGO.svg"',`src="${logo}"`);
const executablePath = process.env.CHROME_PATH || 'C:/Users/yoelz/.cache/puppeteer/chrome/win64-154.0.8037.57/chrome-win64/chrome.exe';
const browser = await puppeteer.launch({executablePath,headless:true});
try {
  const page = await browser.newPage();
  await page.setViewport({width:1100,height:1400});
  await page.setContent(`<html><head><style>${css}\n@page{size:A4;margin:0}body{margin:0}</style></head><body>${html}</body></html>`);
  await page.evaluate(()=>document.fonts.ready);
  const fits = await page.evaluate(()=> {
    const sheet = document.getElementById('manufacturing-order-a4-sheet');
    const box = sheet.getBoundingClientRect();
    const blocks = [...sheet.children].map(node=>node.getBoundingClientRect());
    const separated = blocks.every((box,index)=> index===0 || box.top >= blocks[index-1].bottom - 1);
    return separated && sheet.scrollHeight <= sheet.clientHeight + 1 && [...sheet.querySelectorAll('*')].every(node=>{
      const rect=node.getBoundingClientRect();return rect.bottom<=box.bottom+1 && rect.right<=box.right+1;
    });
  });
  assert.equal(fits,true,'A4 content must fit without clipping');
  fs.mkdirSync('backups/manufacturing-qa',{recursive:true});
  await page.screenshot({path:'backups/manufacturing-qa/a4.png',fullPage:true});
  const pdf = await page.pdf({path:'backups/manufacturing-qa/a4.pdf',format:'A4',preferCSSPageSize:true,printBackground:true});
  assert.equal((Buffer.from(pdf).toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,1,'Exactly one PDF page');
  console.log('PASS: complete manufacturing order rendered on one A4; overlong text rejected.');
} finally { await browser.close(); }
