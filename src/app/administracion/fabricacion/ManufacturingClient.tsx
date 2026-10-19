"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  Factory, Search, Eye, Plus, Printer, Check, X, AlertTriangle,
  Clock, CheckCircle2, ChevronLeft, ChevronRight, FileText, ShoppingBag
} from "lucide-react";
import { issueManufacturingOrderAction } from "@/lib/supabase/manufacturing";

const STATUS_LABELS: Record<string, string> = {
  issued: "Emitida",
  in_production: "En Planta",
  completed: "Fabricada",
  cancelled: "Superada / Anulada"
};

const STATUS_COLORS: Record<string, string> = {
  issued: "bg-amber-50 text-amber-800 border-amber-300",
  in_production: "bg-blue-50 text-blue-800 border-blue-300",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-300",
  cancelled: "bg-stone-100 text-stone-500 border-stone-200"
};

interface ManufacturingClientProps {
  initialOrders: any[];
  totalCount: number;
  serverPage: number;
  serverTotalPages: number;
  pendingItems: any[];
  pendingError?: string | null;
  compositions: any[];
  initialSearch?: string;
  initialStatus?: string;
  initialPendingView?: boolean;
}

export function ManufacturingClient({
  initialOrders,
  totalCount,
  serverPage,
  serverTotalPages,
  pendingItems,
  pendingError,
  compositions,
  initialPendingView = false,
  initialSearch = "",
  initialStatus = "all"
}: ManufacturingClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"issued" | "pending">(initialPendingView ? "pending" : "issued");
  const [orders, setOrders] = useState<any[]>(initialOrders);
  useEffect(()=>setOrders(initialOrders),[initialOrders]);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);

  // Modal de Emisión
  const [selectedPendingItem, setSelectedPendingItem] = useState<any | null>(null);
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [groupPrimaryId,setGroupPrimaryId] = useState("");
  const [groupItems,setGroupItems] = useState<any[]>([]);
  const [additionalBoms,setAdditionalBoms] = useState<Record<string,string>>({});
  const [additionalQuantities,setAdditionalQuantities] = useState<Record<string,number>>({});
  const intent = useRef<{payload:string;key:string} | null>(null);
  const groupedPending = [...pendingItems.reduce((groups: Map<string,any>,item:any) => {
    const group = groups.get(item.order_id) || {order_id:item.order_id,orders:item.orders,items:[]};
    group.items.push(item); groups.set(item.order_id,group); return groups;
  },new Map<string,any>()).values()];
  const [selectedBomId, setSelectedBomId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const openIssueModal = (item: any) => {
    const siblings = item.groupItems || [item];
    setGroupItems(siblings);
    setGroupPrimaryId("");
    setAdditionalBoms(Object.fromEntries(siblings.map((row:any) => [row.id,compositions.find((bom:any)=> row.product_id && bom.product_id===row.product_id && (!bom.variant_id || bom.variant_id===row.variant_id))?.id || ""])));
    setAdditionalQuantities(Object.fromEntries(siblings.map((row:any)=>[row.id,row.quantity-(row.manufacturing_issued_quantity||0)])));
    const remaining = item.quantity - (item.manufacturing_issued_quantity || 0);
    setSelectedPendingItem(item);
    setIssueQuantity(remaining > 0 ? remaining : 1);
    
    // Buscar BOM publicada para el producto
    const matchingBom = compositions.find((c: any) => c.product_id === item.product_id);
    setSelectedBomId(matchingBom?.id || "");
    setNotes("");
    setError(null);
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPendingItem || !groupPrimaryId) return;

    setLoading(true);
    setError(null);

    try {
      const additionalItems = groupItems.filter(item=>item.id!==groupPrimaryId).map(item=>({orderItemId:item.id,quantity:additionalQuantities[item.id],bomId:additionalBoms[item.id]}));
      if (additionalItems.some(item=>!item.bomId)) throw new Error("Seleccioná la composición de cada adicional antes de emitir.");
      const payload=JSON.stringify({primary:groupPrimaryId,quantity:issueQuantity,bom:selectedBomId,additionalItems,notes});
      if (intent.current?.payload!==payload) intent.current={payload,key:crypto.randomUUID()};
      const res = await issueManufacturingOrderAction({
        orderId: selectedPendingItem.order_id,
        orderItemId: selectedPendingItem.id,
        quantity: issueQuantity,
        additionalItems,
        idempotencyKey:intent.current.key,
        bomId: selectedBomId || null,
        notes: notes.trim() || null
      });

      setSelectedPendingItem(null);
      setSuccess(`Orden de fabricación ${res.orderNumber} emitida exitosamente en formato A4.`);
      router.refresh();
      setActiveTab("issued");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.product_name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = status === "all" || o.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Alertas */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selector de Pestañas */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab("issued")}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "issued"
              ? "border-accent-deep text-accent-deep"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Órdenes Emitidas ({totalCount})</span>
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "pending"
              ? "border-accent-deep text-accent-deep"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pendientes de Fabricación ({groupedPending.length})</span>
        </button>
        <Link
          href="/administracion/fabricacion/revision"
          className="py-3 px-6 text-sm font-bold border-b-2 border-transparent text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-2 ml-auto"
        >
          <CheckCircle2 className="w-4 h-4 text-amber-600" />
          <span>Revisión Técnica de Pedidos</span>
        </Link>
      </div>

      {/* =========================================================================
          PESTAÑA 1: ÓRDENES EMITIDAS
         ========================================================================= */}
      {activeTab === "issued" && (
        <div className="space-y-4">
          <Card className="p-4 border-stone-200 bg-white">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar por número de orden (ej: OF-2026-00001) o producto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-deep"
                />
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none"
              >
                <option value="all">Todos los estados</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </Card>

          <Card className="border-stone-200 overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-36">N° de Orden</th>
                    <th className="py-3 px-4">Producto y adicionales</th>
                    <th className="py-3 px-4 w-24 text-center">Cantidad</th>
                    <th className="py-3 px-4">Pedido / Cliente</th>
                    <th className="py-3 px-4 w-28">Estado</th>
                    <th className="py-3 px-4">Emisión</th>
                    <th className="py-3 px-4 text-right w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        No se encontraron órdenes de fabricación emitidas.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">
                          <Link
                            href={`/administracion/fabricacion/${o.id}`}
                            className="hover:text-accent-deep transition-colors"
                          >
                            {o.order_number}
                          </Link>
                          {o.revision_number > 1 && (
                            <span className="block text-[10px] text-amber-700 font-bold">
                              Rev #{o.revision_number}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-stone-900 block text-sm">
                            {o.product_name}
                          </span>
                          {o.variant_name && (
                            <span className="text-stone-500 text-[11px] block">{o.variant_name}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-stone-900 text-sm">
                          {o.quantity}
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          <span className="font-semibold text-stone-800 block">
                            Pedido #{o.orders?.order_number || "S/D"}
                          </span>
                          <span className="text-stone-500 text-[11px] block">
                            {o.orders?.clients?.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-[10px] px-2 py-0.5 border ${STATUS_COLORS[o.status] || STATUS_COLORS.issued}`}>
                            {STATUS_LABELS[o.status] || o.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-stone-500 text-[11px]">
                          <span>{new Date(o.issued_at).toLocaleDateString("es-AR")}</span>
                          <span className="block text-[10px] text-stone-400">{o.issued_by_name}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-7 px-2.5 text-xs text-stone-700 border-stone-200 hover:bg-stone-50"
                          >
                            <Link href={`/administracion/fabricacion/${o.id}`} title="Ver A4 e Imprimir">
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              <span>A4</span>
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          PESTAÑA 2: PENDIENTES DE EMISIÓN DE FABRICACIÓN
         ========================================================================= */}
      {activeTab === "pending" && (
        <Card className="border-stone-200 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Pedido / Fecha</th>
                  <th className="py-3 px-4">Cliente / Asesor</th>
                  <th className="py-3 px-4">Producto y adicionales</th>
                  <th className="py-3 px-4 w-32 text-center">Contenido del pedido</th>
                  <th className="py-3 px-4 w-28 text-center">Saldo a Fabricar</th>
                  <th className="py-3 px-4 text-right w-36">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pendingItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      {pendingError ? "Listado no disponible. Revise el aviso de error antes de continuar." : "No hay pedidos directos pendientes de orden de fabricación."}
                    </td>
                  </tr>
                ) : (
                  groupedPending.map((group:any) => {
                    const first = group.items[0];
                    const it = {...first,groupItems:group.items,
                      product_name:group.items.map((row:any)=>`${row.product_name} × ${row.quantity}`).join(" · "),
                      variant_name:null,
                      quantity:group.items.reduce((total:number,row:any)=>total+row.quantity,0),
                      manufacturing_issued_quantity:group.items.reduce((total:number,row:any)=>total+(row.manufacturing_issued_quantity||0),0),
                      configuration_status:group.items.every((row:any)=>row.configuration_status==='approved')?'approved':'pending_review'};
                    const issued = it.manufacturing_issued_quantity || 0;
                    const remaining = it.quantity - issued;
                    return (
                      <tr key={it.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={`/administracion/pedidos/${it.order_id}`}
                            className="font-bold text-stone-900 hover:text-accent-deep transition-colors text-sm block"
                          >
                            Pedido #{it.orders?.order_number}
                          </Link>
                          <span className="text-[10px] text-stone-400">
                            {new Date(it.orders?.created_at).toLocaleDateString("es-AR")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-700">
                          <span className="font-semibold block">{it.orders?.clients?.name}</span>
                          <span className="text-[10px] text-stone-500">
                            Asesor: {it.orders?.sellers?.full_name || "FiveSaint"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-stone-900 block text-sm">
                            {group.items.map((row:any)=><span key={row.id} className="block mb-1">{row.product_name} <span className="font-normal">× {row.quantity} — pendiente {row.quantity-(row.manufacturing_issued_quantity||0)}</span></span>)}
                          </span>
                          {it.variant_name && (
                            <span className="text-stone-500 text-[11px] block">{it.variant_name}</span>
                          )}
                          {it.factory_notes && (
                            <span className="text-amber-800 text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 block max-w-xs truncate">
                              Notas: {it.factory_notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="font-bold text-stone-900">{group.items.length} renglones del pedido</span>
                          <span className="block text-[10px] text-stone-500">Una orden conjunta</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-black text-amber-700 text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {group.items.length} renglones pendientes
                          </span>
                          {it.configuration_status === "approved" ? (
                            <span className="block text-[10px] text-emerald-700 font-bold mt-1">Revisión: Aprobada</span>
                          ) : (
                            <span className="block text-[10px] text-amber-800 font-semibold mt-1">Revisión: Pendiente</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {it.configuration_status === "approved" ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openIssueModal({...first,groupItems:group.items})}
                              className="bg-accent-deep hover:bg-accent-hover text-white text-xs h-8 px-3"
                            >
                              <Factory className="w-3.5 h-3.5 mr-1" />
                              <span>Emitir Fabricación</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="border-amber-400 text-amber-900 bg-amber-50 hover:bg-amber-100 text-xs h-8 px-3"
                            >
                              <Link href={`/administracion/fabricacion/revision?orderId=${it.order_id}`}>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                <span>Revisar Primero</span>
                              </Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* =========================================================================
          MODAL: EMISIÓN DE ORDEN DE FABRICACIÓN (Revisión de configuración e insumos)
         ========================================================================= */}
      {selectedPendingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <Card className="w-full max-w-xl p-6 bg-white border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h2 className="text-sm font-bold text-stone-900">
                  Emitir Orden de Fabricación para Planta
                </h2>
                <p className="text-xs text-stone-500">
                  Pedido #{selectedPendingItem.orders?.order_number} | Cliente: {selectedPendingItem.orders?.clients?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedPendingItem(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs">
                <span className="text-stone-500 text-[10px] uppercase font-bold block">Artículo:</span>
                <span className="font-black text-stone-900 text-sm">
                  {selectedPendingItem.product_name}
                  {selectedPendingItem.variant_name ? ` — ${selectedPendingItem.variant_name}` : ''}
                </span>
              </div>

              <label className="block text-sm font-bold">Producto principal del pedido
                <select required className="block w-full border rounded p-2" value={groupPrimaryId} onChange={event=>{
                  const item=groupItems.find(row=>row.id===event.target.value);
                  setGroupPrimaryId(event.target.value);
                  if(item){setSelectedPendingItem(item);setIssueQuantity(item.quantity-(item.manufacturing_issued_quantity||0));setSelectedBomId(additionalBoms[item.id]||"");}
                }}>
                  <option value="">Seleccionar producto principal</option>
                  {groupItems.map(item=><option key={item.id} value={item.id}>{item.product_name}</option>)}
                </select>
              </label>
              {groupPrimaryId && <div className="space-y-3 border rounded p-3">
                <h4 className="font-bold">Adicionales incluidos en esta misma orden</h4>
                {groupItems.filter(item=>item.id!==groupPrimaryId).map(item=><div key={item.id} className="space-y-1">
                  <p className="text-sm">{item.product_name}</p>
                  <label className="text-xs">Cantidad <input type="number" min={1} max={item.quantity-(item.manufacturing_issued_quantity||0)} required value={additionalQuantities[item.id]||1} onChange={event=>setAdditionalQuantities(previous=>({...previous,[item.id]:Number(event.target.value)}))} className="border p-1 w-20" /></label>
                  <label className="block text-xs">Composición técnica del adicional
                    <select required className="w-full border p-2" value={additionalBoms[item.id]||""} onChange={event=>setAdditionalBoms(previous=>({...previous,[item.id]:event.target.value}))}>
                      <option value="">Seleccionar composición publicada</option>
                      {compositions.filter(bom=>!item.product_id || (bom.product_id===item.product_id && (!bom.variant_id||bom.variant_id===item.variant_id))).map(bom=><option key={bom.id} value={bom.id}>{bom.name} (v{bom.version})</option>)}
                    </select>
                  </label>
                </div>)}
                <p className="text-xs">Todos estos renglones se fabricarán juntos. Sus materiales se consolidan sin modificar los valores comerciales del pedido.</p>
              </div>}
              {/* Cantidad a emitir */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Cantidad a Fabricar en esta Orden *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={selectedPendingItem.quantity - (selectedPendingItem.manufacturing_issued_quantity || 0)}
                    required
                    value={issueQuantity}
                    onChange={(e) => setIssueQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-32 px-3 py-2 border border-stone-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-accent-deep outline-none"
                  />
                  <span className="text-xs text-stone-500">
                    Máximo disponible: {selectedPendingItem.quantity - (selectedPendingItem.manufacturing_issued_quantity || 0)} unidades
                  </span>
                </div>
              </div>

              {/* Configuración confirmada */}
              <div className="border border-stone-200 p-3 rounded-lg bg-stone-50/50 text-xs">
                <span className="font-bold text-stone-700 uppercase text-[10px] block mb-1">
                  Configuración Comercial Registrada:
                </span>
                {selectedPendingItem.configuration && Object.keys(selectedPendingItem.configuration).length > 0 ? (
                  <pre className="text-[11px] font-mono bg-white p-2 rounded border border-stone-200 text-stone-800 overflow-x-auto">
                    {JSON.stringify(selectedPendingItem.configuration, null, 2)}
                  </pre>
                ) : (
                  <p className="text-stone-500 italic text-[11px]">
                    Configuración base estándar de catálogo (sin opciones adicionales seleccionadas).
                  </p>
                )}
                {selectedPendingItem.factory_notes && (
                  <p className="text-amber-800 mt-2 font-medium bg-amber-50 p-2 rounded border border-amber-200 text-[11px]">
                    Notas libres del vendedor: "{selectedPendingItem.factory_notes}"
                  </p>
                )}
              </div>

              {/* Composición Base */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Composición Técnica Base (BOM Versionado)
                </label>
                <select
                  value={selectedBomId}
                  onChange={(e) => setSelectedBomId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white text-stone-800 outline-none"
                >
                  <option value="">Selección automática por producto</option>
                  {compositions.filter((c)=> !selectedPendingItem.product_id || (c.product_id===selectedPendingItem.product_id && (!c.variant_id || c.variant_id===selectedPendingItem.variant_id))).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (v{c.version}) — {c.products?.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observaciones técnicas para planta */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Observaciones para Planta (A4)
                </label>
                <textarea
                  rows={2}
                  maxLength={400}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles para montaje, prueba hidráulica o embalaje..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Máximo 400 caracteres para garantizar una única hoja A4.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPendingItem(null)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading || !groupPrimaryId}
                  className="bg-accent-deep text-white text-xs flex items-center gap-1.5"
                >
                  {loading ? "Emitiendo..." : (
                    <>
                      <Factory className="w-3.5 h-3.5" />
                      <span>Emitir Orden Oficial</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
