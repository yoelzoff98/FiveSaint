"use client";
import { useEffect,useState,useRef,useId } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getRequestNotifications,markRequestNotificationRead } from "@/lib/supabase/order-requests";

type CommercialNotification = {id:string; order_id:string|null; title:string; message:string; is_read:boolean};

export function OrderRequestNotifications({includeCommercialNotifications=false}:{includeCommercialNotifications?:boolean}) {
 const router=useRouter();
 const dropdownRef=useRef<HTMLDivElement>(null);
 const panelId=useId();
 const [commercial,setCommercial]=useState<CommercialNotification[]>([]);
 const [feed,setFeed]=useState<Awaited<ReturnType<typeof getRequestNotifications>>|null>(null);
 const [open,setOpen]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!dropdownRef.current?.contains(event.target as Node))setOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
  document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);
  return ()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};
 },[open]);
 useEffect(()=>{
  if(!includeCommercialNotifications)return;
  let alive=true;
  const db=createSupabaseBrowserClient();
  const refresh=async()=>{
   const {data,error:fetchError}=await db.from("notifications").select("id,order_id,title,message,is_read").order("created_at",{ascending:false}).limit(10);
   if(alive&&data&&!fetchError)setCommercial(data);
  };
  void refresh();
  const channel=db.channel("commercial-bell-notifications").on("postgres_changes",{event:"*",schema:"public",table:"notifications"},()=>{void refresh();}).subscribe(status=>{if(status==="SUBSCRIBED")void refresh();});
  const focus=()=>void refresh();window.addEventListener("focus",focus);
  return ()=>{alive=false;window.removeEventListener("focus",focus);void db.removeChannel(channel);};
 },[includeCommercialNotifications]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(""),10000);return ()=>clearTimeout(timer);},[notice]);
 useEffect(()=>{
  let alive=true;
  const db=createSupabaseBrowserClient();
  let channel:ReturnType<typeof db.channel>|undefined;
  const refresh=async()=>{try{const result=await getRequestNotifications();if(alive){setFeed(result);setError("");}return result;}catch{if(alive)setError("No se pudieron actualizar las solicitudes.");}};
  void refresh().then(result=>{
   if(!alive||!result)return;
   channel=db.channel(`request-alerts-${result.userId}`).on("postgres_changes",{event:"*",schema:"public",table:"order_request_notifications",filter:`recipient_user_id=eq.${result.userId}`},event=>{if(event.eventType==="INSERT")setNotice(String((event.new as {title?:string}).title||"Nueva novedad de pedido"));void refresh();router.refresh();}).subscribe(status=>{if(status==="SUBSCRIBED")void refresh();});
  });
  const focus=()=>void refresh();window.addEventListener("focus",focus);
  return ()=>{alive=false;window.removeEventListener("focus",focus);if(channel)void db.removeChannel(channel);};
 },[router]);
 const unreadCount=(feed?.count||0)+commercial.filter(item=>!item.is_read).length;
 return <div className="relative" ref={dropdownRef}>
  {notice&&<div role="status" className="fixed bottom-5 right-5 bg-orange-50 border border-orange-400 rounded shadow p-4 z-50"><strong>{notice}</strong><button onClick={()=>{setOpen(true);setNotice("");}} className="underline ml-3">Ver</button><button aria-label="Cerrar aviso" onClick={()=>setNotice("")} className="ml-3">×</button></div>}
  <button type="button" aria-expanded={open} aria-controls={panelId} onClick={()=>setOpen(previous=>!previous)} className="relative p-2 rounded-full text-stone-600 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-orange-600" aria-label={`Notificaciones: ${unreadCount} sin leer`} title="Notificaciones">
   <Bell className="w-5 h-5" aria-hidden="true" />
   {unreadCount>0&&<span aria-hidden="true" className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount>99?"99+":unreadCount}</span>}
  </button>
  {open&&<div id={panelId} className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-auto bg-white border rounded-xl shadow-lg p-3 z-50" role="region" aria-label="Notificaciones">
   <h2 className="font-semibold border-b pb-2 mb-2">Notificaciones</h2>
   {error&&<p role="alert">{error}</p>}
   {!feed?.data.length&&!commercial.length&&<p className="text-sm text-stone-500">Sin novedades pendientes.</p>}
   {feed?.data.map(notification=><div key={notification.id} className="border-b py-2 text-sm">
    <Link onClick={()=>{void markRequestNotificationRead(notification.id).then(()=>setFeed(previous=>previous?{...previous,count:Math.max(0,previous.count-1),data:previous.data.filter(item=>item.id!==notification.id)}:previous)).catch(()=>setError("No se pudo marcar el aviso como leído."));setOpen(false);}}
     href={feed.isAdministration?`/administracion/solicitudes?status=all&requestId=${notification.request_id}`:`/admin-comercial/presupuestos/${(notification.order_requests as unknown as {budget_id:string})?.budget_id}`}>
     <strong>{notification.title}</strong><p>{notification.message}</p>
    </Link>
   </div>)}
   {commercial.map(notification=><Link key={`commercial-${notification.id}`} href={notification.order_id?`/admin-comercial/pedidos/${notification.order_id}`:"/admin-comercial/pedidos"} className={`block border-b py-2 text-sm ${notification.is_read?"text-stone-500":"bg-orange-50"}`} onClick={()=>{
    setOpen(false);
    if(notification.is_read)return;
    void createSupabaseBrowserClient().from("notifications").update({is_read:true}).eq("id",notification.id).then(({error:readError})=>{
     if(readError){setError("No se pudo marcar el aviso como leído.");return;}
     setCommercial(previous=>previous.map(item=>item.id===notification.id?{...item,is_read:true}:item));
    });
   }}><strong>{notification.title}</strong><p>{notification.message}</p></Link>)}
   {feed?.isAdministration&&<Link onClick={()=>setOpen(false)} className="block mt-3 underline" href="/administracion/solicitudes">Revisar solicitudes pendientes</Link>}
  </div>}
 </div>;
}
