import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const TABLES = [
  'admin_users',
  'sellers',
  'distributors',
  'clients',
  'client_notes',
  'budgets',
  'budget_items',
  'orders',
  'order_items',
  'product_categories',
  'products',
  'product_variants'
];

async function runBackup() {
  console.log('--- INICIANDO BACKUP DE TABLAS COMERCIALES (SOLO LECTURA) ---');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupData = {
    timestamp: new Date().toISOString(),
    source_url: url,
    tables: {},
    summary: {}
  };

  for (const table of TABLES) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' });

    if (error) {
      console.error(`Error al exportar tabla ${table}:`, error.message);
      throw error;
    }

    backupData.tables[table] = data || [];
    backupData.summary[table] = {
      count: data ? data.length : 0,
      exact_reported_count: count
    };
    console.log(`✓ Tabla [${table}]: ${data.length} registros exportados.`);
  }

  const backupFilePath = path.join(backupDir, `commercial_backup_${timestamp}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`\nBackup guardado exitosamente en: ${backupFilePath}`);
  console.log('Resumen de registros:', backupData.summary);

  return backupFilePath;
}

runBackup().catch((err) => {
  console.error('Fallo en backup:', err);
  process.exit(1);
});
