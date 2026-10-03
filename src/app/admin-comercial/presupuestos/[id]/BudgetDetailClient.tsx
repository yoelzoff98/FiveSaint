"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FileText, User, Calendar, DollarSign, Building, Mail,
  Phone, MapPin, CheckSquare, RefreshCw, AlertCircle, ShoppingBag, Check, X, Printer,
  Share2, Copy, Shield, ShieldOff, Eye, Clock
} from "lucide-react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { BudgetPrintPdf } from "@/components/pdf/BudgetPrintPdf";
import {
  updateBudgetStatus,
  convertBudgetToOrder,
  revokeBudget,
  publishBudget
} from "@/lib/supabase/comercial";
import { resolveIssuedBudgetTotals, formatCurrencyARS, type CommercialBreakdown } from "@/lib/commercial-calculations";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getPublishedBudgetUrl } from "@/lib/commercial-links";

interface BudgetItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string | null;
  variant_id: string | null;
  converted_quantity?: number;
  remaining_quantity?: number;
  is_manual?: boolean;
}

interface Budget {
  id: string;
  budget_number: number;
  status: string;
  total_amount: number;
  tax_rate?: number | null;
  calculation_snapshot?: Partial<CommercialBreakdown> | null;
  notes: string | null;
  public_notes?: string | null;
  public_status?: string | null;
  public_token?: string | null;
  discounts: number[];
  created_at: string;
  clients: {
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    status?: string;
  } | null;
  sellers: {
    full_name: string;
    email: string;
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
  items: BudgetItem[];
  rejection_reason?: string | null;
  view_count?: number | null;
  viewed_at?: string | null;
  first_viewed_at?: string | null;
  last_viewed_at?: string | null;
}

interface BudgetDetailClientProps {
  initialBudget: Budget;
}

export function BudgetDetailClient({ initialBudget }: BudgetDetailClientProps) {
  const router = useRouter();
  const [budget, setBudget] = useState<Budget>(initialBudget);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Presupuesto-FS-P-${budget.budget_number}`,
  });

  // Conversión a pedido
  const convertPanelRef = useRef<HTMLDivElement>(null);
  const conversionIdempotencyKeyRef = useRef<{ payload: string; key: string } | null>(null);
  const [showConvertPanel, setShowConvertPanel] = useState(false);

  // Inicializar selección de ítems que tengan saldo pendiente
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: boolean }>(
    initialBudget.items.reduce((acc, item) => {
      const remaining = item.remaining_quantity !== undefined ? item.remaining_quantity : item.quantity;
      return { ...acc, [item.id]: remaining > 0 };
    }, {})
  );

  const [convertQuantities, setConvertQuantities] = useState<{ [id: string]: number }>(
    initialBudget.items.reduce((acc, item) => {
      const remaining = item.remaining_quantity !== undefined ? item.remaining_quantity : item.quantity;
      return { ...acc, [item.id]: Math.max(1, remaining) };
    }, {})
  );

  const [factoryNotes, setFactoryNotes] = useState<{ [id: string]: string }>({});
  const [orderNotes, setOrderNotes] = useState(`Pedido generado desde el presupuesto #${initialBudget.budget_number}.`);
  const [saleType, setSaleType] = useState<"direct" | "distributor">("direct");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = getPublishedBudgetUrl(origin, budget);

  const cleanPhone = budget.clients?.phone ? budget.clients.phone.replace(/\D/g, "") : "";
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Te envío el presupuesto oficial: ${publicUrl}`)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(`Te envío el presupuesto oficial: ${publicUrl}`)}`;

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (showConvertPanel && convertPanelRef.current) {
      convertPanelRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [showConvertPanel]);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  const handleUpdateStatus = async (newStatus: string, reason?: string) => {
    setLoading(true);
    setError(null);

    try {
      await updateBudgetStatus(budget.id, newStatus, reason);

      setBudget(prev => ({
        ...prev,
        status: newStatus,
        rejection_reason: newStatus === "rejected" ? (reason || prev.rejection_reason) : prev.rejection_reason
      }));
      setSuccess(`Estado del presupuesto actualizado a: ${newStatus === "rejected" ? "Rechazado" : newStatus}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al actualizar estado.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRevocation = async () => {
    setLoading(true);
    setError(null);
    try {
      if (budget.public_status === "revoked") {
        const published = await publishBudget(budget.id);
        setBudget(prev => ({ ...prev, public_status: "published", public_token: published.public_token, status: published.status }));
        setSuccess("Enlace público restablecido exitosamente.");
      } else {
        await revokeBudget(budget.id);
        setBudget(prev => ({ ...prev, public_status: "revoked" }));
        setSuccess("Enlace público revocado. Los clientes ya no podrán visualizar esta versión.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al actualizar visibilidad pública.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishBudget = async () => {
    setLoading(true);
    setError(null);
    try {
      const published = await publishBudget(budget.id);
      setBudget(prev => ({
        ...prev,
        status: published.status,
        public_status: "published",
        public_token: published.public_token
      }));
      setSuccess("¡Cotización publicada oficialmente! El enlace digital ahora está activo para el cliente.");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al publicar la cotización.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleQuantityChange = (itemId: string, maxQty: number, val: number) => {
    const qty = Math.max(1, Math.min(maxQty, Math.floor(val)));
    setConvertQuantities((prev) => ({ ...prev, [itemId]: qty }));
  };

  const handleConvertToOrder = async () => {
    const activeItems = budget.items.filter((item) => selectedItems[item.id]);

    if (activeItems.length === 0) {
      setError("Tenés que seleccionar al menos un producto con saldo disponible para convertir.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const itemsToConvert = activeItems.map((item) => ({
        budgetItemId: item.id,
        productId: item.product_id || undefined,
        variantId: item.variant_id || undefined,
        productName: item.product_name,
        variantName: item.variant_name || undefined,
        quantity: convertQuantities[item.id] || item.quantity,
        factoryNotes: factoryNotes[item.id] || undefined
      }));

      const payload = JSON.stringify({ budgetId: budget.id, itemsToConvert, orderNotes, saleType });
      if (conversionIdempotencyKeyRef.current?.payload !== payload) {
        conversionIdempotencyKeyRef.current = { payload, key: crypto.randomUUID() };
      }
      const idempotencyKey = conversionIdempotencyKeyRef.current.key;

      const order = await convertBudgetToOrder(
        budget.id,
        itemsToConvert,
        orderNotes,
        saleType,
        { idempotencyKey }
      );

      // Calcular si quedaron pendientes
      let allConverted = true;
      const updatedItems = budget.items.map(bi => {
        const convertedNow = itemsToConvert.find(i => i.budgetItemId === bi.id);
        const qtyNow = convertedNow ? convertedNow.quantity : 0;
        const remaining = (bi.remaining_quantity !== undefined ? bi.remaining_quantity : bi.quantity) - qtyNow;
        if (remaining > 0) allConverted = false;
        return {
          ...bi,
          converted_quantity: (bi.converted_quantity || 0) + qtyNow,
          remaining_quantity: Math.max(0, remaining)
        };
      });

      const nextStatus = saleType === "distributor"
        ? (allConverted ? "distributor_sale" : "partially_converted")
        : (allConverted ? "converted" : "partially_converted");

      setBudget((prev) => ({
        ...prev,
        status: nextStatus,
        items: updatedItems
      }));
      setShowConvertPanel(false);
      conversionIdempotencyKeyRef.current = null; // Limpiar intención confirmada
      setSuccess(
        saleType === "distributor"
          ? "¡Venta por Distribuidor registrada con éxito!"
          : "¡Pedido de Fábrica generado con éxito!"
      );

      const targetOrderId = (order as any)?.id || (order as any)?.order_id;
      setTimeout(() => {
        if (saleType === "distributor") {
          router.push(`/admin-comercial/pedidos`);
        } else if (targetOrderId) {
          router.push(`/admin-comercial/pedidos/${targetOrderId}`);
        } else {
          router.push(`/admin-comercial/pedidos`);
        }
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al procesar la conversión a pedido.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "converted":
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs font-bold py-1 px-3">Convertido Total</Badge>;
      case "partially_converted":
        return <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-bold py-1 px-3">Convertido Parcial</Badge>;
      case "distributor_sale":
        return <Badge className="bg-teal-50 text-teal-800 border-teal-300 text-xs font-bold py-1 px-3">Vendido por Distribuidor</Badge>;
      case "sent":
        return <Badge className="bg-blue-50 text-blue-800 border-blue-300 text-xs font-bold py-1 px-3">Enviado al Cliente</Badge>;
      case "draft":
        return <Badge className="bg-stone-100 text-stone-700 border-stone-300 text-xs font-bold py-1 px-3">Borrador</Badge>;
      case "accepted":
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs font-bold py-1 px-3">Aceptado</Badge>;
      case "rejected":
        return <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-xs font-bold py-1 px-3">Rechazado</Badge>;
      default:
        return <Badge className="bg-stone-100 text-stone-600 border-stone-300 text-xs py-1 px-3">{status}</Badge>;
    }
  };

  // Cálculo unificado
  const breakdown = resolveIssuedBudgetTotals(budget);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Columna Izquierda: Detalles del presupuesto y tabla */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Banner de Estado Revocado */}
        {budget.public_status === "revoked" && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-xs text-rose-900 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                <strong>Acceso Público Revocado:</strong> Los clientes no pueden visualizar este presupuesto en el enlace compartido.
              </span>
            </div>
            <Button
              onClick={handleToggleRevocation}
              disabled={loading}
              variant="outline"
              className="text-xs bg-white border-rose-300 text-rose-800 hover:bg-rose-100 shrink-0"
            >
              Restablecer Acceso
            </Button>
          </div>
        )}

        {/* Ficha de Información */}
        <Card className="p-6 border-stone-200 bg-white">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-stone-600" />
              <div>
                <h2 className="text-xl font-bold text-stone-900">Presupuesto #{budget.budget_number}</h2>
                <span className="text-stone-500 text-xs font-semibold">
                  Fecha de Emisión: {new Date(budget.created_at).toLocaleDateString("es-AR")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(budget.status)}
              {budget.public_status === "revoked" && (
                <Badge className="bg-rose-100 text-rose-700 border-rose-300 text-[10px] font-bold">
                  Enlace Revocado
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-stone-700 border-t border-stone-100 pt-6">
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Destinatario</h3>
              <p className="font-bold text-stone-900 mb-1">{budget.clients?.name}</p>
              {budget.clients?.company_name && (
                <p className="flex items-center gap-1.5 text-stone-600 mb-1">
                  <Building className="w-3.5 h-3.5 text-stone-400" />
                  {budget.clients.company_name}
                </p>
              )}
              {budget.clients?.email && (
                <p className="flex items-center gap-1.5 text-stone-600 mb-1">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  {budget.clients.email}
                </p>
              )}
              {budget.clients?.phone && (
                <p className="flex items-center gap-1.5 text-stone-600">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  {budget.clients.phone}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Emisor y Seguimiento</h3>
              <div className="flex items-center gap-2 text-stone-850 mb-1.5">
                <User className="w-4 h-4 text-stone-400" />
                <span>Asesor: {budget.sellers?.full_name || "Five Saint (Administración)"}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 text-xs mb-1">
                <Eye className="w-3.5 h-3.5 text-stone-400" />
                <span>Visualizaciones web: {budget.view_count || 0} visitas</span>
              </div>
              {budget.first_viewed_at && (
                <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Primera apertura: {new Date(budget.first_viewed_at).toLocaleString("es-AR")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Condiciones Comerciales para el cliente */}
          {budget.public_notes && (
            <div className="mt-4 p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg text-xs">
              <h4 className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                Condiciones Comerciales (Visibles para el Cliente)
              </h4>
              <p className="text-blue-950 font-normal whitespace-pre-line leading-relaxed">
                {budget.public_notes}
              </p>
            </div>
          )}

          {/* Notas internas privadas */}
          {budget.notes && (
            <div className="mt-3 p-3.5 bg-stone-50 border border-stone-200 rounded-lg text-xs">
              <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                Notas Internas de Fábrica (Confidencial Interno)
              </h4>
              <p className="text-stone-750 font-normal whitespace-pre-line leading-relaxed">
                {budget.notes}
              </p>
            </div>
          )}
        </Card>

        {/* Listado de ítems y Saldos de Conversión */}
        <Card className="p-6 border-stone-200 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-stone-900">Productos y Saldo de Conversión</h3>
            <span className="text-xs text-stone-500">
              {budget.items.length} {budget.items.length === 1 ? "ítem" : "ítems"} cotizados
            </span>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 font-bold uppercase text-[10px]">
                  <th className="px-3 py-2.5">Producto</th>
                  <th className="px-3 py-2.5 text-center">Cotizado</th>
                  <th className="px-3 py-2.5 text-center">Convertido</th>
                  <th className="px-3 py-2.5 text-center">Pendiente</th>
                  <th className="px-3 py-2.5 text-right">P. Unitario</th>
                  <th className="px-3 py-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {budget.items.map((item) => {
                  const converted = item.converted_quantity || 0;
                  const remaining = item.remaining_quantity !== undefined ? item.remaining_quantity : (item.quantity - converted);
                  const isDone = remaining <= 0;

                  return (
                    <tr key={item.id} className={isDone ? "bg-stone-50/80 text-stone-500" : ""}>
                      <td className="px-3 py-3 font-semibold text-stone-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.product_name}</span>
                          {item.variant_name && (
                            <span className="text-[10px] text-stone-500 font-normal">({item.variant_name})</span>
                          )}
                          {item.is_manual && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 rounded px-1.5 py-0.2">Manual</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-stone-800">{item.quantity}</td>
                      <td className="px-3 py-3 text-center text-emerald-700 font-semibold">{converted}</td>
                      <td className="px-3 py-3 text-center font-bold">
                        {isDone ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">Completado</span>
                        ) : (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px]">{remaining} disp.</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">{formatCurrencyARS(item.unit_price)}</td>
                      <td className="px-3 py-3 text-right font-bold text-stone-900">
                        {formatCurrencyARS(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Panel de Conversión Parcial o Total a Pedido */}
        {showConvertPanel && (
          <Card ref={convertPanelRef} className="p-6 border-2 border-emerald-500 bg-white shadow-xl rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-emerald-950">Confirmar Conversión a Pedido</h3>
                <p className="text-xs text-emerald-800">
                  Seleccioná los productos y cantidades a convertir en esta operación.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConvertPanel(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {budget.items.map((item) => {
                const maxAvailable = item.remaining_quantity !== undefined ? item.remaining_quantity : item.quantity;
                const isItemUnavailable = maxAvailable <= 0;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-lg border flex flex-col gap-2 transition-all ${
                      isItemUnavailable
                        ? "bg-stone-100 border-stone-250 opacity-60"
                        : selectedItems[item.id]
                        ? "bg-emerald-50/40 border-emerald-300"
                        : "bg-white border-stone-250"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isItemUnavailable}
                          checked={Boolean(selectedItems[item.id]) && !isItemUnavailable}
                          onChange={() => handleToggleItemSelection(item.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                        />
                        <div>
                          <span className="text-xs font-bold text-stone-900 block">{item.product_name}</span>
                          <span className="text-[11px] text-stone-500">
                            Pendiente disponible: <strong>{maxAvailable}</strong> de {item.quantity} cotizadas
                          </span>
                        </div>
                      </label>

                      {selectedItems[item.id] && !isItemUnavailable && (
                        <div className="flex items-center gap-2 pl-7 sm:pl-0">
                          <span className="text-xs text-stone-600 font-medium">Cant. a convertir:</span>
                          <input
                            type="number"
                            min="1"
                            max={maxAvailable}
                            value={convertQuantities[item.id] || 1}
                            onChange={(e) => handleQuantityChange(item.id, maxAvailable, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border border-stone-300 rounded text-center text-xs font-bold text-stone-900 bg-white"
                          />
                        </div>
                      )}
                    </div>

                    {selectedItems[item.id] && !isItemUnavailable && (
                      <div className="pl-7 pt-1">
                        <input
                          type="text"
                          placeholder="Aclaraciones para fábrica (lado de motor, jets, color, etc.)"
                          value={factoryNotes[item.id] || ""}
                          onChange={(e) => setFactoryNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-stone-200 rounded text-xs text-stone-800 bg-white placeholder-stone-400"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Canal de Venta */}
            <div className="flex flex-col gap-2 mb-4 p-3 bg-stone-50 border border-stone-200 rounded-lg">
              <label className="text-xs font-bold text-stone-700 uppercase">Canal de Confirmación:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSaleType("direct")}
                  className={`p-2 rounded text-left border text-xs font-semibold cursor-pointer ${
                    saleType === "direct" ? "bg-emerald-50 border-emerald-500 text-emerald-950" : "bg-white border-stone-250 text-stone-700"
                  }`}
                >
                  Pedido a Fábrica (Directa)
                </button>
                <button
                  type="button"
                  onClick={() => setSaleType("distributor")}
                  className={`p-2 rounded text-left border text-xs font-semibold cursor-pointer ${
                    saleType === "distributor" ? "bg-teal-50 border-teal-500 text-teal-950" : "bg-white border-stone-250 text-stone-700"
                  }`}
                >
                  Vendido por Distribuidor
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1 mb-6">
              <label className="text-xs font-bold text-stone-600">Observaciones del Pedido</label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-850 bg-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConvertPanel(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button
                onClick={handleConvertToOrder}
                disabled={loading}
                className={`cursor-pointer text-xs font-bold text-white flex items-center gap-2 ${
                  saleType === "distributor" ? "bg-teal-700 hover:bg-teal-800" : "bg-emerald-700 hover:bg-emerald-800"
                }`}
              >
                <Check className="w-4 h-4" />
                {saleType === "distributor" ? "Confirmar Venta Distribuidor" : "Generar Pedido de Fábrica"}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Columna Derecha: Acciones de Gestión y Desglose */}
      <div className="flex flex-col gap-6 lg:col-span-1">
        <Card className="p-6 border-stone-200 bg-white sticky top-6 shadow-md">
          <h3 className="font-bold text-stone-900 mb-4">Gestión y Cotización</h3>

          {error && (
            <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3.5 rounded-lg text-xs mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3.5 rounded-lg text-xs mb-4 flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Desglose Unificado de Totales */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg mb-4 text-xs">
            <div className="flex justify-between items-center text-stone-600 mb-1">
              <span>Subtotal Bruto:</span>
              <span className="font-semibold">{formatCurrencyARS(breakdown.subtotal)}</span>
            </div>

            {breakdown.discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-700 font-semibold mb-2 pb-2 border-b border-stone-200">
                <span>Desc. ({budget.discounts.join("% + ")}%):</span>
                <span>-{formatCurrencyARS(breakdown.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-stone-900 font-bold pt-1">
              <span>Subtotal Neto:</span>
              <span>{formatCurrencyARS(breakdown.netTotal)}</span>
            </div>

            <div className="flex justify-between items-center text-stone-500 text-[11px] mt-1 pb-2 border-b border-stone-200">
              <span>IVA ({breakdown.taxRate}%):</span>
              <span>+{formatCurrencyARS(breakdown.taxAmount)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2 mt-1">
              <span className="text-xs font-black text-stone-900 uppercase">Total Final:</span>
              <span className="text-2xl font-black text-accent-deep">
                {formatCurrencyARS(breakdown.totalWithTax)}
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col gap-2.5">
            {(budget.status === "draft" || budget.public_status === "draft") && (
              <Button
                onClick={handlePublishBudget}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Publicar Cotización Oficial</span>
              </Button>
            )}

            {budget.status !== "converted" && (
              <Button
                onClick={() => setShowConvertPanel(true)}
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Confirmar Pedido (Facturar)</span>
              </Button>
            )}

            {budget.status !== "rejected" && budget.status !== "converted" && (
              <Button
                variant="ghost"
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="w-full text-xs text-stone-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <X className="w-4 h-4 mr-1" />
                Marcar como Rechazado
              </Button>
            )}

            {/* Compartir enlace público */}
            <div className="border-t border-stone-200 pt-3 mt-1 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                Enlace Oficial Digital:
              </label>

              {(budget.public_status === "draft" || budget.status === "draft") && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                  <strong>Borrador Privado:</strong> El cliente no podrá acceder hasta que hagas clic en &quot;Publicar Cotización Oficial&quot;.
                </p>
              )}

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-[11px] font-mono text-stone-700 bg-stone-50 select-all"
                />
                <Button
                  onClick={handleCopyLink}
                  disabled={!publicUrl || loading}
                  variant="outline"
                  className="shrink-0 text-xs px-3 py-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                {publicUrl && <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors text-center"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>}

                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir PDF</span>
                </Button>
              </div>

              {/* Botón de revocación */}
              <button
                type="button"
                onClick={handleToggleRevocation}
                disabled={loading}
                className="text-[11px] text-stone-400 hover:text-rose-600 transition-colors mt-2 text-center underline cursor-pointer"
              >
                {budget.public_status === "revoked" ? "Restablecer visibilidad pública" : "Revocar acceso al enlace online"}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Rechazo */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-300 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-stone-900 mb-2">Rechazar Presupuesto</h3>
            <p className="text-xs text-stone-500 mb-4">
              Por favor ingresá el motivo del rechazo para registrarlo en el historial del cliente.
            </p>
            <textarea
              rows={3}
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="Ej. Precios fuera de presupuesto, eligió otra marca, postergó la obra..."
              className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-850 mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  handleUpdateStatus("rejected", rejectionReasonInput);
                }}
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Confirmar Rechazo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Componente Oculto para Impresión de PDF */}
      <div className="hidden">
        <BudgetPrintPdf ref={printRef} budget={budget} />
      </div>
    </div>
  );
}
