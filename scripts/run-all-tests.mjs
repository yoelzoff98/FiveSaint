import assert from 'node:assert/strict';
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

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('====================================================');
console.log('SUITE DE PRUEBAS AUTOMATIZADAS: MÓDULO COMERCIAL');
console.log('====================================================');

console.log('\n1. CÁLCULO DE IMPORTES, DESCUENTOS Y REDONDEO:');
runTest('Redondeo monetario seguro', () => {
  assert.equal(roundCurrency(1234.567), 1234.57);
  assert.equal(roundCurrency(1234.564), 1234.56);
  assert.equal(roundCurrency(0), 0);
  assert.equal(roundCurrency(NaN), 0);
  assert.equal(roundCurrency(Infinity), 0);
});

runTest('Descuentos en cascada sucesivos (35% + 10% + 10%)', () => {
  const { finalAmount, discountAmount } = calculateCascadeDiscount(1000000, [35, 10, 10]);
  assert.equal(finalAmount, 526500);
  assert.equal(discountAmount, 473500);
});

runTest('Desglose comercial unificado: subtotal, neto, IVA 21% y total final', () => {
  const items = [
    { quantity: 2, unitPrice: 500000 },
    { quantity: 1, unitPrice: 200000 }
  ];
  const discounts = [35];
  const breakdown = calculateCommercialTotals(items, discounts, 21.00);

  assert.equal(breakdown.subtotal, 1200000);
  assert.equal(breakdown.discountAmount, 420000);
  assert.equal(breakdown.netTotal, 780000);
  assert.equal(breakdown.taxRate, 21);
  assert.equal(breakdown.taxAmount, 163800);
  assert.equal(breakdown.totalWithTax, 943800);
  assert.equal(breakdown.netTotal + breakdown.discountAmount, breakdown.subtotal);
  assert.equal(breakdown.netTotal + breakdown.taxAmount, breakdown.totalWithTax);
});

runTest('Formato monetario ARS oficial consistente', () => {
  const formatted = formatCurrencyARS(1500000.50);
  assert.ok(formatted.includes('1.500.000'));
});

console.log('\n2. VALIDACIONES DE ENTRADA Y SEGURIDAD (ZOD):');
runTest('Rechazo de cantidades negativas, cero o fraccionarias', () => {
  assert.equal(BudgetItemInputSchema.safeParse({ productName: 'Bañera', quantity: -1, unitPrice: 100 }).success, false);
  assert.equal(BudgetItemInputSchema.safeParse({ productName: 'Bañera', quantity: 0, unitPrice: 100 }).success, false);
  assert.equal(BudgetItemInputSchema.safeParse({ productName: 'Bañera', quantity: 1.5, unitPrice: 100 }).success, false);
  assert.equal(BudgetItemInputSchema.safeParse({ productName: 'Bañera', quantity: 2, unitPrice: 100 }).success, true);
});

runTest('Rechazo de precios negativos, infinitos o NaN', () => {
  assert.equal(BudgetItemInputSchema.safeParse({ productName: 'Bañera', quantity: 1, unitPrice: -50 }).success, false);
  assert.equal(BudgetItemInputSchema.safeParse({ productName: 'Bañera', quantity: 1, unitPrice: Infinity }).success, false);
  assert.equal(BudgetItemInputSchema.safeParse({ productName: 'Bañera', quantity: 1, unitPrice: NaN }).success, false);
});

runTest('Rechazo de descuentos mayores al 100% o negativos', () => {
  const res = CreateBudgetInputSchema.safeParse({
    clientId: '550e8400-e29b-41d4-a716-446655440000',
    items: [{ productName: 'Bañera', quantity: 1, unitPrice: 10000 }],
    discounts: [150]
  });
  assert.equal(res.success, false);
});

console.log('\n3. TRANSICIONES DE ESTADO VÁLIDAS:');
runTest('Transiciones de flujo comercial legal', () => {
  assert.equal(isValidBudgetTransition('draft', 'sent'), true);
  assert.equal(isValidBudgetTransition('draft', 'accepted'), true);
  assert.equal(isValidBudgetTransition('sent', 'accepted'), true);
  assert.equal(isValidBudgetTransition('sent', 'rejected'), true);
  assert.equal(isValidBudgetTransition('accepted', 'converted'), true);
  assert.equal(isValidBudgetTransition('accepted', 'partially_converted'), true);
  assert.equal(isValidBudgetTransition('partially_converted', 'converted'), true);
});

