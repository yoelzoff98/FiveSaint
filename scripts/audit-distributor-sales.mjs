// Auditoría de solo lectura. El resultado privado se guarda fuera del repositorio.
import nextEnv from '@next/env';
import {createClient} from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {projectDistributorSales} from '../src/lib/distributor-sales.ts';

nextEnv.loadEnvConfig(process.cwd());
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
async function read(query){
 const result=[];
 for(let from=0;;from+=500){const {data,error}=await query(from,from+499);if(error)throw error;result.push(...data);if(data.length<500)break;}
 return result;
}
const fields='id,budget_number,status,total_amount,created_at,client_id,clients(name,company_name),sellers(full_name),distributors(company_name),orders(id,status)';
const [orders,notes,budgets,marked]=await Promise.all([
 read((from,to)=>db.from('orders').select('id,budget_id,client_id,order_number,status,total_amount,created_at,purchase_date,sale_channel,order_type,clients(name,company_name),sellers(full_name),distributors(company_name)').or('sale_channel.eq.distributor,order_type.eq.distributor_sale').order('id').range(from,to)),
 read((from,to)=>db.from('client_notes').select(`id,budget_id,client_id,order_id,content,created_at,budgets!inner(${fields})`).eq('note_type','distributor_sale').is('order_id',null).order('id').range(from,to)),
 read((from,to)=>db.from('budgets').select(fields).eq('status','distributor_sale').order('id').range(from,to)),
 read((from,to)=>db.from('clients').select('id,name').in('status',['inactivo','vendido_distribuidor']).order('id').range(from,to))
]);
const projection=projectDistributorSales(orders,notes,budgets);
const represented=new Set(projection.data.map(s=>s.client_id));
const report={created_at:new Date().toISOString(),read_only:true,noteCount:notes.length,projection,unresolved:marked.filter(c=>!represented.has(c.id)),totalCents:projection.data.reduce((sum,sale)=>sum+Math.round(sale.total_amount*100),0)};
const directory=path.join(os.homedir(),'.codex','backups','fivesaint');fs.mkdirSync(directory,{recursive:true});
const output=path.join(directory,`distributor-sales-audit-${report.created_at.replaceAll(':','-')}.json`);
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({readOnly:true,canonicalOrders:orders.length,historicalNotes:notes.length,verifiedSales:projection.data.length,total:report.totalCents/100,conflictingBudgets:projection.issues.length,unresolvedClients:report.unresolved.length,report:output},null,2));
