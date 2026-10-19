// Local synthetic render only; no application server or Supabase credentials.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import puppeteer from 'puppeteer-core';
import {
  ManufacturingOrderPrintPdf,
  ManufacturingOrderWorkshopTemplateV2,
  ManufacturingOrderLegacyTemplateV1
} from '../src/components/pdf/ManufacturingOrderPrintPdf.tsx';
import { validateSingleA4Capacity } from '../src/lib/manufacturing-calculations.ts';

// 1. Insumos realistas acordes al formato de taller (con decimales y texto técnico)
const supplies = [
  { code: '0801', name: 'BOMBA AMERICA C/SW', quantity: 1, unitOfMeasure: 'un' },
  { code: '0087', name: 'TE DERIVACION', quantity: 1, unitOfMeasure: 'un' },
  { code: '8002', name: 'CODO 32MM BLANCO', quantity: 1, unitOfMeasure: 'un' },
  { code: '1018', name: 'JET EUROPA C/VTA CROMO PLANA GDE.', quantity: 6, unitOfMeasure: 'un' },
  { code: '1035', name: 'PULSADOR CROMO', quantity: 1, unitOfMeasure: 'un' },
  { code: '1058', name: 'REGULADOR CROMO', quantity: 1, unitOfMeasure: 'un' },
  { code: '0119', name: 'SUCCION CROMO A CODO 40', quantity: 1, unitOfMeasure: 'un' },
  { code: '101.33X204', name: 'YAQ/181 FIBRA DE VIDRIO REFORZADA', quantity: 0.33, unitOfMeasure: 'kg' },
  { code: 'INS-08', name: 'MANGUERA CRISTAL 1/2 REFORZADA', quantity: 3.50, unitOfMeasure: 'm' },
  { code: 'INS-09', name: 'ADHESIVO SELLADOR ESTRUCTURAL', quantity: 0.50, unitOfMeasure: 'l' },
  { code: 'INS-10', name: 'BASE AUTOPORTANTE REFORZADA', quantity: 1, unitOfMeasure: 'un' },
  { code: 'INS-11', name: 'SET TORNILLERIA ACERO INOXIDABLE', quantity: 1, unitOfMeasure: 'un' }
];

const configuration = {
  jets: '6 Jets con vista cromada',
  motor_lado: 'A la derecha',
  garantia_manual: 'Garantía y manual de instalación y uso incluido'
};

const instructions = [
  "Adicional: Almohadilla x 1",
  "Adicional: Jets extra x 2",
  'Verificar posición de descarga y sentido de motobomba en cabecera derecha.',
  'Prueba de hermeticidad a 1.5 bar durante 15 minutos en banco de ensayo.'
];

// Comprobar validador
assert.equal(validateSingleA4Capacity({ supplies, configuration, instructions, notes: 'Montaje prioritario para despacho de fábrica.' }).fitsInSingleA4, true);

// 2. Orden completa simulada (excluyendo estrictamente información comercial o personal del cliente)
const orderV2 = {
  order_number: '37658',
  product_name: 'BAÑERA YAQUELIN 181X091 6 JETS V/CROMO',
  variant_name: null,
  quantity: 1,
  status: 'issued',
  issued_at: '2026-09-08T10:05:00Z',
  issued_by_name: 'Control de Producción',
  bom_version: 1,
  configuration_snapshot: configuration,
  manufacturing_instructions_snapshot: instructions,
  supplies_snapshot: supplies,
  notes: 'Verificar pulido y embalado previo a expedición.',
  orders: {
    order_number: 1042
  },
  template_version: 'v2_workshop'
};

const groupedHtml = renderToStaticMarkup(React.createElement(ManufacturingOrderPrintPdf, {order:orderV2}));
assert.ok(groupedHtml.includes('Almohadilla x 1'));
assert.ok(groupedHtml.includes('Jets extra x 2'));

// 3. Orden histórica V1 simulada
const orderV1 = {
  ...orderV2,
  order_number: 'OF-2026-00010',
  template_version: 'v1'
};

const chunks = '.next/static/chunks';
const css = fs.existsSync(chunks)
  ? fs.readdirSync(chunks).filter(name => name.endsWith('.css')).map(name => fs.readFileSync(path.join(chunks, name), 'utf8')).join('\n')
  : '';

