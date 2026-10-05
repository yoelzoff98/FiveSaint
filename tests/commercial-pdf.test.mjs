import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import fs from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { BudgetPrintPdf } from '../src/components/pdf/BudgetPrintPdf.tsx';
import { getPublishedBudgetUrl } from '../src/lib/commercial-links.ts';
import { resolveIssuedBudgetTotals, formatCurrencyARS, getUnlinkedLegacyDistributorBudgets } from '../src/lib/commercial-calculations.ts';

const budget = { id: 'test', budget_number: 1, status: 'draft', created_at: '2026-10-02T12:00:00Z', total_amount: 85, discounts: [], items: [{ id: 'item', product_name: 'Synthetic', variant_name: null, quantity: 1, unit_price: 100, total_price: 100 }] };

test('Sharing uses the published token and never exposes draft or revoked links', () => {
  const document = { public_status: 'published', public_token: 'token', id: 'internal-id' };
  assert.equal(getPublishedBudgetUrl('https://example.invalid', document), 'https://example.invalid/presupuesto/token');
  for (const public_status of ['draft', 'revoked']) assert.equal(getPublishedBudgetUrl('https://example.invalid', { ...document, public_status }), '');
});

test('Distributor metrics exclude cancelled and out-of-period linked orders from legacy fallback', () => {
  const budgets = [
    { id: 'cancelled', status: 'accepted', sale_channel: 'distributor' },
    { id: 'linked', status: 'distributor_sale' },
    { id: 'legacy', status: 'distributor_sale' },
  ];
  const orders = [{ budget_id: 'cancelled', status: 'cancelled' }, { budget_id: 'linked', created_at: '2025-01-01' }];
  assert.deepEqual(getUnlinkedLegacyDistributorBudgets(budgets, orders).map(row => row.id), ['legacy']);
});

test('Issued PDF preserves legacy stored net instead of recalculating discounts', () => {
  assert.equal(resolveIssuedBudgetTotals(budget).netTotal, 85);
  const html = renderToStaticMarkup(React.createElement(BudgetPrintPdf, { budget }));
  assert.ok(html.includes(formatCurrencyARS(102.85)));
});

test('Actual PDF supports zero and alternate tax rates', () => {
  for (const taxRate of [0, 10.5, 21]) {
    const input = { ...budget, calculation_snapshot: { netTotal: 85, taxRate } };
    const totals = resolveIssuedBudgetTotals(input);
    const html = renderToStaticMarkup(React.createElement(BudgetPrintPdf, { budget: input }));
    assert.equal(totals.taxAmount, Math.round(85 * taxRate) / 100);
    assert.ok(html.includes(formatCurrencyARS(totals.totalWithTax)));
  }
});

test('New issued PDF never exposes internal notes; legacy conditions remain readable', () => {
  const input = { ...budget, notes: 'INTERNAL_ONLY', public_notes: null, calculation_snapshot: { netTotal: 85, taxRate: 21 } };
  assert.ok(!renderToStaticMarkup(React.createElement(BudgetPrintPdf, { budget: input })).includes('INTERNAL_ONLY'));
  assert.ok(renderToStaticMarkup(React.createElement(BudgetPrintPdf, { budget: { ...budget, notes: 'LEGACY_CONDITIONS' } })).includes('LEGACY_CONDITIONS'));
});

const backup = (fs.existsSync('backups') ? fs.readdirSync('backups') : []).filter(name => /^commercial_backup_.*\.json$/.test(name)).sort().at(-1);
test('Every budget in the local historical backup preserves its issued amounts in the real PDF component', { skip: !backup }, () => {
  const { tables } = JSON.parse(fs.readFileSync(`backups/${backup}`, 'utf8'));
  for (const row of tables.budgets) {
    const input = { ...row, items: tables.budget_items.filter(item => item.budget_id === row.id) };
    const totals = resolveIssuedBudgetTotals(input);
    assert.equal(totals.netTotal, Number(row.total_amount));
    const html = renderToStaticMarkup(React.createElement(BudgetPrintPdf, { budget: input }));
    assert.ok(html.includes(formatCurrencyARS(totals.netTotal)));
    assert.ok(html.includes(formatCurrencyARS(totals.totalWithTax)));
    assert.ok(!html.includes('Emitido por:'));
    assert.ok(html.includes('Asesor Comercial:'));
  }
});

