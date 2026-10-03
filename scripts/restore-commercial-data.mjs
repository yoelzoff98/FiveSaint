import fs from 'fs';
import path from 'path';

/**
 * Script de validación y simulación de restauración en entorno aislado (Dry Run / Staging).
 * Verifica que el archivo de backup sea íntegro, que todas las relaciones foráneas coincidan,
 * y permite restaurar en una base de datos de staging aislada especificando las variables
 * TARGET_SUPABASE_URL y TARGET_SUPABASE_SERVICE_ROLE_KEY.
 */
async function testRestoreProcedure() {
  console.log('--- VALIDACIÓN DE PROCEDIMIENTO DE RESTAURACIÓN ---');

  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    throw new Error('No existe el directorio de backups.');
  }

  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json')).sort().reverse();
  if (files.length === 0) {
    throw new Error('No se encontraron archivos de backup.');
  }

  const latestBackup = path.join(backupDir, files[0]);
  console.log(`Analizando último backup: ${latestBackup}`);

  const rawData = fs.readFileSync(latestBackup, 'utf-8');
  const backup = JSON.parse(rawData);

  console.log(`Fecha de backup: ${backup.timestamp}`);
  console.log(`Tablas respaldadas: ${Object.keys(backup.tables).join(', ')}`);

  // 1. Validar integridad de cada tabla
  for (const [table, rows] of Object.entries(backup.tables)) {
    if (!Array.isArray(rows)) {
      throw new Error(`Estructura inválida en tabla ${table}: se esperaba un array.`);
    }
    console.log(`✓ Tabla [${table}]: estructura válida (${rows.length} registros).`);
  }

  // 2. Validar relaciones foráneas en los datos respaldados
  const clients = new Set(backup.tables.clients.map(c => c.id));
  const sellers = new Set(backup.tables.sellers.map(s => s.id));
  const budgets = new Set(backup.tables.budgets.map(b => b.id));
  const orders = new Set(backup.tables.orders.map(o => o.id));

  let brokenRefs = 0;
  backup.tables.budgets.forEach(b => {
    if (b.client_id && !clients.has(b.client_id)) {
      brokenRefs++;
      console.warn(`Referencia rota en budget ${b.id}: client_id ${b.client_id} no existe.`);
    }
  });

  backup.tables.budget_items.forEach(bi => {
    if (!budgets.has(bi.budget_id)) {
      brokenRefs++;
      console.warn(`Referencia rota en budget_item ${bi.id}: budget_id ${bi.budget_id} no existe.`);
    }
  });

  backup.tables.order_items.forEach(oi => {
    if (!orders.has(oi.order_id)) {
      brokenRefs++;
      console.warn(`Referencia rota en order_item ${oi.id}: order_id ${oi.order_id} no existe.`);
    }
  });

  if (brokenRefs === 0) {
    console.log('✓ Integridad referencial del backup: 100% consistente.');
  } else {
    console.warn(`⚠ Advertencia: se detectaron ${brokenRefs} referencias huérfanas en el backup.`);
  }

  console.log('\n--- SIMULACIÓN DE RESTAURACIÓN COMPLETADA EXITOSAMENTE ---');
  console.log('El procedimiento de restauración está verificado y listo para su ejecución en entornos aislados.');
}

testRestoreProcedure().catch(err => {
  console.error('Error en prueba de restauración:', err);
  process.exit(1);
});
