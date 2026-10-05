"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FileText, User, Calendar, DollarSign, Building, Mail,
  Phone, MapPin, RefreshCw, AlertCircle, ShoppingBag, Check, X, Printer,
  Share2, Copy, Shield, ShieldOff, Eye, Clock, Send, Store, Factory,
  CheckCircle2, ArrowRight, Search, RotateCcw, AlertTriangle, Building2, Truck
} from "lucide-react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { BudgetPrintPdf } from "@/components/pdf/BudgetPrintPdf";
import {
  updateBudgetStatus,
  convertBudgetToOrder,
  recordBudgetShipment,
  reopenBudget,
  revokeBudget,
  publishBudget
} from "@/lib/supabase/comercial";
import { resolveIssuedBudgetTotals, formatCurrencyARS, type CommercialBreakdown } from "@/lib/commercial-calculations";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getPublishedBudgetUrl } from "@/lib/commercial-links";

export interface BudgetItem {
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
  direct_quantity?: number;
  distributor_quantity?: number;
  cancelled_quantity?: number;
  is_manual?: boolean;
}

export interface LinkedOrder {
  id: string;
  order_number: number;
  status: string;
  total_amount: number;
  sale_channel: string;
  order_type: string;
  distributor_id: string | null;
  purchase_date: string | null;
  distributor_reference: string | null;
  created_at: string;
  recorded_by_name: string | null;
  distributors: {
    id: string;
    company_name: string;
    contact_name?: string | null;
  } | null;
}

export interface OperationsSummary {
  total_budgeted: number;
  total_direct: number;
  total_distributor: number;
  total_cancelled: number;
  total_pending: number;
  closing_channel: "none" | "direct" | "distributor" | "mixed";
  closing_label: string;
}

export interface Budget {
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
  creator_role?: string | null;
  created_by_user_id?: string | null;
  discounts: number[];
  created_at: string;
  sent_at?: string | null;
  sent_via?: string | null;
  sent_by_name?: string | null;
  shipment_notes?: string | null;
  sale_channel?: string | null;
  distributor_id?: string | null;
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
  distributors: {
    company_name: string;
    contact_name?: string | null;
    discount_percentage?: number | null;
  } | null;
  items: BudgetItem[];
  orders?: LinkedOrder[];
  has_active_operations?: boolean;
  operations_summary?: OperationsSummary;
  rejection_reason?: string | null;
  view_count?: number | null;
  viewed_at?: string | null;
  first_viewed_at?: string | null;
  last_viewed_at?: string | null;
  is_historical_reconciliation_pending?: boolean;
}

interface BudgetDetailClientProps {
  initialBudget: Budget;
  ordersBasePath?: string;
}

