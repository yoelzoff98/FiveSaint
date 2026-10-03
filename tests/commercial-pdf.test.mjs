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
  }
});
