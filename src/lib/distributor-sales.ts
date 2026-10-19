export type SaleParty={name:string;company_name:string|null;status?:string};
export type DistributorSale={id:string;budget_id?:string|null;budget_number:number;order_id?:string;order_number?:number;status:string;total_amount:number;created_at:string;sale_channel:string;clients:SaleParty|null;sellers:{full_name:string}|null;distributors?:{company_name:string}|null;source:"order"|"historical_note"|"legacy_budget";client_id?:string|null};
type RelatedOrder={id:string;status?:string};
export type LegacyBudget={id:string;budget_number:number;status:string;total_amount:number;created_at:string;client_id:string;clients:SaleParty|null;sellers:{full_name:string}|null;distributors?:{company_name:string}|null;orders?:RelatedOrder[]};
export type LegacySaleNote={id:string;budget_id:string;client_id:string;content:string;created_at:string;budgets:LegacyBudget|null;order_id?:string|null};
export type DistributorOrder={id:string;budget_id?:string|null;client_id?:string|null;order_number:number;status:string;total_amount:number;created_at:string;purchase_date?:string|null;sale_channel?:string|null;order_type?:string|null;clients:SaleParty|null;sellers:{full_name:string}|null;distributors?:{company_name:string}|null};

// Contrato del mensaje automático que emitía el cierre anterior. Nunca inferir importes desde notas libres.
export function legacyDistributorAmount(content:string,budgetNumber:number):number|null {
 const match=/^Se registró la venta por distribuidor desde el presupuesto N° (\d+) por un monto total de \$\s*([\d.]+,\d{2})\.$/u.exec(content.replace(/[\u00a0\u202f]/g," ").trim());
 if(!match||Number(match[1])!==budgetNumber)return null;
 const amount=Number(match[2].replaceAll(".","").replace(",","."));
 return Number.isFinite(amount)&&amount>=0?amount:null;
}

export function projectDistributorSales(orders:DistributorOrder[],notes:LegacySaleNote[],budgets:LegacyBudget[]=[]) {
 const data:DistributorSale[]=[];
 const covered=new Set(orders.map(o=>o.budget_id).filter(Boolean));
 const issues:string[]=[];
 for(const order of orders) {
  if(order.status==="cancelled" || !(order.sale_channel==="distributor"||order.order_type==="distributor_sale"))continue;
  data.push({...order,budget_number:0,order_id:order.id,sale_channel:"distributor",source:"order",created_at:order.purchase_date?`${order.purchase_date}T12:00:00-03:00`:order.created_at});
 }
 const grouped=new Map<string,LegacySaleNote[]>();
 for(const note of notes) {
  if(note.order_id||!note.budgets||note.client_id!==note.budgets.client_id)continue;
  if(covered.has(note.budget_id))continue;
  if(note.budgets.orders?.length) {if(!issues.includes(note.budget_id))issues.push(note.budget_id);continue;}
  const group=grouped.get(note.budget_id)||[];group.push(note);grouped.set(note.budget_id,group);
 }
 for(const [budgetId,group] of grouped) {
  const first=[...group].sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id))[0];
  const budget=first.budgets!;
  const amounts=group.map(note=>legacyDistributorAmount(note.content,budget.budget_number));
  if(amounts.some(a=>a===null)||new Set(amounts.map(a=>Math.round(a!*100))).size!==1) {issues.push(budgetId);covered.add(budgetId);continue;}
  data.push({id:`history-${budgetId}`,budget_id:budgetId,budget_number:budget.budget_number,status:"distributor_sale",total_amount:amounts[0]!,created_at:first.created_at,sale_channel:"distributor",clients:budget.clients,sellers:budget.sellers,distributors:budget.distributors,client_id:budget.client_id,source:"historical_note"});
  covered.add(budgetId);
 }
 for(const budget of budgets) {
  if(budget.status!=="distributor_sale"||covered.has(budget.id)||budget.orders?.length)continue;
  data.push({...budget,budget_id:budget.id,sale_channel:"distributor",source:"legacy_budget"});covered.add(budget.id);
 }
 data.sort((a,b)=>b.created_at.localeCompare(a.created_at)||a.id.localeCompare(b.id));
 return {data,issues};
}
