import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { validateSingleA4Capacity, validateOptionCompatibility } from '../src/lib/manufacturing-calculations.ts';
import {
  ManufacturingOrderPrintPdf,
  ManufacturingOrderWorkshopTemplateV2,
  ManufacturingOrderLegacyTemplateV1
} from '../src/components/pdf/ManufacturingOrderPrintPdf.tsx';

test('Unknown option values and missing required options cannot reach manufacturing', () => {
  const options = [{code:'motor',name:'Motor',isRequired:true,allowedValues:[{value:'left',label:'Izquierdo'}]}];
  assert.equal(validateOptionCompatibility({},options).valid,false);
  assert.equal(validateOptionCompatibility({motor:'invented'},options).valid,false);
  assert.equal(validateOptionCompatibility({motor:'left'},options).valid,true);
});

test('A4 validator rejects long descriptions and configuration values, not just row counts', () => {
  assert.equal(validateSingleA4Capacity({supplies:[{code:'A',name:'X'.repeat(500),quantity:1,unitOfMeasure:'un'}]}).fitsInSingleA4,false);
  assert.equal(validateSingleA4Capacity({supplies:[],configuration:{motor:'X'.repeat(500)}}).fitsInSingleA4,false);
});

test('Catalog binding migration is repeatable and inaccessible to browser roles', async () => {
  const db = new PGlite();
  try {
    await db.exec(fs.readFileSync('tests/fixtures/commercial-current-schema.sql','utf8'));
    const migration = fs.readFileSync('supabase/migrations/20261015000100_catalog_manufacturing_bindings.sql','utf8');
    await db.exec(migration); await db.exec(migration);
    for (const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query('select * from public.catalog_manufacturing_bindings'),/permission denied/);
      await db.exec('reset role');
    }
  } finally { await db.close(); }
});

test('Exclusión absoluta de información económica y datos personales del cliente en orden de taller', () => {
  // Orden con datos comerciales completos de un pedido
  const orderWithCommercialData = {
    order_number: 'OF-37658',
    product_name: 'BAÑERA YAQUELIN 181X091 6 JETS V/CROMO',
    variant_name: 'Casco Blanco',
    quantity: 1,
    status: 'issued',
    issued_at: '2026-09-08T10:05:00Z',
    issued_by_name: 'Control Planta',
    bom_version: 1,
    configuration_snapshot: {
      motor_pos: 'Derecha',
      jets: '6 Jets'
    },
    manufacturing_instructions_snapshot: ['Montar motobomba a la derecha'],
    supplies_snapshot: [
      { code: '0801', name: 'BOMBA AMERICA C/SW', quantity: 1, unitOfMeasure: 'un' },
      { code: '101.33X204', name: 'YAQ/181 FIBRA', quantity: 0.33, unitOfMeasure: 'kg' }
    ],
    notes: 'Prioridad de taller',
    orders: {
      order_number: 1042,
      // Datos comerciales reales del pedido que NO deben llegar al HTML de taller:
      total_amount: 1450000.00,
      unit_price: 1450000.00,
      discount: 50000.00,
      payment_condition: '30% anticipo y saldo contra entrega',
      clients: {
        name: 'GHEZAN HNOS. S.C.',
        phone: '+5491123456789',
        email: 'compras@ghezanhnos.com.ar',
        address: 'Av. Libertador 1200'
      }
    },
    template_version: 'v2_workshop'
  };

  const html = renderToStaticMarkup(React.createElement(ManufacturingOrderPrintPdf, { order: orderWithCommercialData }));

  // Términos prohibidos
  assert.equal(html.includes('$'), false, 'No debe existir signo monetario $');
  assert.equal(html.includes('1450000'), false, 'No debe imprimirse el total comercial');
  assert.equal(html.includes('50000'), false, 'No debe imprimirse el descuento');
  assert.equal(html.includes('anticipo'), false, 'No deben imprimirse condiciones de pago');
  assert.equal(html.includes('compras@ghezanhnos.com.ar'), false, 'No debe exponerse el email del cliente');
  assert.equal(html.includes('+5491123456789'), false, 'No debe exponerse el teléfono del cliente');

  // Términos obligatorios técnicos
  assert.equal(html.includes('ORDEN DE FABRICACIÓN'), true, 'Debe incluir el título técnico');
  assert.equal(html.includes('37658'), true, 'Debe incluir el número de orden');
  assert.equal(html.includes('FS-O-1042'), true, 'Debe incluir la referencia del pedido');
  assert.equal(html.includes('0,33'), true, 'Debe conservar decimales en insumos formateados con coma decimal');
  assert.equal(html.includes('TERMOFORMADO'), true, 'Debe incluir la etapa Termoformado');
  assert.equal(html.includes('ENFIBRADO'), true, 'Debe incluir la etapa Enfibrado');
  assert.equal(html.includes('CORTE Y PERFORADO'), true, 'Debe incluir la etapa Corte y perforado');
  assert.equal(html.includes('ARMADO'), true, 'Debe incluir la etapa Armado');
  assert.equal(html.includes('PRUEBA'), true, 'Debe incluir la etapa Prueba');
  assert.equal(html.includes('PULIDO-EMBALADO'), true, 'Debe incluir la etapa Pulido y embalado');
  assert.equal(html.includes('CONTROL FINAL'), true, 'Debe incluir la etapa Control final');
});

test('Retrocompatibilidad garantizada con plantilla anterior V1', () => {
  const legacyOrder = {
    order_number: 'OF-2026-00001',
    product_name: 'BAÑERA HIDROMASAJE CAPRI',
    quantity: 2,
    status: 'issued',
    issued_at: '2026-10-01T12:00:00Z',
    issued_by_name: 'Administración',
    bom_version: 1,
    configuration_snapshot: {},
    manufacturing_instructions_snapshot: [],
    supplies_snapshot: [{ code: 'INS-01', name: 'Casco Acrílico', quantity: 2, unitOfMeasure: 'un' }],
    template_version: 'v1'
  };

  const html = renderToStaticMarkup(React.createElement(ManufacturingOrderPrintPdf, { order: legacyOrder }));
  assert.equal(html.includes('Planta de Fabricación FiveSaint'), true);
  assert.equal(html.includes('OF-2026-00001'), true);
});