const logo = fs.existsSync('public/LOGO.svg')
  ? `data:image/svg+xml;base64,${fs.readFileSync('public/LOGO.svg').toString('base64')}`
  : '';

const htmlV2 = renderToStaticMarkup(React.createElement(ManufacturingOrderPrintPdf, { order: orderV2 }))
  .replace('src="/LOGO.svg"', `src="${logo}"`);

const htmlV1 = renderToStaticMarkup(React.createElement(ManufacturingOrderPrintPdf, { order: orderV1 }))
  .replace('src="/LOGO.svg"', `src="${logo}"`);

// 4. Verificación de ausencia absoluta de datos económicos en el HTML renderizado
const prohibitedTerms = [
  /\$\s*\d+/,
  /\bprecio\b/i,
  /\bunit_price\b/i,
  /\btotal_price\b/i,
  /\bcosto\b/i,
  /\bdescuento\b/i,
  /\biva\b/i,
  /\bmonto\b/i,
  /\bfactura\b/i,
  /\bcobranza\b/i,
  /\bsaldo\b/i,
  /\bemail\b/i,
  /\btelefono\b/i
];

for (const regex of prohibitedTerms) {
  assert.equal(
    regex.test(htmlV2),
    false,
    `VIOLACIÓN DE AISLAMIENTO: El documento técnico contiene términos económicos o de contacto prohibidos (${regex})`
  );
}

// 5. Verificación física con Puppeteer
const executablePath = process.env.CHROME_PATH || 'C:/Users/yoelz/.cache/puppeteer/chrome/win64-154.0.8037.57/chrome-win64/chrome.exe';
const browser = await puppeteer.launch({ executablePath, headless: true });

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 1400 });

  // A. Renderizar y medir V2 (Nueva plantilla de taller con 7 etapas de control)
  await page.setContent(`<html><head><style>${css}\n@page{size:A4;margin:0}body{margin:0}</style></head><body>${htmlV2}</body></html>`);
  await page.evaluate(() => document.fonts.ready);

  const fitsV2 = await page.evaluate(() => {
    const sheet = document.getElementById('manufacturing-order-a4-sheet');
    const box = sheet.getBoundingClientRect();
    const blocks = [...sheet.children].map(node => node.getBoundingClientRect());
    const separated = blocks.every((b, index) => index === 0 || b.top >= blocks[index - 1].bottom - 1);
    return separated && sheet.scrollHeight <= sheet.clientHeight + 1 && [...sheet.querySelectorAll('*')].every(node => {
      const rect = node.getBoundingClientRect();
      return rect.bottom <= box.bottom + 1 && rect.right <= box.right + 1;
    });
  });

  assert.equal(fitsV2, true, 'V2 workshop sheet must fit on a single A4 page without clipping or overflow');

  fs.mkdirSync('backups/manufacturing-qa', { recursive: true });
  await page.screenshot({ path: 'backups/manufacturing-qa/a4_workshop_v2.png', fullPage: true });
  const pdfV2 = await page.pdf({ path: 'backups/manufacturing-qa/a4_workshop_v2.pdf', format: 'A4', preferCSSPageSize: true, printBackground: true });
  const pageCountV2 = (Buffer.from(pdfV2).toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
  assert.equal(pageCountV2, 1, 'V2 workshop PDF must have exactly 1 page');

  // B. Renderizar y medir V1 (Plantilla legacy histórica)
  await page.setContent(`<html><head><style>${css}\n@page{size:A4;margin:0}body{margin:0}</style></head><body>${htmlV1}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const pdfV1 = await page.pdf({ path: 'backups/manufacturing-qa/a4_legacy_v1.pdf', format: 'A4', preferCSSPageSize: true, printBackground: true });
  const pageCountV1 = (Buffer.from(pdfV1).toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
  assert.equal(pageCountV1, 1, 'V1 legacy PDF must have exactly 1 page');

  console.log('PASS: Workshop V2 and Legacy V1 rendered on exactly one A4 page without economic data.');
} finally {
  await browser.close();
}
