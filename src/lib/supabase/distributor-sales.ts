"use server";
import {requireCommercialUser} from "./comercial";
import {createSupabaseServerClient} from "./server";
import {projectDistributorSales,type DistributorOrder,type LegacySaleNote,type LegacyBudget} from "@/lib/distributor-sales";

export async function getDistributorSales(sellerId?:string) {
 const ctx=await requireCommercialUser();
 if(sellerId && !(ctx.isAdmin||ctx.isAdministration||ctx.isSeller&&ctx.sellerId===sellerId))throw new Error("No autorizado para consultar las ventas de otro vendedor.");
 const sellerFilter=ctx.isSeller?ctx.sellerId:sellerId;
 const db=await createSupabaseServerClient();
 // Lectura por la sesión del usuario: las políticas RLS se aplican también a las relaciones.
 async function pages<T>(query:(from:number,to:number)=>PromiseLike<{data:unknown;error:{message:string}|null}>) {
  const rows:T[]=[];
  for(let from=0;;from+=500) {
   const result=await query(from,from+499);
   if(result.error)throw new Error(`No se pudieron cargar las ventas por distribuidor: ${result.error.message}`);
   const batch=(result.data||[]) as T[];rows.push(...batch);if(batch.length<500)break;
  }
  return rows;
 }
 const budgetFields="id,budget_number,status,total_amount,created_at,client_id,clients(name,company_name),sellers(full_name),distributors(company_name),orders(id,status)";
 const [orders,notes,budgets,marked]=await Promise.all([
  pages<DistributorOrder>((from,to)=>{
   let query=db.from("orders").select("id,budget_id,client_id,order_number,status,total_amount,created_at,purchase_date,sale_channel,order_type,clients(name,company_name),sellers(full_name),distributors(company_name)").or("sale_channel.eq.distributor,order_type.eq.distributor_sale");
   if(sellerFilter)query=query.eq("seller_id",sellerFilter);
   if(ctx.isDistributor)query=query.eq("distributor_id",ctx.distributorId!);
   return query.order("id").range(from,to);
  }),
  pages<LegacySaleNote>((from,to)=>{
   let query=db.from("client_notes").select(`id,budget_id,client_id,order_id,content,created_at,budgets!inner(${budgetFields})`).eq("note_type","distributor_sale").is("order_id",null);
   if(sellerFilter)query=query.eq("budgets.seller_id",sellerFilter);
   if(ctx.isDistributor)query=query.eq("budgets.distributor_id",ctx.distributorId!);
   return query.order("id").range(from,to);
  }),
  pages<LegacyBudget>((from,to)=>{
   let query=db.from("budgets").select(budgetFields).eq("status","distributor_sale");
   if(sellerFilter)query=query.eq("seller_id",sellerFilter);
   if(ctx.isDistributor)query=query.eq("distributor_id",ctx.distributorId!);
   return query.order("id").range(from,to);
  }),
  pages<{id:string}>((from,to)=>{
   let query=db.from("clients").select("id").in("status",["inactivo","vendido_distribuidor"]);
   if(sellerFilter)query=query.eq("seller_id",sellerFilter);
   return query.order("id").range(from,to);
  })
 ]);
 const result=projectDistributorSales(orders,notes,budgets);
 const represented=new Set(result.data.map(s=>s.client_id));
 return {...result,unresolvedClients:marked.filter(c=>!represented.has(c.id)).length};
}