export function BudgetDetailClient({ initialBudget, ordersBasePath = "/admin-comercial/pedidos" }: BudgetDetailClientProps) {
  const router = useRouter();
  const [budget, setBudget] = useState<Budget>(initialBudget);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Presupuesto-FS-P-${budget.budget_number}`,
  });

  // Modal de Registro de Venta
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<"direct" | "distributor" | null>(null);

  // Selección de ítems y cantidades para venta
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: boolean }>({});
  const [convertQuantities, setConvertQuantities] = useState<{ [id: string]: number }>({});
  const [factoryNotes, setFactoryNotes] = useState<{ [id: string]: string }>({});
  const [orderNotes, setOrderNotes] = useState("");

  // Estado para Compra en Distribuidor
  const [selectedDistributor, setSelectedDistributor] = useState<any | null>(null);
  const [distributorSearchQuery, setDistributorSearchQuery] = useState("");
  const [distributorList, setDistributorList] = useState<any[]>([]);
  const [distributorLoading, setDistributorLoading] = useState(false);
  const [distributorPage, setDistributorPage] = useState(1);
  const [distributorTotalPages, setDistributorTotalPages] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [distributorReference, setDistributorReference] = useState("");

  // Modal de Registro de Envío
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentMedium, setShipmentMedium] = useState<"whatsapp" | "digital_link" | "email" | "printed_pdf" | "other">("whatsapp");
  const [shipmentDate, setShipmentDate] = useState(new Date().toISOString().slice(0, 16));
  const [shipmentNotes, setShipmentNotes] = useState("");

  // Modal de Rechazo y Reapertura
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  // Control de idempotencia
  const saleIdempotencyKeyRef = useRef<{ payload: string; key: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdOrderAlert, setCreatedOrderAlert] = useState<{ id: string; orderNumber: number; channel: string } | null>(null);

  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inicializar selección de ítems disponibles al abrir modal
  const openSaleModal = () => {
    setSelectedChannel(null); // Elección explícita obligatoria
    setSelectedDistributor(null);
    setDistributorReference("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setOrderNotes("");

    const initialSelection: { [id: string]: boolean } = {};
    const initialQty: { [id: string]: number } = {};

    budget.items.forEach((item) => {
      const remaining = item.remaining_quantity !== undefined ? item.remaining_quantity : item.quantity;
      if (remaining > 0) {
        initialSelection[item.id] = true;
        initialQty[item.id] = remaining;
      } else {
        initialSelection[item.id] = false;
        initialQty[item.id] = 1;
      }
    });

    setSelectedItems(initialSelection);
    setConvertQuantities(initialQty);
    setError(null);
    setShowSaleModal(true);
  };

  // Buscar distribuidores paginados
  const fetchDistributors = useCallback(async (query: string, page: number = 1) => {
    setDistributorLoading(true);
    try {
      const res = await fetch(`/api/comercial/distribuidores?query=${encodeURIComponent(query)}&page=${page}&pageSize=6`);
      if (res.ok) {
        const data = await res.json();
        setDistributorList(data.distributors || []);
        setDistributorPage(data.page || 1);
        setDistributorTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error("Error buscando distribuidores:", e);
    } finally {
      setDistributorLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChannel === "distributor") {
      const timer = setTimeout(() => {
        fetchDistributors(distributorSearchQuery, 1);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [selectedChannel, distributorSearchQuery, fetchDistributors]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = getPublishedBudgetUrl(origin, budget);

  const cleanPhone = budget.clients?.phone ? budget.clients.phone.replace(/\D/g, "") : "";
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${budget.clients?.name || ""}, te envío la cotización oficial N° ${budget.budget_number}: ${publicUrl}`)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(`Te envío la cotización oficial N° ${budget.budget_number}: ${publicUrl}`)}`;

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Registro de Envío Comercial
  const handleRecordShipmentSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await recordBudgetShipment(
        budget.id,
        shipmentMedium,
        new Date(shipmentDate).toISOString(),
        shipmentNotes
      );

      setBudget((prev) => ({
        ...prev,
        sent_via: res.sent_via,
        sent_at: res.sent_at,
        sent_by_name: res.sent_by_name,
        shipment_notes: shipmentNotes,
        status: prev.status === "draft" ? "sent" : prev.status
      }));

      setShowShipmentModal(false);
      setSuccess("Envío comercial registrado exitosamente.");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al registrar el envío comercial.");
    } finally {
      setLoading(false);
    }
  };

  // Reabrir presupuesto
  const handleReopenBudget = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await reopenBudget(budget.id);
      setBudget((prev) => ({
        ...prev,
        status: res.status,
        rejection_reason: null
      }));
      setSuccess("Presupuesto reabierto exitosamente para continuar las gestiones comerciales.");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al reabrir el presupuesto.");
    } finally {
      setLoading(false);
    }
  };

  // Rechazar presupuesto
  const handleRejectBudget = async () => {
    if (budget.has_active_operations) {
      setError("No se puede rechazar el presupuesto porque posee operaciones comerciales vigentes. Debe cancelar los pedidos previamente si desea rechazarlo.");
      setShowRejectModal(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateBudgetStatus(budget.id, "rejected", rejectionReasonInput);
      setBudget((prev) => ({
        ...prev,
        status: "rejected",
        rejection_reason: rejectionReasonInput.trim() || null
      }));
      setShowRejectModal(false);
      setSuccess("Presupuesto marcado como rechazado.");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al rechazar presupuesto.");
    } finally {
      setLoading(false);
    }
  };

  // Publicar cotización oficial
  const handlePublishBudget = async () => {
    setLoading(true);
    setError(null);
    try {
      const published = await publishBudget(budget.id);
      setBudget((prev) => ({
        ...prev,
        status: published.status,
        public_status: "published",
        public_token: published.public_token
      }));
      setSuccess("¡Cotización digital publicada oficialmente! El enlace ahora es accesible para el cliente.");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al publicar la cotización.");
    } finally {
      setLoading(false);
    }
  };

  // Revocar / Despublicar
  const handleToggleRevocation = async () => {
    setLoading(true);
    setError(null);
    try {
      if (budget.public_status === "revoked") {
        const published = await publishBudget(budget.id);
        setBudget((prev) => ({ ...prev, public_status: "published", public_token: published.public_token, status: published.status }));
        setSuccess("Enlace público restablecido exitosamente.");
      } else {
        await revokeBudget(budget.id);
        setBudget((prev) => ({ ...prev, public_status: "revoked" }));
        setSuccess("Enlace público revocado. Los clientes ya no podrán acceder.");
      }
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al actualizar visibilidad pública.");
    } finally {
      setLoading(false);
    }
  };

  // Confirmar Venta (Directa o Distribuidor)
  const handleConfirmSale = async () => {
    if (!selectedChannel) {
      setError("Debe seleccionar un canal de venta.");
      return;
    }

    if (selectedChannel === "distributor" && !selectedDistributor) {
      setError("Debe seleccionar obligatoriamente un distribuidor para registrar la compra.");
      return;
    }

    const activeItems = budget.items.filter((item) => selectedItems[item.id]);
    if (activeItems.length === 0) {
      setError("Debe seleccionar al menos un producto con saldo disponible.");
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
        quantity: convertQuantities[item.id] || 1,
        factoryNotes: selectedChannel === "direct" ? factoryNotes[item.id] || undefined : undefined
      }));

      const payload = JSON.stringify({
        budgetId: budget.id,
        itemsToConvert,
        orderNotes,
        saleType: selectedChannel,
        distributorId: selectedChannel === "distributor" ? selectedDistributor.id : undefined,
        purchaseDate: selectedChannel === "distributor" ? purchaseDate : undefined,
        distributorReference: selectedChannel === "distributor" ? distributorReference : undefined
      });

      if (saleIdempotencyKeyRef.current?.payload !== payload) {
        saleIdempotencyKeyRef.current = { payload, key: crypto.randomUUID() };
      }
      const idempotencyKey = saleIdempotencyKeyRef.current.key;

      const orderResult: any = await convertBudgetToOrder(
        budget.id,
        itemsToConvert,
        orderNotes,
        selectedChannel,
        {
          idempotencyKey,
          distributorId: selectedChannel === "distributor" ? selectedDistributor.id : undefined,
          purchaseDate: selectedChannel === "distributor" ? purchaseDate : undefined,
          distributorReference: selectedChannel === "distributor" ? distributorReference : undefined
        }
      );

      saleIdempotencyKeyRef.current = null;
      setShowSaleModal(false);

      const generatedNum = orderResult?.order_number;
      const generatedId = orderResult?.id || orderResult?.order_id;

      setCreatedOrderAlert({
        id: generatedId,
        orderNumber: generatedNum,
        channel: selectedChannel === "direct" ? "Venta Directa FiveSaint" : `Distribuidor (${selectedDistributor?.company_name})`
      });

      setSuccess(
        selectedChannel === "direct"
          ? `¡Venta directa confirmada! Pedido de fábrica N° ${generatedNum} generado exitosamente.`
          : `¡Compra en distribuidor registrada! N° de registro N° ${generatedNum} guardado en el seguimiento.`
      );

      // Actualizar datos del servidor
      router.refresh();
    } catch (err: any) {
      console.error("Error al registrar venta:", err);
      setError(err.message || "Error al procesar el registro de venta.");
    } finally {
      setLoading(false);
    }
  };

  const breakdown = resolveIssuedBudgetTotals(budget as any);
  const remainingBudgetBalance = budget.operations_summary?.total_pending !== undefined
    ? budget.operations_summary.total_pending
    : budget.items.reduce((sum, item) => sum + (item.remaining_quantity !== undefined ? item.remaining_quantity : item.quantity), 0);

  // Cálculo en vivo para el resumen del modal
  const selectedItemsSummary = budget.items.filter((item) => selectedItems[item.id]);
  const selectedUnitsCount = selectedItemsSummary.reduce((sum, item) => sum + (convertQuantities[item.id] || 0), 0);
  const selectedEstimatedAmount = selectedItemsSummary.reduce((sum, item) => {
    const qty = convertQuantities[item.id] || 0;
    return sum + (qty * item.unit_price);
  }, 0);
  const remainingAfterConfirm = Math.max(0, remainingBudgetBalance - selectedUnitsCount);

  // Badge de Estado Comercial
  const getClosingBadge = () => {
    const summary = budget.operations_summary;
    if (summary && summary.closing_channel === "mixed") {
      return (
        <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-xs font-bold py-1 px-3 shadow-xs">
          Venta Mixta
        </Badge>
      );
    }
    if (budget.status === "converted" || (summary && summary.closing_channel === "direct" && summary.total_pending === 0)) {
      return (
        <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-bold py-1 px-3">
          Venta Directa Completa
        </Badge>
      );
    }
    if (budget.status === "distributor_sale" || (summary && summary.closing_channel === "distributor" && summary.total_pending === 0)) {
      return (
        <Badge className="bg-teal-100 text-teal-900 border-teal-300 text-xs font-bold py-1 px-3">
          Compra Distribuidor Completa
        </Badge>
      );
    }
    if (budget.status === "partially_converted") {
      if (summary?.closing_channel === "mixed") {
        return (
          <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-xs font-bold py-1 px-3">
            Venta Mixta (Parcial)
          </Badge>
        );
      }
      return (
        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-bold py-1 px-3">
          Cierre Parcial ({remainingBudgetBalance} pend.)
        </Badge>
      );
    }
    if (budget.status === "rejected") {
      return <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs font-bold py-1 px-3">Rechazado</Badge>;
    }
    if (budget.status === "accepted") {
      return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs font-bold py-1 px-3">Aceptado</Badge>;
    }
    if (budget.status === "sent") {
      return <Badge className="bg-blue-50 text-blue-800 border-blue-300 text-xs font-bold py-1 px-3">Enviado al Cliente</Badge>;
    }
    return <Badge className="bg-stone-100 text-stone-700 border-stone-300 text-xs font-bold py-1 px-3">Borrador</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Componente Oculto para Impresión de PDF Oficial */}
      <div style={{ display: "none" }}>
        <BudgetPrintPdf ref={printRef} budget={budget} />
      </div>

      {/* Alerta de Operación Confirmada */}
      {createdOrderAlert && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Operación registrada exitosamente (N° {createdOrderAlert.orderNumber})
              </h4>
              <p className="text-xs text-emerald-800">
                Canal: <strong>{createdOrderAlert.channel}</strong>. El saldo y los registros fueron actualizados.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
            >
              <Link href={`${ordersBasePath}/${createdOrderAlert.id}`}>
                Ver Detalle del Pedido N° {createdOrderAlert.orderNumber}
              </Link>
            </Button>
            <button
              onClick={() => setCreatedOrderAlert(null)}
              className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Alertas de Notificación */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-sm">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-black text-stone-900">
              Presupuesto #{budget.budget_number}
            </h2>
            {getClosingBadge()}
            {budget.public_status === "published" && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold">
                Online
              </Badge>
            )}
          </div>
          <p className="text-stone-500 text-xs">
            Creado el {new Date(budget.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePrint()}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-semibold border-stone-300 text-stone-700 hover:bg-stone-50 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-stone-500" />
            <span>Descargar / Imprimir PDF</span>
          </Button>

          {budget.status === "rejected" ? (
            <Button
              onClick={handleReopenBudget}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reabrir Presupuesto</span>
            </Button>
          ) : remainingBudgetBalance > 0 ? (
            <Button
              onClick={openSaleModal}
              disabled={loading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Registrar Venta</span>
            </Button>
          ) : (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Saldo agotado (Venta completa)</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Información y Productos */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Tarjeta de Información Comercial y Cliente */}
          <Card className="p-6 border-stone-200 bg-white">
            <h3 className="font-bold text-stone-900 mb-4 text-sm uppercase tracking-wider text-stone-500">
              Datos Comerciales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-150">
                <span className="font-bold text-stone-700 block mb-1">Cliente</span>
                <span className="text-stone-900 font-bold text-sm block">{budget.clients?.name}</span>
                {budget.clients?.company_name && (
                  <span className="text-stone-500 block">{budget.clients.company_name}</span>
                )}
                {budget.clients?.phone && (
                  <span className="text-stone-500 block mt-1">Tel: {budget.clients.phone}</span>
                )}
                {budget.clients?.email && (
                  <span className="text-stone-500 block">Email: {budget.clients.email}</span>
                )}
              </div>

              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-150">
                <span className="font-bold text-stone-700 block mb-1">Asesor Responsable</span>
                <span className="text-stone-900 font-bold text-sm block">{budget.sellers?.full_name || "Sin asignar"}</span>
                {budget.sellers?.email && (
                  <span className="text-stone-500 block">{budget.sellers.email}</span>
                )}
                {budget.distributors && (
                  <div className="mt-2 pt-2 border-t border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Distribuidor Cotizado:</span>
                    <span className="text-stone-800 font-semibold">{budget.distributors.company_name}</span>
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
                  Notas Internas Confidenciales
                </h4>
                <p className="text-stone-750 font-normal whitespace-pre-line leading-relaxed">
                  {budget.notes}
                </p>
              </div>
            )}
          </Card>

          {/* Listado de Productos y Saldos por Canal */}
          <Card className="p-6 border-stone-200 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-stone-900">Control de Productos y Saldos de Venta</h3>
                <p className="text-xs text-stone-500">
                  Desglose exacto de cantidades presupuestadas, confirmadas directamente y compradas en distribuidor.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 rounded text-stone-700">
                {budget.items.length} {budget.items.length === 1 ? "ítem" : "ítems"}
              </span>
            </div>

            <div className="overflow-x-auto border border-stone-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 font-bold uppercase text-[10px]">
                    <th className="px-3 py-2.5">Producto</th>
                    <th className="px-3 py-2.5 text-center">Presup.</th>
                    <th className="px-3 py-2.5 text-center text-emerald-800">Conf. Directa</th>
                    <th className="px-3 py-2.5 text-center text-teal-800">En Distribuidor</th>
                    <th className="px-3 py-2.5 text-center text-rose-800">Cancelada</th>
                    <th className="px-3 py-2.5 text-center bg-amber-50/50">Pendiente</th>
                    <th className="px-3 py-2.5 text-right">P. Unitario</th>
                    <th className="px-3 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {budget.items.map((item) => {
                    const direct = item.direct_quantity || 0;
                    const dist = item.distributor_quantity || 0;
                    const canc = item.cancelled_quantity || 0;
                    const remaining = item.remaining_quantity !== undefined ? item.remaining_quantity : (item.quantity - (direct + dist));
                    const isDone = remaining <= 0;

                    return (
                      <tr key={item.id} className={isDone ? "bg-stone-50/60 text-stone-500" : ""}>
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
                        <td className="px-3 py-3 text-center text-emerald-700 font-bold">
                          {direct > 0 ? direct : "-"}
                        </td>
                        <td className="px-3 py-3 text-center text-teal-700 font-bold">
                          {dist > 0 ? dist : "-"}
                        </td>
                        <td className="px-3 py-3 text-center text-rose-600 font-medium">
                          {canc > 0 ? canc : "-"}
                        </td>
                        <td className="px-3 py-3 text-center font-bold bg-amber-50/40">
                          {isDone ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">Agotado</span>
                          ) : (
                            <span className="text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded text-[10px]">{remaining} disp.</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-stone-700">{formatCurrencyARS(item.unit_price)}</td>
                        <td className="px-3 py-3 text-right font-bold text-stone-900">
                          {formatCurrencyARS(item.quantity * item.unit_price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumen Operativo de Cierres */}
            {budget.operations_summary && (
              <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 font-medium">Estado consolidado de operaciones:</span>
                  <span className="font-bold text-stone-900">{budget.operations_summary.closing_label}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-stone-600">
                  <span>Presupuestadas: <strong>{budget.operations_summary.total_budgeted}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-800">Directas: <strong>{budget.operations_summary.total_direct}</strong></span>
                  <span>•</span>
                  <span className="text-teal-800">En Distribuidor: <strong>{budget.operations_summary.total_distributor}</strong></span>
                  <span>•</span>
                  <span className="text-amber-800">Pendientes: <strong>{budget.operations_summary.total_pending}</strong></span>
                </div>
              </div>
            )}
          </Card>

          {/* Listado de Operaciones y Pedidos Vinculados */}
          {budget.orders && budget.orders.length > 0 && (
            <Card className="p-6 border-stone-200 bg-white">
              <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-accent-deep" />
                <span>Operaciones y Pedidos Generados ({budget.orders.length})</span>
              </h3>

              <div className="divide-y divide-stone-150 border border-stone-200 rounded-lg overflow-hidden">
                {budget.orders.map((o) => {
                  const isDist = o.sale_channel === "distributor" || o.order_type === "distributor_sale";
                  const isCancelled = o.status === "cancelled";

                  return (
                    <div
                      key={o.id}
                      className={`p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                        isCancelled ? "bg-stone-100/60 opacity-70" : "bg-white hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-xs">
                            Pedido #{o.order_number}
                          </span>
                          <Badge className={
                            isDist
                              ? "bg-teal-50 text-teal-800 border-teal-200 text-[10px]"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]"
                          }>
                            {isDist ? "Compra Distribuidor" : "Venta Directa Fábrica"}
                          </Badge>
                          {isCancelled && (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                              Cancelado
                            </Badge>
                          )}
                        </div>

                        <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-2">
                          {isDist ? (
                            <span>
                              Distribuidor: <strong>{o.distributors?.company_name || "Distribuidor no registrado"}</strong>
                              {o.purchase_date && ` (Fecha de compra: ${new Date(o.purchase_date).toLocaleDateString("es-AR")})`}
                              {o.distributor_reference && ` [Ref: ${o.distributor_reference}]`}
                            </span>
                          ) : (
                            <span>Pedido directo a fábrica</span>
                          )}
                          <span>• Registrado por: {o.recorded_by_name || "Asesor comercial"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black text-xs text-stone-900">
                          {formatCurrencyARS(o.total_amount)}
                        </span>
                        <Button
                          variant="outline"
                          asChild
                          className="text-[11px] h-7 px-2.5 border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer"
                        >
                          <Link href={`${ordersBasePath}/${o.id}`}>
                            Ver Detalle
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Columna Derecha: Totales y Acciones del Vendedor */}
        <div className="flex flex-col gap-6">
          {/* Resumen Financiero Oficial */}
          <Card className="p-6 border-stone-200 bg-white">
            <h3 className="font-bold text-stone-900 mb-4 text-xs uppercase tracking-wider text-stone-500">
              Resumen Financiero Oficial
            </h3>

            <div className="flex flex-col gap-2 border-b border-stone-200 pb-3 mb-3 text-xs">
              <div className="flex justify-between items-center text-stone-600">
                <span>Subtotal Base:</span>
                <span className="font-medium text-stone-900">{formatCurrencyARS(breakdown.subtotal)}</span>
              </div>

              {breakdown.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Descuento aplicado:</span>
                  <span className="font-bold">-{formatCurrencyARS(breakdown.discountAmount)}</span>
                </div>
              )}

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

            {/* Botones de Acción Comercial */}
            <div className="flex flex-col gap-2.5">
              {/* 1. Registrar Venta (Flujo principal) */}
              {budget.status !== "rejected" && remainingBudgetBalance > 0 && (
                <Button
                  onClick={openSaleModal}
                  disabled={loading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Registrar Venta</span>
                </Button>
              )}

              {/* 2. Reabrir Presupuesto si está rechazado */}
              {budget.status === "rejected" && (
                <Button
                  onClick={handleReopenBudget}
                  disabled={loading}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reabrir Presupuesto</span>
                </Button>
              )}

              {/* 3. Registrar Envío Comercial */}
              <Button
                variant="outline"
                onClick={() => {
                  setShipmentDate(new Date().toISOString().slice(0, 16));
                  setShipmentNotes("");
                  setShowShipmentModal(true);
                }}
                disabled={loading}
                className="w-full border-blue-300 text-blue-800 hover:bg-blue-50 font-bold text-xs py-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 text-blue-600" />
                <span>Registrar Envío</span>
              </Button>

              {/* 4. Publicar Cotización Digital */}
              {(budget.status === "draft" || budget.public_status === "draft") && (
                <Button
                  onClick={handlePublishBudget}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Publicar Cotización Digital</span>
                </Button>
              )}

              {/* 5. Rechazar Presupuesto */}
              {budget.status !== "rejected" && budget.status !== "converted" && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (budget.has_active_operations) {
                        setError("No se puede rechazar el presupuesto porque posee operaciones comerciales vigentes. Debe cancelar los pedidos previamente si desea rechazarlo.");
                        return;
                      }
                      setRejectionReasonInput("");
                      setShowRejectModal(true);
                    }}
                    disabled={loading || Boolean(budget.has_active_operations)}
                    className={`w-full text-xs cursor-pointer ${
                      budget.has_active_operations
                        ? "text-stone-400 bg-stone-100 cursor-not-allowed"
                        : "text-stone-500 hover:text-rose-600 hover:bg-rose-50"
                    }`}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Marcar como Rechazado
                  </Button>
                  {budget.has_active_operations && (
                    <p className="text-[10px] text-stone-400 text-center mt-1">
                      (Bloqueado: existen ventas vigentes confirmadas)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bloque Informativo: Estado de Envío y Publicación Digital Separados */}
            <div className="border-t border-stone-200 pt-4 mt-4 flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1 p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 text-[11px] uppercase">Publicación Online:</span>
                  <Badge className={
                    budget.public_status === "published"
                      ? "bg-blue-50 text-blue-800 border-blue-200 text-[10px]"
                      : "bg-stone-200 text-stone-700 text-[10px]"
                  }>
                    {budget.public_status === "published" ? "Habilitada" : "Borrador Privado"}
                  </Badge>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {budget.public_status === "published"
                    ? "El cliente puede acceder mediante su enlace digital único."
                    : "Enlace inactivo. El cliente no puede visualizar el documento."}
                </p>
              </div>

              <div className="flex flex-col gap-1 p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 text-[11px] uppercase">Envío al Cliente:</span>
                  <Badge className={
                    budget.sent_at
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]"
                      : "bg-amber-50 text-amber-800 border-amber-200 text-[10px]"
                  }>
                    {budget.sent_at ? "Enviado" : "Pendiente de Envío"}
                  </Badge>
                </div>
                {budget.sent_at ? (
                  <div className="text-[11px] text-stone-600 mt-1">
                    <div>Medio: <strong>{budget.sent_via || "No especificado"}</strong></div>
                    <div>Fecha: {new Date(budget.sent_at).toLocaleDateString("es-AR")}</div>
                    {budget.sent_by_name && <div>Registrado por: {budget.sent_by_name}</div>}
                    {budget.shipment_notes && <div className="text-stone-500 italic mt-0.5">&quot;{budget.shipment_notes}&quot;</div>}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Aún no se registró el envío comercial al cliente.
                  </p>
                )}
              </div>

              {/* Compartir enlace público y WhatsApp */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase">Enlace Digital:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-[11px] font-mono text-stone-700 bg-stone-50 select-all"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="shrink-0 text-stone-600 hover:text-stone-900 border-stone-300 cursor-pointer h-8 px-2.5"
                    title="Copiar enlace"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>

                {budget.clients?.phone && (
                  <Button
                    variant="outline"
                    asChild
                    className="w-full mt-1 border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold py-1.5 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Enviar por WhatsApp</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* MODAL 1: REGISTRAR VENTA (Venta directa FiveSaint vs Compra en distribuidor) */}
      {/* ====================================================================== */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-stone-200 my-8">
            <div className="flex justify-between items-start pb-4 border-b border-stone-150">
              <div>
                <h3 className="text-lg font-black text-stone-900">Registrar Venta de Cotización</h3>
                <p className="text-xs text-stone-500">
                  Presupuesto N° #{budget.budget_number} • Cliente: <strong>{budget.clients?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSaleModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PASO 1: ELECCIÓN EXPLÍCITA DEL CANAL (Sin canal por defecto) */}
            {!selectedChannel ? (
              <div className="py-6 flex flex-col gap-4">
                <div className="text-center mb-2">
                  <h4 className="text-sm font-bold text-stone-800">¿Cómo se concretó la operación?</h4>
                  <p className="text-xs text-stone-500">Seleccioná el canal correspondiente para registrar la operación.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opción A: Venta Directa */}
                  <button
                    type="button"
                    onClick={() => setSelectedChannel("direct")}
                    className="p-5 rounded-xl border-2 border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/30 text-left transition-all flex flex-col gap-2 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Factory className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-stone-900 block group-hover:text-emerald-900">
                        Venta directa FiveSaint
                      </span>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        El cliente nos compra directamente. Genera el pedido operativo de fábrica para producción y entrega.
                      </p>
                    </div>
                    <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <span>Seleccionar canal directo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {/* Opción B: Compra en Distribuidor */}
                  <button
                    type="button"
                    onClick={() => setSelectedChannel("distributor")}
                    className="p-5 rounded-xl border-2 border-stone-200 hover:border-teal-600 hover:bg-teal-50/30 text-left transition-all flex flex-col gap-2 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-stone-900 block group-hover:text-teal-900">
                        Compra en distribuidor
                      </span>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        El cliente compró a través de un showroom o distribuidor oficial. Registra el seguimiento de cartera.
                      </p>
                    </div>
                    <div className="mt-2 text-xs font-bold text-teal-700 flex items-center gap-1">
                      <span>Seleccionar distribuidor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              /* PASO 2: FORMULARIO DEL CANAL SELECCIONADO */
              <div className="py-4 flex flex-col gap-4">
                {/* Selector de Canal Activo con botón de cambio */}
                <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    {selectedChannel === "direct" ? (
                      <Factory className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <Store className="w-5 h-5 text-teal-700" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        {selectedChannel === "direct" ? "Canal: Venta directa FiveSaint" : "Canal: Compra en distribuidor"}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {selectedChannel === "direct"
                          ? "Genera pedido operativo de fábrica para entrega"
                          : "Seguimiento comercial sin efectos operativos de fabricación directa"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel(null)}
                    className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                  >
                    Cambiar canal
                  </button>
                </div>

                {/* Si es Distribuidor: Selección Obligatoria con búsqueda paginada */}
                {selectedChannel === "distributor" && (
                  <div className="p-4 bg-teal-50/40 border border-teal-200 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-teal-950 uppercase flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-teal-700" />
                        <span>Distribuidor donde compró el cliente (* Obligatorio):</span>
                      </label>
                      {selectedDistributor && (
                        <button
                          type="button"
                          onClick={() => setSelectedDistributor(null)}
                          className="text-[11px] text-teal-700 hover:underline cursor-pointer"
                        >
                          Elegir otro
                        </button>
                      )}
                    </div>

                    {selectedDistributor ? (
                      <div className="p-3 bg-white border-2 border-teal-500 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-bold text-stone-900 text-xs block">
                            {selectedDistributor.company_name}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Contacto: {selectedDistributor.contact_name || "N/A"} • {selectedDistributor.phone || selectedDistributor.email || ""}
                          </span>
                        </div>
                        <Badge className="bg-teal-100 text-teal-800 border-teal-300 text-[10px]">
                          Seleccionado
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Buscar distribuidor por nombre o contacto..."
                            value={distributorSearchQuery}
                            onChange={(e) => setDistributorSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-teal-500"
                          />
                        </div>

                        {/* Listado paginado de distribuidores */}
                        <div className="max-h-40 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-lg bg-white">
                          {distributorLoading ? (
                            <div className="p-3 text-center text-xs text-stone-400">Buscando distribuidores...</div>
                          ) : distributorList.length === 0 ? (
                            <div className="p-3 text-center text-xs text-stone-400">No se encontraron distribuidores activos.</div>
                          ) : (
                            distributorList.map((d) => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => setSelectedDistributor(d)}
                                className="w-full p-2.5 text-left hover:bg-teal-50/60 flex items-center justify-between text-xs transition-colors cursor-pointer"
                              >
                                <div>
                                  <span className="font-bold text-stone-800 block">{d.company_name}</span>
                                  <span className="text-[10px] text-stone-500">{d.contact_name} {d.address ? `• ${d.address}` : ""}</span>
                                </div>
                                <span className="text-[11px] text-teal-700 font-semibold">Seleccionar</span>
                              </button>
                            ))
                          )}
                        </div>

                        {distributorTotalPages > 1 && (
                          <div className="flex justify-between items-center text-[10px] text-stone-500 px-1">
                            <span>Página {distributorPage} de {distributorTotalPages}</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={distributorPage <= 1}
                                onClick={() => fetchDistributors(distributorSearchQuery, distributorPage - 1)}
                                className="px-2 py-0.5 border border-stone-200 rounded disabled:opacity-40"
                              >
                                Anterior
                              </button>
                              <button
                                type="button"
                                disabled={distributorPage >= distributorTotalPages}
                                onClick={() => fetchDistributors(distributorSearchQuery, distributorPage + 1)}
                                className="px-2 py-0.5 border border-stone-200 rounded disabled:opacity-40"
                              >
                                Siguiente
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fecha de Compra y Referencia */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-teal-150">
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          Fecha de compra en distribuidor (*):
                        </label>
                        <input
                          type="date"
                          value={purchaseDate}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setPurchaseDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 block mb-1">
                          Referencia / Ticket del distribuidor (opcional):
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Factura B-00124 o Remito #884"
                          value={distributorReference}
                          onChange={(e) => setDistributorReference(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Selección de Productos y Cantidades */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-stone-700 uppercase">
                    Productos y cantidades a confirmar:
                  </label>

                  <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {budget.items.map((item) => {
                      const maxAvailable = item.remaining_quantity !== undefined ? item.remaining_quantity : item.quantity;
                      const isUnavailable = maxAvailable <= 0;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border text-xs flex flex-col gap-2 transition-all ${
                            isUnavailable
                              ? "bg-stone-100 border-stone-200 opacity-50"
                              : selectedItems[item.id]
                              ? selectedChannel === "direct"
                                ? "bg-emerald-50/40 border-emerald-300"
                                : "bg-teal-50/40 border-teal-300"
                              : "bg-white border-stone-200"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={isUnavailable}
                                checked={Boolean(selectedItems[item.id]) && !isUnavailable}
                                onChange={() => setSelectedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                              />
                              <div>
                                <span className="font-bold text-stone-900 block">{item.product_name}</span>
                                <span className="text-[11px] text-stone-500">
                                  Saldo disponible: <strong>{maxAvailable}</strong> de {item.quantity} presupuestadas
                                </span>
                              </div>
                            </label>

                            {selectedItems[item.id] && !isUnavailable && (
                              <div className="flex items-center gap-2 pl-6 sm:pl-0">
                                <span className="text-[11px] text-stone-600 font-medium">Cantidad:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max={maxAvailable}
                                  value={convertQuantities[item.id] || 1}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    const bounded = Math.max(1, Math.min(maxAvailable, val));
                                    setConvertQuantities(prev => ({ ...prev, [item.id]: bounded }));
                                  }}
                                  className="w-16 px-2 py-1 border border-stone-300 rounded text-center text-xs font-bold text-stone-900 bg-white"
                                />
                              </div>
                            )}
                          </div>

                          {/* Aclaraciones del pedido: SOLO para Venta Directa (oculto en distribuidor) */}
                          {selectedChannel === "direct" && selectedItems[item.id] && !isUnavailable && (
                            <div className="pl-6 pt-1">
                              <input
                                type="text"
                                placeholder="Aclaraciones para el pedido (lado de motor, jets, color, etc.)"
                                value={factoryNotes[item.id] || ""}
                                onChange={(e) => setFactoryNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="w-full px-2.5 py-1.5 border border-stone-200 rounded text-xs text-stone-800 bg-white placeholder-stone-400"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Observaciones generales */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-stone-600">
                    Observaciones adicionales del registro (opcional):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Comentarios u observaciones de la operación..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white"
                  />
                </div>

                {/* RESUMEN EXPLICATIVO ANTES DE CONFIRMAR */}
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex flex-col gap-2 text-xs">
                  <span className="font-bold text-stone-700 uppercase text-[10px] tracking-wide">
                    Resumen de la confirmación:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-stone-500 block">Cliente:</span>
                      <strong className="text-stone-900">{budget.clients?.name}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Canal:</span>
                      <strong className={selectedChannel === "direct" ? "text-emerald-800" : "text-teal-800"}>
                        {selectedChannel === "direct" ? "Venta directa FiveSaint" : `Distribuidor: ${selectedDistributor?.company_name || "(Pendiente)"}`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Unidades a confirmar:</span>
                      <strong className="text-stone-900">{selectedUnitsCount} unidades</strong>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Saldo restante post-operación:</span>
                      <strong className={remainingAfterConfirm === 0 ? "text-emerald-700" : "text-amber-800"}>
                        {remainingAfterConfirm === 0 ? "0 (Cierre total)" : `${remainingAfterConfirm} unidades`}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Botones de acción del modal */}
                <div className="flex justify-end items-center gap-3 pt-3 border-t border-stone-150">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowSaleModal(false)}
                    disabled={loading}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmSale}
                    disabled={loading || selectedUnitsCount === 0 || (selectedChannel === "distributor" && !selectedDistributor)}
                    className={`text-xs font-bold text-white flex items-center gap-2 cursor-pointer ${
                      selectedChannel === "direct"
                        ? "bg-emerald-700 hover:bg-emerald-800"
                        : "bg-teal-700 hover:bg-teal-800"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {selectedChannel === "direct"
                        ? "Confirmar venta y generar pedido"
                        : "Registrar compra en distribuidor"}
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 2: REGISTRAR ENVÍO COMERCIAL (WhatsApp/PDF, Enlace, etc.) */}
      {/* ====================================================================== */}
      {showShipmentModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-stone-200">
            <div className="flex justify-between items-start pb-3 border-b border-stone-150 mb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>Registrar Envío Comercial</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Registrá el medio y fecha por el cual le entregaste la cotización al cliente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShipmentModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Medio de Envío:</label>
                <select
                  value={shipmentMedium}
                  onChange={(e: any) => setShipmentMedium(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-xs font-medium"
                >
                  <option value="whatsapp">WhatsApp / PDF adjunto</option>
                  <option value="digital_link">Enlace Digital Oficial</option>
                  <option value="email">Correo Electrónico</option>
                  <option value="printed_pdf">PDF Impreso / Entrega en mano</option>
                  <option value="other">Otro medio comercial</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Fecha y Hora de Envío:</label>
                <input
                  type="datetime-local"
                  value={shipmentDate}
                  onChange={(e) => setShipmentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Aclaraciones o Notas (opcional):</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Se envió ficha técnica y cotización por WhatsApp al titular."
                  value={shipmentNotes}
                  onChange={(e) => setShipmentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-150">
                <Button
                  variant="outline"
                  onClick={() => setShowShipmentModal(false)}
                  disabled={loading}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRecordShipmentSubmit}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Confirmar Registro de Envío
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 3: RECHAZAR PRESUPUESTO */}
      {/* ====================================================================== */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-stone-200">
            <div className="flex items-center gap-3 text-rose-700 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-stone-900">Marcar Presupuesto como Rechazado</h3>
            </div>
            <p className="text-xs text-stone-600 mb-4">
              Indique el motivo por el cual el cliente desestimó la propuesta comercial.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Motivo de rechazo (precio, plazos, eligió competidor, etc.)..."
                rows={3}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
                className="text-xs"
              >
                Volver
              </Button>
              <Button
                onClick={handleRejectBudget}
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Confirmar Rechazo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