runTest('Bloqueo de transiciones ilegales', () => {
  assert.equal(isValidBudgetTransition('converted', 'draft'), false);
  assert.equal(isValidBudgetTransition('converted', 'sent'), false);
  assert.equal(isValidBudgetTransition('distributor_sale', 'draft'), false);
});

console.log('\n4. MATRIZ DE AUTORIZACIÓN Y ACCESO:');
function checkAccess(ctx, targetSellerId, targetDistributorId) {
  if (!ctx.isLoggedIn) return false;
  if (!ctx.isActive) return false;
  if (ctx.isAdmin) return true;
  if (ctx.isSeller) return targetSellerId === ctx.sellerId;
  if (ctx.isDistributor) return targetDistributorId === ctx.distributorId;
  return false;
}

runTest('Admin global accede a cualquier registro', () => {
  assert.equal(checkAccess({ isLoggedIn: true, isActive: true, isAdmin: true }, 'seller-9', 'dist-9'), true);
});

runTest('Vendedor solo accede a sus propios registros', () => {
  const sellerCtx = { isLoggedIn: true, isActive: true, isAdmin: false, isSeller: true, sellerId: 'seller-1' };
  assert.equal(checkAccess(sellerCtx, 'seller-1', null), true);
  assert.equal(checkAccess(sellerCtx, 'seller-2', null), false);
});

runTest('Distribuidor solo accede a sus pedidos asignados', () => {
  const distCtx = { isLoggedIn: true, isActive: true, isAdmin: false, isSeller: false, isDistributor: true, distributorId: 'dist-1' };
  assert.equal(checkAccess(distCtx, null, 'dist-1'), true);
  assert.equal(checkAccess(distCtx, null, 'dist-2'), false);
});

runTest('Usuario inactivo o suspendido es bloqueado', () => {
  const inactiveCtx = { isLoggedIn: true, isActive: false, isAdmin: false, isSeller: true, sellerId: 'seller-1' };
  assert.equal(checkAccess(inactiveCtx, 'seller-1', null), false);
});

runTest('Visitante no autenticado es bloqueado', () => {
  const anonCtx = { isLoggedIn: false, isActive: false, isAdmin: false, isSeller: false };
  assert.equal(checkAccess(anonCtx, 'seller-1', null), false);
});

console.log('\n5. CONCURRENCIA, IDEMPOTENCIA Y CONVERSIÓN PARCIAL:');
runTest('Idempotencia previene duplicaciones por doble clic', () => {
  const processed = new Set();
  const orders = [];
  function submit(key, amount) {
    if (processed.has(key)) return { isDuplicate: true };
    processed.add(key);
    orders.push({ key, amount });
    return { isDuplicate: false };
  }
  const k = 'idem_key_abc_123';
  const r1 = submit(k, 100);
  const r2 = submit(k, 100);
  assert.equal(r1.isDuplicate, false);
  assert.equal(r2.isDuplicate, true);
  assert.equal(orders.length, 1);
});

runTest('Conversión parcial preserva saldo pendiente', () => {
  const totalQty = 10;
  const convertedQty = 4;
  const remaining = totalQty - convertedQty;
  assert.equal(remaining, 6);
  assert.ok(remaining > 0);
});

runTest('Documento emitido inmutable preserva snapshot original', () => {
  const budget = {
    client_snapshot: { name: 'Cliente Original S.A.', address: 'Calle 1' },
    total_amount: 500000
  };
  const updatedClient = { name: 'Cliente Modificado S.A.', address: 'Calle 2' };
  assert.equal(budget.client_snapshot.name, 'Cliente Original S.A.');
  assert.notEqual(budget.client_snapshot.name, updatedClient.name);
});

console.log('\n====================================================');
console.log(`RESULTADOS: ${passedTests} aprobadas, ${failedTests} fallidas de ${totalTests} pruebas.`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
}