test('Administrative PDF renders assigned commercial advisor and explicit issuer snapshot', () => {
  const adminBudget = {
    id: 'admin-budget-1',
    budget_number: 999,
    status: 'draft',
    created_at: '2026-10-04T12:00:00Z',
    total_amount: 150000,
    discounts: [],
    creator_role: 'administration',
    author_snapshot: {
      user_id: 'user-admin-1',
      name: 'Carla Ferraro (Administración)',
      role: 'administration',
      email: 'carla@fivesaint.com'
    },
    seller_snapshot: {
      name: 'Gonzalo Vendedor',
      full_name: 'Gonzalo Vendedor',
      seller_id: 'seller-uuid-1',
      phone: '+54 9 11 5555-1234'
    },
    client_snapshot: {
      name: 'Cliente VIP SA',
      company_name: 'VIP Corporativo',
      email: 'vip@empresa.com'
    },
    items: [
      { id: 'it-1', product_name: 'Bañera Hidromasaje', variant_name: 'Premium', quantity: 1, unit_price: 150000, total_price: 150000 }
    ]
  };

  const html = renderToStaticMarkup(React.createElement(BudgetPrintPdf, { budget: adminBudget }));

  assert.ok(html.includes('Asesor Comercial Asignado:'));
  assert.ok(html.includes('Gonzalo Vendedor'));
  assert.ok(html.includes('Emitido por:'));
  assert.ok(html.includes('Carla Ferraro (Administración)'));
  assert.ok(!html.includes('Asesor Comercial:</span>'));
});

test('Public budget digital view renders correctly for both historical and administrative budgets', async () => {
  const { PublicBudgetViewClient } = await import('../src/app/(public)/presupuesto/[id]/PublicBudgetViewClient.tsx');

  const historical = {
    id: 'hist-1',
    budget_number: 101,
    status: 'draft',
    created_at: '2026-10-01T10:00:00Z',
    total_amount: 50000,
    discounts: [],
    client_snapshot: { name: 'Comprador Histórico' },
    seller_snapshot: { name: 'Vendedor Original' },
    items: [{ id: 'i1', product_name: 'Spa Clásico', variant_name: null, quantity: 1, unit_price: 50000, total_price: 50000 }]
  };
  const htmlHistorical = renderToStaticMarkup(React.createElement(PublicBudgetViewClient, { budget: historical }));
  assert.ok(htmlHistorical.includes('Presupuesto Digital'));
  assert.ok(htmlHistorical.includes('N° FS-P-101'));
  assert.ok(htmlHistorical.includes('Comprador Histórico'));
  assert.ok(htmlHistorical.includes('Vendedor Original'));
  assert.ok(!htmlHistorical.includes('Emitido por:'));

  const administrative = {
    id: 'adm-pub-1',
    budget_number: 202,
    status: 'draft',
    created_at: '2026-10-04T14:00:00Z',
    total_amount: 90000,
    discounts: [],
    creator_role: 'administration',
    author_snapshot: { name: 'Oficina Central' },
    seller_snapshot: { full_name: 'Asesor Comercial Asignado Pedro' },
    client_snapshot: { name: 'Comprador Reciente' },
    items: [{ id: 'i2', product_name: 'Ducha Escocesa', variant_name: null, quantity: 1, unit_price: 90000, total_price: 90000 }]
  };
  const htmlAdmin = renderToStaticMarkup(React.createElement(PublicBudgetViewClient, { budget: administrative }));
  assert.ok(htmlAdmin.includes('Presupuesto Digital'));
  assert.ok(htmlAdmin.includes('N° FS-P-202'));
  assert.ok(htmlAdmin.includes('Asesor Comercial Asignado:'));
  assert.ok(htmlAdmin.includes('Asesor Comercial Asignado Pedro'));
  assert.ok(htmlAdmin.includes('Emitido por:'));
  assert.ok(htmlAdmin.includes('Oficina Central'));
});
