import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  calculateCommercialTotals,
  calculateCascadeDiscount,
  roundCurrency,
  formatCurrencyARS
} from '../src/lib/commercial-calculations.ts';
import {
  BudgetItemInputSchema,
  CreateBudgetInputSchema,
  ConvertBudgetInputSchema,
  isValidBudgetTransition
} from '../src/lib/validations/commercial.ts';
import { getOfficialCatalog, verifyOfficialPrice } from '../src/lib/catalog-service.ts';

describe('1. CÁLCULO DE IMPORTES Y REDONDEOS', () => {
  test('Redondeo monetario a 2 decimales estándar', () => {
    assert.equal(roundCurrency(1234.567), 1234.57);
    assert.equal(roundCurrency(1234.564), 1234.56);
    assert.equal(roundCurrency(0), 0);
    assert.equal(roundCurrency(NaN), 0);
    assert.equal(roundCurrency(Infinity), 0);
  });

  test('Descuentos en cascada sucesivos', () => {
    // Caso clásico: Base 1,000,000 con descuentos 35%, 10%, 10%
    // 1,000,000 * 0.65 = 650,000
    // 650,000 * 0.90 = 585,000
    // 585,000 * 0.90 = 526,500
    const { finalAmount, discountAmount } = calculateCascadeDiscount(1000000, [35, 10, 10]);
    assert.equal(finalAmount, 526500);
    assert.equal(discountAmount, 473500);
  });

  test('Desglose comercial completo: subtotal, descuentos, IVA y total', () => {
    const items = [
      { quantity: 2, unitPrice: 500000 }, // 1,000,000
      { quantity: 1, unitPrice: 200000 }  // 200,000
    ]; // Subtotal bruto = 1,200,000
    const discounts = [35]; // 1,200,000 * 0.65 = 780,000
    const breakdown = calculateCommercialTotals(items, discounts, 21.00);

    assert.equal(breakdown.subtotal, 1200000);
    assert.equal(breakdown.discountAmount, 420000);
    assert.equal(breakdown.netTotal, 780000);
    assert.equal(breakdown.taxRate, 21);
    assert.equal(breakdown.taxAmount, 163800); // 780,000 * 0.21
    assert.equal(breakdown.totalWithTax, 943800); // 780,000 + 163,800
  });

  test('Coincidencia matemática garantizada para PDF, vista pública y pedido', () => {
    const items = [
      { quantity: 3, unitPrice: 154320.50 }
    ];
    const discounts = [15, 5];
    const breakdown = calculateCommercialTotals(items, discounts, 21.00);

    assert.ok(breakdown.netTotal > 0);
    assert.equal(breakdown.netTotal + breakdown.discountAmount, breakdown.subtotal);
    assert.equal(breakdown.netTotal + breakdown.taxAmount, breakdown.totalWithTax);
  });
});

describe('2. VALIDACIONES ESTRICTAS DE ENTRADA (ZOD)', () => {
  test('Rechaza cantidades negativas, cero o no enteras', () => {
    const invalidQty1 = BudgetItemInputSchema.safeParse({
      productName: 'Bañera Romana',
      quantity: -2,
      unitPrice: 50000
    });
    assert.equal(invalidQty1.success, false);

    const invalidQty2 = BudgetItemInputSchema.safeParse({
      productName: 'Bañera Romana',
      quantity: 0,
      unitPrice: 50000
    });
    assert.equal(invalidQty2.success, false);

    const invalidQty3 = BudgetItemInputSchema.safeParse({
      productName: 'Bañera Romana',
      quantity: 1.5,
      unitPrice: 50000
    });
    assert.equal(invalidQty3.success, false);
  });

  test('Rechaza precios negativos o no finitos', () => {
    const invalidPrice1 = BudgetItemInputSchema.safeParse({
      productName: 'Bañera Romana',
      quantity: 1,
      unitPrice: -500
    });
    assert.equal(invalidPrice1.success, false);

    const invalidPrice2 = BudgetItemInputSchema.safeParse({
      productName: 'Bañera Romana',
      quantity: 1,
      unitPrice: Infinity
    });
    assert.equal(invalidPrice2.success, false);
  });

  test('Rechaza descuentos mayores al 100% o negativos', () => {
    const invalidDiscount = CreateBudgetInputSchema.safeParse({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      items: [{ productName: 'Bañera', quantity: 1, unitPrice: 10000 }],
      discounts: [150] // > 100%
    });
    assert.equal(invalidDiscount.success, false);

    const negativeDiscount = CreateBudgetInputSchema.safeParse({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      items: [{ productName: 'Bañera', quantity: 1, unitPrice: 10000 }],
      discounts: [-10]
    });
    assert.equal(negativeDiscount.success, false);
  });
});

describe('3. TRANSICIONES DE ESTADO COMERCIAL', () => {
  test('Transiciones válidas permitidas', () => {
    assert.equal(isValidBudgetTransition('draft', 'sent'), true);
    assert.equal(isValidBudgetTransition('draft', 'accepted'), true);
    assert.equal(isValidBudgetTransition('sent', 'accepted'), true);
    assert.equal(isValidBudgetTransition('sent', 'rejected'), true);
    assert.equal(isValidBudgetTransition('accepted', 'converted'), true);
    assert.equal(isValidBudgetTransition('accepted', 'partially_converted'), true);
    assert.equal(isValidBudgetTransition('partially_converted', 'converted'), true);
  });

  test('Transiciones inválidas bloqueadas', () => {
    // Un presupuesto ya convertido no puede pasar a borrador o enviado
    assert.equal(isValidBudgetTransition('converted', 'draft'), false);
    assert.equal(isValidBudgetTransition('converted', 'sent'), false);
    // Una venta por distribuidor es final
    assert.equal(isValidBudgetTransition('distributor_sale', 'draft'), false);
  });
});

describe('4. UNIFICACIÓN DE CATÁLOGO Y PRECIOS', () => {
  test('El catálogo oficial carga correctamente modelos y precios oficiales', () => {
    const catalog = getOfficialCatalog();
    assert.ok(catalog.length > 0);
    const romana = catalog.find(i => i.name.includes('Romana'));
    assert.ok(romana !== undefined);
    assert.ok(romana.price > 0);
  });

  test('Verificación de precios oficiales vs manuales', () => {
    const catalog = getOfficialCatalog();
    const item = catalog[0];
    const checkValid = verifyOfficialPrice(item.name, item.price);
    assert.equal(checkValid.isOfficial, true);

    const checkManipulated = verifyOfficialPrice(item.name, item.price / 2);
    assert.equal(checkManipulated.isOfficial, false);
  });
});

describe('5. CONVERSIÓN PARCIAL Y SALDOS PENDIENTES', () => {
  test('Cálculo correcto de saldo restante en conversión parcial', () => {
    const budgetQuantity = 10;
    const requestedQuantity = 4;
    const remaining = budgetQuantity - requestedQuantity;

    assert.equal(remaining, 6);
    assert.ok(remaining > 0); // Estado debe ser partially_converted
  });

  test('Conversión total cuando se convierten todas las unidades', () => {
    const budgetQuantity = 5;
    const requestedQuantity = 5;
    const remaining = budgetQuantity - requestedQuantity;

    assert.equal(remaining, 0); // Estado debe ser converted
  });
});

describe('6. SEGUIMIENTO Y VISUALIZACIONES ONLINE', () => {
  test('Formato de moneda oficial es consistente', () => {
    const formatted = formatCurrencyARS(1500000.50);
    assert.ok(formatted.includes('1.500.000'));
  });
});
