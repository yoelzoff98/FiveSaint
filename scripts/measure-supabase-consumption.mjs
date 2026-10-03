import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

// Cargar variables de entorno
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function measureQuery(name, queryFn) {
  const start = performance.now();
  const result = await queryFn();
  const duration = performance.now() - start;

  if (result.error) {
    throw new Error(`Error en ${name}: ${result.error.message}`);
  }

  const payload = JSON.stringify(result.data);
  const bytes = Buffer.byteLength(payload, 'utf8');
  const rowCount = Array.isArray(result.data) ? result.data.length : 1;

  return {
    name,
    durationMs: Math.round(duration * 10) / 10,
    bytes,
    kb: Math.round((bytes / 1024) * 10) / 10,
    rowCount
  };
}

async function runBenchmark() {
  console.log('================================================================');
  console.log('    MEDICIÓN REAL DE RENDIMIENTO Y CONSUMO DE RED EN SUPABASE   ');
  console.log('================================================================\n');

  console.log('Ejecutando mediciones reproducibles contra la instancia de Supabase...\n');

  // 1. Presupuestos: Completo anterior vs Paginado optimizado
  const budgetsFull = await measureQuery('Listado Presupuestos (Anterior: select *)', () => {
    return supabase.from('budgets').select(`
      *,
      clients(*),
      sellers(*),
      distributors(*)
    `);
  });

  // Consultar una fila de budgets y orders para ver las columnas reales
  const { data: sampleBudget } = await supabase.from('budgets').select('*').limit(1);
  if (sampleBudget && sampleBudget[0]) {
    console.log('Columnas reales en budgets:', Object.keys(sampleBudget[0]));
  }
  const { data: sampleClient } = await supabase.from('clients').select('*').limit(1);
  if (sampleClient && sampleClient[0]) {
    console.log('Columnas reales en clients:', Object.keys(sampleClient[0]));
  }

  const budgetsPaginated = await measureQuery('Listado Presupuestos (Optimizado: paginado 20 filas)', () => {
    return supabase.from('budgets').select(`
      id,
      budget_number,
      status,
      total_amount,
      discounts,
      created_at,
      client_id,
      seller_id,
      distributor_id,
      clients(id, name, company_name),
      sellers(id, full_name),
      distributors(id, company_name)
    `, { count: 'exact' }).range(0, 19).order('created_at', { ascending: false });
  });

  // 2. Pedidos: Completo anterior vs Paginado optimizado
  const ordersFull = await measureQuery('Listado Pedidos (Anterior: select *)', () => {
    return supabase.from('orders').select(`
      *,
      clients(*),
      sellers(*),
      distributors(*)
    `);
  });

  const ordersPaginated = await measureQuery('Listado Pedidos (Optimizado: paginado 20 filas)', () => {
    return supabase.from('orders').select(`
      id,
      order_number,
      status,
      total_amount,
      created_at,
      client_id,
      seller_id,
      distributor_id,
      budget_id,
      clients(id, name, company_name),
      sellers(id, full_name),
      distributors(id, company_name)
    `, { count: 'exact' }).range(0, 19).order('created_at', { ascending: false });
  });

  // 3. Métricas del Dashboard: Anterior (3 consultas completas) vs Optimizado (columnas de agregación)
  const dashboardFullStart = performance.now();
  const [dbClients, dbBudgets, dbOrders] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('budgets').select('*'),
    supabase.from('orders').select('*')
  ]);
  const dashboardFullDuration = Math.round((performance.now() - dashboardFullStart) * 10) / 10;
  const dashboardFullBytes = Buffer.byteLength(JSON.stringify({ c: dbClients.data, b: dbBudgets.data, o: dbOrders.data }), 'utf8');

  const dashboardOptimizedStart = performance.now();
  const [optClients, optBudgets, optOrders] = await Promise.all([
    supabase.from('clients').select('id, created_at, updated_at'),
    supabase.from('budgets').select('id, client_id, status, total_amount, created_at'),
    supabase.from('orders').select('id, client_id, status, total_amount, budget_id, created_at')
  ]);
  const dashboardOptimizedDuration = Math.round((performance.now() - dashboardOptimizedStart) * 10) / 10;
  const dashboardOptimizedBytes = Buffer.byteLength(JSON.stringify({ c: optClients.data, b: optBudgets.data, o: optOrders.data }), 'utf8');

  // Imprimir reporte de mediciones reales
  console.log('| Operación | Tipo de Métrica | Filas | Bytes | Tamaño KB | Latencia (ms) |');
  console.log('| :--- | :---: | :---: | :---: | :---: | :---: |');
  console.log(`| Presupuestos (Select *) | [MEDIDO REAL] | ${budgetsFull.rowCount} | ${budgetsFull.bytes} B | ${budgetsFull.kb} KB | ${budgetsFull.durationMs} ms |`);
  console.log(`| Presupuestos (Paginado 20) | [MEDIDO REAL] | ${budgetsPaginated.rowCount} | ${budgetsPaginated.bytes} B | ${budgetsPaginated.kb} KB | ${budgetsPaginated.durationMs} ms |`);
  console.log(`| Pedidos (Select *) | [MEDIDO REAL] | ${ordersFull.rowCount} | ${ordersFull.bytes} B | ${ordersFull.kb} KB | ${ordersFull.durationMs} ms |`);
  console.log(`| Pedidos (Paginado 20) | [MEDIDO REAL] | ${ordersPaginated.rowCount} | ${ordersPaginated.bytes} B | ${ordersPaginated.kb} KB | ${ordersPaginated.durationMs} ms |`);
  console.log(`| Dashboard Completo (3 tablas *) | [MEDIDO REAL] | ${dbClients.data.length + dbBudgets.data.length + dbOrders.data.length} | ${dashboardFullBytes} B | ${Math.round((dashboardFullBytes / 1024) * 10) / 10} KB | ${dashboardFullDuration} ms |`);
  console.log(`| Dashboard Agregaciones (Columnas mínimas) | [MEDIDO REAL] | ${optClients.data.length + optBudgets.data.length + optOrders.data.length} | ${dashboardOptimizedBytes} B | ${Math.round((dashboardOptimizedBytes / 1024) * 10) / 10} KB | ${dashboardOptimizedDuration} ms |`);

  console.log('\n--- REDUCCIONES REALES MEDIDAS ---');
  const budgetBytesReduction = Math.round((1 - (budgetsPaginated.bytes / budgetsFull.bytes)) * 100);
  const dashboardBytesReduction = Math.round((1 - (dashboardOptimizedBytes / dashboardFullBytes)) * 100);
  console.log(`- Reducción de bytes en Presupuestos: ${budgetBytesReduction}% [MEDIDO REAL en base actual]`);
  console.log(`- Reducción de bytes en Dashboard: ${dashboardBytesReduction}% [MEDIDO REAL en base actual]`);

  console.log('\n--- ESTIMACIONES ANALÍTICAS PROYECTADAS (Histórico 5.000 presupuestos) ---');
  console.log('- [ESTIMACIÓN PROYECTADA] Tráfico presupuestos sin paginar: ~3.8 MB por apertura de pantalla.');
  console.log('- [ESTIMACIÓN PROYECTADA] Tráfico presupuestos paginado: ~18 KB constante.');
  console.log('- [ESTIMACIÓN PROYECTADA] Reducción a escala: > 99.5% de ahorro de ancho de banda Supabase.');
}

runBenchmark().catch(err => {
  console.error('Error en medición:', err);
  process.exit(1);
});
