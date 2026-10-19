"use client";

import {useEffect, useRef, useState} from "react";
import {CLIENT_CATEGORIES} from "@/lib/client-categories";
import {updateClientAdmin} from "@/lib/supabase/manufacturing";

type EditableClient={id:string;name:string;company_name?:string|null;category?:string;email?:string|null;phone?:string|null;address?:string|null;notes?:string|null};

export function EditClientDialog({client,onClose,onSaved}:{client:EditableClient;onClose:()=>void;onSaved:(updated:EditableClient)=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{dialog.current?.showModal();},[]);
 return <dialog ref={dialog} aria-labelledby="edit-client-title" onCancel={event=>{event.preventDefault();if(!busy)onClose();}} className="m-auto w-[calc(100%_-_2rem)] max-w-xl max-h-[90vh] overflow-auto rounded-2xl p-6 border border-stone-200 backdrop:bg-black/40">
  <h2 id="edit-client-title" className="text-xl font-bold mb-1">Editar cliente</h2>
  <p className="text-sm text-stone-500 mb-5">Actualizá los datos de contacto y la información del cliente.</p>
  <form onSubmit={async event=>{
   event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);setError("");
   try {
    const updated=await updateClientAdmin(client.id,{
     name:String(form.get("name")||""),company_name:String(form.get("company_name")||""),category:String(form.get("category")||"consumidor_final"),
     email:String(form.get("email")||""),phone:String(form.get("phone")||""),address:String(form.get("address")||""),notes:String(form.get("notes")||"")
    });
    onSaved(updated);
   } catch(cause){setError(cause instanceof Error?cause.message:"No se pudo guardar el cliente.");}
   finally{setBusy(false);}
  }}>
   {error&&<p role="alert" className="p-3 bg-red-50 text-red-800 rounded-lg mb-4">{error}</p>}
   <fieldset disabled={busy} className="space-y-4">
    <label className="block text-sm font-medium">Nombre / Razón social *<input autoFocus required name="name" maxLength={200} defaultValue={client.name} className="block border rounded-lg p-2 w-full mt-1"/></label>
    <label className="block text-sm font-medium">Empresa / Nombre de fantasía<input name="company_name" maxLength={200} defaultValue={client.company_name||""} className="block border rounded-lg p-2 w-full mt-1"/></label>
    <label className="block text-sm font-medium">Categoría<select name="category" defaultValue={client.category||"consumidor_final"} className="block border rounded-lg p-2 w-full mt-1">{CLIENT_CATEGORIES.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    <div className="grid sm:grid-cols-2 gap-4">
     <label className="block text-sm font-medium">Correo electrónico<input name="email" type="email" maxLength={254} defaultValue={client.email||""} className="block border rounded-lg p-2 w-full mt-1"/></label>
     <label className="block text-sm font-medium">Teléfono / WhatsApp<input name="phone" type="tel" maxLength={100} defaultValue={client.phone||""} className="block border rounded-lg p-2 w-full mt-1"/></label>
    </div>
    <label className="block text-sm font-medium">Dirección<input name="address" maxLength={500} defaultValue={client.address||""} className="block border rounded-lg p-2 w-full mt-1"/></label>
    <label className="block text-sm font-medium">Observaciones<textarea name="notes" maxLength={20000} rows={4} defaultValue={client.notes||""} className="block border rounded-lg p-2 w-full mt-1"/></label>
   </fieldset>
   <div className="flex justify-end gap-3 mt-5"><button type="button" disabled={busy} onClick={onClose} className="border rounded-lg px-4 py-2 text-sm">Cancelar</button><button disabled={busy} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50">{busy?"Guardando…":"Guardar cambios"}</button></div>
  </form>
 </dialog>;
}
