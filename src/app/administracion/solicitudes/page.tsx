import Link from "next/link";
import {AdministrationShell} from "@/components/administracion/AdministrationShell";
import {getOrderRequests} from "@/lib/supabase/order-requests";
import {formatCurrencyARS} from "@/lib/commercial-calculations";
import {RequestDecision} from "./RequestDecision";
const labels:Record<string,string>={pending:"Pendiente de aceptación",approved:"Aceptada",returned:"Devuelta para corregir",rejected:"Rechazada",all:"Todas"};
export default async function OrderRequestsPage({searchParams}:{searchParams:Promise<{status?:string;page?:string;requestId?:string}>}) {
 const params=await searchParams;const status=params.status&&labels[params.status]?params.status:"pending";
 const result=await getOrderRequests(status,Number(params.page)||1,params.requestId);
 return <AdministrationShell><div className="space-y-5 max-w-5xl mx-auto">
  <h1 className="text-2xl font-bold">Solicitudes de pedido</h1>
  <p>El cliente confirmó. Revisá lo vendido antes de aceptar el pedido y preparar su orden de fabricación.</p>
  <nav className="flex flex-wrap gap-3">{Object.entries(labels).map(([value,label])=><Link key={value} className="underline" href={`?status=${value}`}>{label}</Link>)}</nav>
  <p>{result.total} solicitudes</p>
  {result.data.map(request=>{
   const snapshot=request.commercial_snapshot as {total_amount:number;discounts:number[];tax_rate:number;items:{id:string;product_name:string;variant_name?:string;unit_price:number;configuration:Record<string,unknown>}[]};
   const requested=request.items as {budgetItemId:string;quantity:number;factoryNotes?:string}[];
   return <article id={request.id} key={request.id} className="border rounded bg-white p-5 space-y-2">
    <h2 className="font-bold">Presupuesto #{request.budgets?.budget_number} — {request.budgets?.clients?.name}</h2>
    <p>{labels[request.status]} · Vendedor: {request.submitted_by_name} · {new Date(request.created_at).toLocaleString("es-AR",{timeZone:"America/Argentina/Buenos_Aires"})}</p>
    <table className="w-full text-sm"><thead><tr><th>Producto y configuración</th><th>Cantidad</th><th>Precio cotizado por unidad</th></tr></thead><tbody>
     {requested.map((line,index)=>{const item=snapshot.items.find(item=>item.id===line.budgetItemId);return <tr key={index}><td className="p-2">{item?.product_name} {item?.variant_name}<p>{JSON.stringify(item?.configuration||{})}</p><p>{line.factoryNotes}</p></td><td>{line.quantity}</td><td>{formatCurrencyARS(item?.unit_price||0)}</td></tr>;})}
    </tbody></table>
    <p>Importe neto del presupuesto completo: {formatCurrencyARS(snapshot.total_amount)} · Descuentos: {(snapshot.discounts||[]).join("% + ")||"0"}% · IVA: {snapshot.tax_rate}%</p>
    <p className="text-sm">Si el pedido es parcial, el importe del pedido se asigna al aceptarlo según las cantidades seleccionadas.</p>
    {request.notes&&<p>Observaciones: {request.notes}</p>}
    {request.decision_reason&&<p>Motivo: {request.decision_reason}</p>}
    {request.decided_by_name&&<p>Resuelta por {request.decided_by_name} · {new Date(request.decided_at).toLocaleString("es-AR",{timeZone:"America/Argentina/Buenos_Aires"})}</p>}
    {request.order_id&&<Link className="underline" href={`/administracion/pedidos/${request.order_id}`}>Ver pedido aceptado</Link>}
    {request.status==="pending"&&<RequestDecision id={request.id}/>}
   </article>;
  })}
  {!result.data.length&&<p>No hay solicitudes en este estado.</p>}
  <div className="flex gap-4">{result.page>1&&<Link href={`?status=${status}&page=${result.page-1}`}>Anterior</Link>}{result.page*20<result.total&&<Link href={`?status=${status}&page=${result.page+1}`}>Siguiente</Link>}</div>
 </div></AdministrationShell>;
}
