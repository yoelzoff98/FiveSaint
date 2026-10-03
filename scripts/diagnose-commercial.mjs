import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function diagnose() {
  console.log('--- STARTING READ-ONLY DIAGNOSTIC ---');

  // Fetch all budgets
  const { data: budgets, error: bErr } = await supabase.from('budgets').select('*');
  const { data: budgetItems, error: biErr } = await supabase.from('budget_items').select('*');
  const { data: orders, error: oErr } = await supabase.from('orders').select('*');
  const { data: orderItems, error: oiErr } = await supabase.from('order_items').select('*');
  const { data: clients, error: cErr } = await supabase.from('clients').select('*');
  const { data: sellers, error: sErr } = await supabase.from('sellers').select('*');
  const { data: distributors, error: dErr } = await supabase.from('distributors').select('*');

  if (bErr || biErr || oErr || oiErr || cErr || sErr || dErr) {
    console.error('Error fetching tables:', { bErr, biErr, oErr, oiErr, cErr, sErr, dErr });
    return;
  }

  console.log('Total budgets:', budgets?.length);
  console.log('Total budget_items:', budgetItems?.length);
  console.log('Total orders:', orders?.length);
  console.log('Total order_items:', orderItems?.length);
  console.log('Total clients:', clients?.length);
  console.log('Total sellers:', sellers?.length);
  console.log('Total distributors:', distributors?.length);

  const clientIds = new Set(clients.map(c => c.id));
  const sellerIds = new Set(sellers.map(s => s.id));
  const budgetIds = new Set(budgets.map(b => b.id));
  const orderIds = new Set(orders.map(o => o.id));

  // 1. Presupuestos sin items
  const itemsByBudget = new Map();
  budgetItems.forEach(bi => {
    if (!itemsByBudget.has(bi.budget_id)) itemsByBudget.set(bi.budget_id, []);
    itemsByBudget.get(bi.budget_id).push(bi);
  });

  const budgetsWithoutItems = budgets.filter(b => !itemsByBudget.has(b.id) || itemsByBudget.get(b.id).length === 0);
  console.log('\n1. Presupuestos sin items:', budgetsWithoutItems.length);
  if (budgetsWithoutItems.length > 0) {
    console.log(budgetsWithoutItems.map(b => ({ id: b.id, num: b.budget_number, status: b.status, total: b.total_amount })));
  }

  // 2. Pedidos sin items
  const itemsByOrder = new Map();
  orderItems.forEach(oi => {
    if (!itemsByOrder.has(oi.order_id)) itemsByOrder.set(oi.order_id, []);
    itemsByOrder.get(oi.order_id).push(oi);
  });

  const ordersWithoutItems = orders.filter(o => !itemsByOrder.has(o.id) || itemsByOrder.get(o.id).length === 0);
  console.log('\n2. Pedidos sin items:', ordersWithoutItems.length);
  if (ordersWithoutItems.length > 0) {
    console.log(ordersWithoutItems.map(o => ({ id: o.id, num: o.order_number, total: o.total_amount })));
  }

  // 3. Posibles pedidos duplicados
  const ordersByBudget = new Map();
  orders.forEach(o => {
    if (o.budget_id) {
      if (!ordersByBudget.has(o.budget_id)) ordersByBudget.set(o.budget_id, []);
      ordersByBudget.get(o.budget_id).push(o);
    }
  });

  const duplicateBudgetOrders = [];
  ordersByBudget.forEach((ordList, bId) => {
    if (ordList.length > 1) {
      duplicateBudgetOrders.push({
        budget_id: bId,
        orderCount: ordList.length,
        orders: ordList.map(o => ({ id: o.id, num: o.order_number, created: o.created_at, total: o.total_amount }))
      });
    }
  });
  console.log('\n3. Presupuestos con multiples pedidos asociados:', duplicateBudgetOrders.length);
  if (duplicateBudgetOrders.length > 0) {
    console.log(JSON.stringify(duplicateBudgetOrders, null, 2));
  }

  // 4. Referencias invalidas
  const budgetsWithInvalidClient = budgets.filter(b => b.client_id && !clientIds.has(b.client_id));
  const budgetsWithInvalidSeller = budgets.filter(b => b.seller_id && !sellerIds.has(b.seller_id));
  const ordersWithInvalidClient = orders.filter(o => o.client_id && !clientIds.has(o.client_id));
  const ordersWithInvalidSeller = orders.filter(o => o.seller_id && !sellerIds.has(o.seller_id));
  const ordersWithInvalidBudget = orders.filter(o => o.budget_id && !budgetIds.has(o.budget_id));

  console.log('\n4. Referencias invalidas:');
  console.log('Budgets con client_id invalido:', budgetsWithInvalidClient.length);
  console.log('Budgets con seller_id invalido:', budgetsWithInvalidSeller.length);
  console.log('Orders con client_id invalido:', ordersWithInvalidClient.length);
  console.log('Orders con seller_id invalido:', ordersWithInvalidSeller.length);
  console.log('Orders con budget_id invalido:', ordersWithInvalidBudget.length);

  // 5. Comparacion de totales y calculos
  let totalDiscrepancies = 0;
  budgets.forEach(b => {
    const items = itemsByBudget.get(b.id) || [];
    const rawSum = items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unit_price)), 0);
    let discountedSum = rawSum;
    const discounts = Array.isArray(b.discounts) ? b.discounts : [];
    discounts.forEach(d => {
      if (d > 0) discountedSum *= (1 - d / 100);
    });
    const diff = Math.abs(discountedSum - Number(b.total_amount));
    if (diff > 0.05) {
      totalDiscrepancies++;
      if (totalDiscrepancies <= 5) {
        console.log(`Discrepancia budget #${b.budget_number}: rawSum=${rawSum}, discountedSum=${discountedSum.toFixed(2)}, stored=${b.total_amount}, diff=${diff.toFixed(2)}, discounts=${JSON.stringify(b.discounts)}`);
      }
    }
  });
  console.log('\n5. Presupuestos con discrepancia entre calculo y total_amount:', totalDiscrepancies);

  // 6. Estados de presupuestos vs pedidos
  const convertedBudgets = budgets.filter(b => b.status === 'converted');
  const convertedWithoutOrders = convertedBudgets.filter(b => !ordersByBudget.has(b.id));
  console.log('\n6. Presupuestos status=converted:', convertedBudgets.length);
  console.log('Presupuestos status=converted SIN ningun pedido asociado:', convertedWithoutOrders.length);
  if (convertedWithoutOrders.length > 0) {
    console.log(convertedWithoutOrders.map(b => ({ id: b.id, num: b.budget_number, total: b.total_amount })));
  }

  // Distribución de statuses de budgets
  const statusCounts = {};
  budgets.forEach(b => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });
  console.log('\n7. Distribución de statuses en budgets:', statusCounts);

  // Distribución de statuses en orders
  const orderStatusCounts = {};
  orders.forEach(o => { orderStatusCounts[o.status] = (orderStatusCounts[o.status] || 0) + 1; });
  console.log('\n8. Distribución de statuses en orders:', orderStatusCounts);

  // Descuentos usados
  const discountsUsed = budgets.map(b => b.discounts).filter(d => Array.isArray(d) && d.length > 0);
  console.log('\n9. Cantidad de budgets con descuentos:', discountsUsed.length);
  console.log('Muestra de descuentos:', discountsUsed.slice(0, 5));

  // IVA o campos fiscales
  console.log('\n10. Inspección de campos fiscales o IVA:');
  const budgetSample = budgets[0];
  console.log('Campos en budget:', Object.keys(budgetSample));
  const budgetItemSample = budgetItems[0];
  console.log('Campos en budget_item:', Object.keys(budgetItemSample));
  const orderSample = orders[0];
  console.log('Campos en order:', Object.keys(orderSample));
  const orderItemSample = orderItems[0];
  console.log('Campos en order_item:', Object.keys(orderItemSample));
}

diagnose();
