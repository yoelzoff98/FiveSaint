"use server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireCommercialUser } from "./comercial";
import { requireAdministrationUser } from "./administration";
import { createSupabaseAdminClient } from "./server";
import { ConvertBudgetInputSchema } from "@/lib/validations/commercial";

export async function submitOrderRequest(input: { budgetId:string; itemsToConvert:{budgetItemId:string;quantity:number;factoryNotes?:string}[]; notes?:string; idempotencyKey?:string }) {
 const ctx=await requireCommercialUser();
 if (!ctx.isSeller) throw new Error("Solo el vendedor puede levantar esta solicitud.");
 const parsed=ConvertBudgetInputSchema.parse({...input,saleType:"direct"});
 const hash=crypto.createHash("sha256").update(JSON.stringify({budget:parsed.budgetId,items:parsed.itemsToConvert,notes:parsed.notes||null})).digest("hex");
 const {data,error}=await createSupabaseAdminClient().rpc("submit_order_request",{p_user_id:ctx.user!.id,p_budget_id:parsed.budgetId,p_items:parsed.itemsToConvert,p_notes:parsed.notes||null,p_key:parsed.idempotencyKey||crypto.randomUUID(),p_hash:hash});
 if(error) throw new Error(error.message);
 revalidatePath("/administracion/solicitudes");
 return data;
}

export async function decideOrderRequest(id:string,decision:"approved"|"returned"|"rejected",reason?:string) {
 const ctx=await requireAdministrationUser();
 if(reason && reason.length>2000) throw new Error("El motivo no puede exceder 2000 caracteres.");
 if(!["approved","returned","rejected"].includes(decision)) throw new Error("Decisión inválida.");
 if(decision!=="approved" && (!reason || reason.trim().length<3)) throw new Error("Indicá el motivo.");
 const {data,error}=await createSupabaseAdminClient().rpc("decide_order_request",{p_user_id:ctx.user!.id,p_request_id:id,p_decision:decision,p_reason:reason?.trim()||null});
 if(error) throw new Error(error.message);
 for(const path of ["/administracion/solicitudes","/administracion/pedidos","/administracion/fabricacion","/admin-comercial/presupuestos"]) revalidatePath(path);
 return data;
}

export async function getOrderRequests(status="pending",page=1,requestId?:string) {
 await requireAdministrationUser();
 const current=Math.max(1,Math.floor(Number(page)||1));
 let query=createSupabaseAdminClient().from("order_requests").select("*,budgets(budget_number,clients(name,company_name))",{count:"exact"});
 if(requestId) query=query.eq("id",requestId);
 if(status!=="all") query=query.eq("status",status);
 const {data,error,count}=await query.order("created_at",{ascending:false}).range((current-1)*20,current*20-1);
 if(error) throw new Error(error.message);
 return {data:data||[],total:count||0,page:current};
}

export async function getRequestNotifications() {
 const ctx=await requireCommercialUser();
 const {data,error,count}=await createSupabaseAdminClient().from("order_request_notifications")
 .select("id,request_id,event,title,message,is_read,created_at,order_requests(budget_id)",{count:"exact"})
 .eq("recipient_user_id",ctx.user!.id).eq("is_read",false).order("created_at",{ascending:false}).limit(8);
 if(error) throw new Error(error.message);
 return {data:data||[],count:count||0,userId:ctx.user!.id,isAdministration:ctx.isAdmin||ctx.isAdministration};
}

export async function markRequestNotificationRead(id:string) {
 const ctx=await requireCommercialUser();
 const {error}=await createSupabaseAdminClient().from("order_request_notifications").update({is_read:true}).eq("id",id).eq("recipient_user_id",ctx.user!.id);
 if(error) throw new Error(error.message);
}
