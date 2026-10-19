"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {decideOrderRequest} from "@/lib/supabase/order-requests";
export function RequestDecision({id}:{id:string}) {
 const router=useRouter();const [reason,setReason]=useState("");const [error,setError]=useState("");const [pending,setPending]=useState(false);
 async function decide(decision:"approved"|"returned"|"rejected") {
  setPending(true);setError("");
  try{const result=await decideOrderRequest(id,decision,reason);if(result.order_id)router.push(`/administracion/fabricacion/revision?orderId=${result.order_id}`);router.refresh();}
  catch(error){setError(error instanceof Error?error.message:"No se pudo resolver la solicitud");}finally{setPending(false);}
 }
 return <div className="space-y-2 mt-3">
  <label className="block text-sm">Motivo / observaciones<textarea maxLength={2000} value={reason} onChange={event=>setReason(event.target.value)} className="block w-full border rounded p-2"/></label>
  <div className="flex gap-2 flex-wrap">
   <button disabled={pending} onClick={()=>void decide("approved")} className="bg-emerald-700 text-white rounded px-3 py-2">Aceptar pedido y preparar fabricación</button>
   <button disabled={pending} onClick={()=>void decide("returned")} className="border rounded px-3 py-2">Devolver al vendedor</button>
   <button disabled={pending} onClick={()=>void decide("rejected")} className="border rounded px-3 py-2">Rechazar</button>
  </div>
  {error&&<p role="alert" className="text-red-700">{error}</p>}
 </div>;
}
