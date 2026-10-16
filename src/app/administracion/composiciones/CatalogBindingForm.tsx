"use client";

import { useState } from "react";
import { getOfficialCatalog } from "@/lib/catalog-service";
import { saveCatalogManufacturingBinding } from "@/lib/supabase/manufacturing";

export function CatalogBindingForm({ products, variants, bindings }: {
  products: { id: string; name: string }[];
  variants: { id: string; product_id: string; name: string }[];
  bindings: { catalog_key: string; product_id: string; variant_id: string | null }[];
}) {
  const [key, setKey] = useState("");
  const [product, setProduct] = useState("");
  const [variant, setVariant] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return <form className="p-4 border rounded bg-white space-y-3" onSubmit={async event => {
    event.preventDefault(); setPending(true); setMessage("");
    try { await saveCatalogManufacturingBinding({ catalogKey: key, productId: product, variantId: variant }); setMessage("Vinculación guardada. Se aplicará a presupuestos nuevos."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Error al guardar"); }
    finally { setPending(false); }
  }}>
    <h2 className="font-bold">Vincular artículo comercial con fabricación</h2>
    <p className="text-sm">Elegí explícitamente el producto y su variante. No se modificarán documentos existentes.</p>
    <label className="block">Artículo de la lista de precios
      <select required value={key} onChange={event => {
        const value = event.target.value; const binding = bindings.find(row => row.catalog_key === value);
        setKey(value); setProduct(binding?.product_id || ""); setVariant(binding?.variant_id || "");
      }} className="block border p-2 w-full">
        <option value="">Seleccionar artículo</option>
        {getOfficialCatalog().map(item => <option key={item.key} value={item.key}>{item.name} — {item.variantName || "Base"}</option>)}
      </select>
    </label>
    <label className="block">Producto técnico
      <select required value={product} onChange={event => { setProduct(event.target.value); setVariant(""); }} className="block border p-2 w-full">
        <option value="">Seleccionar producto</option>
        {products.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    <label className="block">Variante técnica
      <select value={variant} onChange={event => setVariant(event.target.value)} className="block border p-2 w-full">
        <option value="">Composición base del producto</option>
        {variants.filter(item => item.product_id === product).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    <button disabled={pending} className="border rounded p-2">{pending ? "Guardando…" : "Guardar vinculación"}</button>
    <p role="status">{message}</p>
  </form>;
}
