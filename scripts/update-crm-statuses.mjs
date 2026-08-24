import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envLocal = '';
try {
  envLocal = fs.readFileSync('.env.local', 'utf8');
} catch (e) {
  try {
    envLocal = fs.readFileSync('.env', 'utf8');
  } catch (err) {}
}

const envVars = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    envVars[key] = val;
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ Error: Credenciales no encontradas en .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function updateCrmStatuses() {
  console.log('🚀 Actualizando estados CRM en la Base de Datos Supabase...');

  // 1. Obtener todos los clientes
  const { data: clients, error: clientErr } = await supabase.from('clients').select('id, name, status');
  if (clientErr) {
    console.error('❌ Error al consultar clientes:', clientErr.message);
    return;
  }

  console.log(`📋 Total de clientes en BD: ${clients.length}`);

  let updatedCount = 0;
  for (const client of clients) {
    const s = client.status ? client.status.toLowerCase() : '';
    if (s === 'ganado' || s === 'ganada') {
      const { error: updErr } = await supabase
        .from('clients')
        .update({ status: 'vendido', updated_at: new Date().toISOString() })
        .eq('id', client.id);

      if (updErr) {
        console.error(`  ❌ Error actualizando cliente ${client.name}:`, updErr.message);
      } else {
        console.log(`  ✅ Cliente '${client.name}' actualizó estado: '${client.status}' ➡️ 'vendido'`);
        updatedCount++;
      }
    }
  }

  // 2. Revisar clientes que tienen presupuestos en estado 'converted' o 'accepted' o con pedidos generados
  const { data: convertedBudgets } = await supabase
    .from('budgets')
    .select('client_id, status')
    .in('status', ['converted', 'accepted']);

  if (convertedBudgets && convertedBudgets.length > 0) {
    const clientIdsWithSales = [...new Set(convertedBudgets.map(b => b.client_id))];
    console.log(`\n🔍 Clientes con presupuestos vendidos/convertidos: ${clientIdsWithSales.length}`);

    for (const clientId of clientIdsWithSales) {
      const { data: c } = await supabase
        .from('clients')
        .select('id, name, status')
        .eq('id', clientId)
        .single();

      if (c && c.status !== 'vendido' && c.status !== 'vendido_distribuidor') {
        await supabase
          .from('clients')
          .update({ status: 'vendido', updated_at: new Date().toISOString() })
          .eq('id', c.id);
        console.log(`  ✅ Cliente con ventas '${c.name}' actualizado a 'vendido' (Estado anterior: '${c.status}')`);
        updatedCount++;
      }
    }
  }

  console.log(`\n🎉 Finalizado. Total de clientes actualizados a 'vendido': ${updatedCount}`);
}

updateCrmStatuses();
