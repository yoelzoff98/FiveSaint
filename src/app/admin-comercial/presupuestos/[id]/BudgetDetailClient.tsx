"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  FileText, User, Calendar, DollarSign, Building, Mail, 
  Phone, MapPin, CheckSquare, RefreshCw, AlertCircle, ShoppingBag, Check, X, Printer,
  Share2, Copy
} from "lucide-react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { BudgetPrintPdf } from "@/components/pdf/BudgetPrintPdf";
import { updateBudgetStatus, convertBudgetToOrder } from "@/lib/supabase/comercial";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface BudgetItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string | null;
  variant_id: string | null;
}

interface Budget {
  id: string;
  budget_number: number;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  clients: {
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  sellers: {
    full_name: string;
    email: string;
  } | null;
  items: BudgetItem[];
  view_count?: number | null;
  viewed_at?: string | null;
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
  const [showConvertPanel, setShowConvertPanel] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ [id: string]: boolean }>(
    initialBudget.items.reduce((acc, item) => ({ ...acc, [item.id]: true }), {})
  );
  const [convertQuantities, setConvertQuantities] = useState<{ [id: string]: number }>(
    initialBudget.items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {})
  );
  const [factoryNotes, setFactoryNotes] = useState<{ [id: string]: string }>({});
  
  const [orderNotes, setOrderNotes] = useState(`Pedido generado desde el presupuesto #${initialBudget.budget_number}.`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/presupuesto/${budget.id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/presupuesto/${budget.id}`;
  
  const cleanPhone = budget.clients?.phone ? budget.clients.phone.replace(/\D/g, "") : "";
  const whatsappUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Te envío el presupuesto solicitado: ${publicUrl}`)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(`Te envío el presupuesto solicitado: ${publicUrl}`)}`;

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    const channel = supabase
      .channel(`budget-view-tracker-${budget.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "budgets",
          filter: `id=eq.${budget.id}`
        },
        (payload: any) => {
          const updated = payload.new;
          if (updated) {
            setBudget(prev => ({
              ...prev,
              view_count: updated.view_count,
              viewed_at: updated.viewed_at
            }));

            setToastMessage("¡El cliente acaba de abrir el presupuesto online en tiempo real!");
            
            setTimeout(() => {
              setToastMessage(null);
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [budget.id]);

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    setError(null);

    try {
      await updateBudgetStatus(budget.id, newStatus);
      
      setBudget(prev => ({ ...prev, status: newStatus }));
      setSuccess(`Estado del presupuesto actualizado a: ${newStatus}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al actualizar estado.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleQuantityChange = (itemId: string, maxQty: number, val: number) => {
    const qty = Math.max(1, Math.min(maxQty, val));
    setConvertQuantities((prev) => ({ ...prev, [itemId]: qty }));
  };

  const handleConvertToOrder = async () => {
    const activeItems = budget.items.filter((item) => selectedItems[item.id]);
    
    if (activeItems.length === 0) {
      setError("Tenés que seleccionar al menos un producto para convertir en pedido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const itemsToConvert = activeItems.map((item) => ({
        productId: item.product_id || undefined,
        variantId: item.variant_id || undefined,
        productName: item.product_name,
        variantName: item.variant_name || undefined,
        quantity: convertQuantities[item.id] || item.quantity,
        unitPrice: item.unit_price,
        factoryNotes: factoryNotes[item.id] || undefined
      }));

      const order = await convertBudgetToOrder(budget.id, itemsToConvert, orderNotes);

      setBudget((prev) => ({ ...prev, status: "converted" }));
      setShowConvertPanel(false);
      setSuccess("¡El presupuesto se ha convertido a Pedido con éxito!");
      
      // Redirigir al listado de pedidos después de unos segundos
      setTimeout(() => {
        router.push(`/admin-comercial/pedidos/${order.id}`);
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
        return <Badge className="bg-green-50 text-green-700 border-green-200 text-sm py-1 px-3">Confirmado (Pedido)</Badge>;
      case "sent":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-sm py-1 px-3">Enviado al Cliente</Badge>;
      case "draft":
        return <Badge className="bg-stone-50 text-stone-700 border-stone-200 text-sm py-1 px-3">Borrador</Badge>;
      case "accepted":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-250 text-sm py-1 px-3">Aceptado</Badge>;
      case "rejected":
        return <Badge className="bg-red-50 text-red-700 border-red-200 text-sm py-1 px-3">Rechazado</Badge>;
      default:
        return <Badge className="bg-stone-100 text-stone-600 border-stone-300 text-sm py-1 px-3">{status}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Columna Izquierda: Detalles del presupuesto y tabla */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Ficha de Información */}
        <Card className="p-6 border-stone-200 bg-white">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-stone-600" />
              <div>
                <h2 className="text-xl font-bold text-stone-900">Presupuesto #{budget.budget_number}</h2>
                <span className="text-stone-500 text-xs font-semibold">
                  Creado: {new Date(budget.created_at).toLocaleDateString("es-AR")}
                </span>
              </div>
            </div>
            <div>
              {getStatusBadge(budget.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-stone-700 border-t border-stone-100 pt-6">
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Información del Cliente</h3>
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
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Responsable</h3>
              <div className="flex items-center gap-2 text-stone-850">
                <User className="w-4 h-4 text-stone-400" />
                <span>Vendedor: {budget.sellers?.full_name || "Admin / Oficina Central"}</span>
              </div>
            </div>
          </div>

          {budget.notes && (
            <div className="mt-6 p-4 bg-stone-50 border border-stone-150 rounded-lg">
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Observaciones adicionales</h4>
              <p className="text-sm text-stone-750 font-normal whitespace-pre-line leading-relaxed">
                {budget.notes}
              </p>
            </div>
          )}
        </Card>

        {/* Listado de ítems */}
        <Card className="p-6 border-stone-200 bg-white">
          <h3 className="font-bold text-stone-900 mb-4">Productos Cotizados</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Producto / Concepto</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Precio Unitario</th>
                  <th className="px-4 py-3 text-right">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {budget.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-stone-900">{item.product_name}</div>
                      {item.variant_name && (
                        <div className="text-xs text-stone-500 font-medium mt-0.5">{item.variant_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium">{item.quantity}</td>
                    <td className="px-4 py-3.5 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-stone-950">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Panel para conversión a Pedido (Total o Parcial) */}
        {showConvertPanel && (
          <Card className="p-6 border-amber-200 bg-amber-50/20 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                Configurar Conversión a Pedido (Total o Parcial)
              </h3>
              <button 
                onClick={() => setShowConvertPanel(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-stone-600 text-xs mb-6">
              Seleccioná qué productos del presupuesto se confirmaron y la cantidad de cada uno. Las cantidades no pueden superar las cotizadas originalmente.
            </p>

            <div className="flex flex-col gap-4 mb-6">
              {budget.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 p-3 bg-white border border-stone-200 rounded-lg text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItems[item.id] || false}
                        onChange={() => handleToggleItemSelection(item.id)}
                        className="w-4.5 h-4.5 text-accent-deep rounded border-stone-300 focus:ring-accent-deep"
                      />
                      <div>
                        <div className="font-bold text-stone-900">{item.product_name}</div>
                        <div className="text-stone-400 font-medium">Cotizado: {item.quantity} uds.</div>
                      </div>
                    </div>

                    {selectedItems[item.id] && (
                      <div className="flex items-center gap-3">
                        <label className="text-stone-600 font-medium">Cantidad a Pedir:</label>
                        <input
                          type="number"
                          min="1"
                          max={item.quantity}
                          value={convertQuantities[item.id] || 1}
                          onChange={(e) => handleQuantityChange(item.id, item.quantity, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border border-stone-300 rounded focus:ring-1 focus:ring-accent-deep text-center text-stone-850 font-bold"
                        />
                      </div>
                    )}
                  </div>

                  {selectedItems[item.id] && (
                    <div className="flex flex-col gap-1 pl-7.5 w-full">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                        Aclaraciones / Especificaciones para Fábrica (Motor, Jets, Equipamiento adicional)
                      </label>
                      <input
                        type="text"
                        value={factoryNotes[item.id] || ""}
                        onChange={(e) => setFactoryNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Ej. 6 jets, motor lado izquierdo, pulsador neumático, etc."
                        className="w-full px-3 py-1.5 border border-stone-200 rounded text-stone-850 focus:outline-none focus:ring-1 focus:ring-accent-deep placeholder-stone-400"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 mb-6">
              <label className="text-xs font-bold text-stone-600">Notas específicas del pedido (ej. dirección de envío, seña recibida)</label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm text-stone-800 bg-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConvertPanel(false)} disabled={loading} className="cursor-pointer">
                Cancelar
              </Button>
              <Button onClick={handleConvertToOrder} disabled={loading} className="cursor-pointer flex items-center gap-2">
                <Check className="w-4 h-4" />
                Confirmar y Generar Pedido
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Columna Derecha: Acciones Rápidas */}
      <div className="flex flex-col gap-6 lg:col-span-1">
        <Card className="p-6 border-stone-200 bg-white sticky top-6 shadow-md">
          <h3 className="font-bold text-stone-900 mb-4">Acciones de Gestión</h3>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-md text-sm mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-md text-sm mb-4 flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-center mb-2">
              <span className="text-xs text-stone-500 font-semibold uppercase block">Importe Final</span>
              <span className="text-2xl font-bold text-accent-deep">{formatCurrency(budget.total_amount)}</span>
            </div>

            {budget.status !== "converted" && (
              <>
                <Button 
                  onClick={() => setShowConvertPanel(true)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer bg-green-700 hover:bg-green-600 text-white font-semibold"
                >
                  <ShoppingBag className="w-4.5 h-4.5" />
                  Confirmar Pedido (Facturar)
                </Button>

                {budget.status === "draft" && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleUpdateStatus("sent")}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Marcar como Enviado
                  </Button>
                )}

                {budget.status !== "rejected" && (
                  <Button 
                    variant="ghost" 
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 cursor-pointer hover:bg-red-50 hover:text-red-650"
                  >
                    <X className="w-4.5 h-4.5 text-stone-400 hover:text-red-500" />
                    Marcar como Rechazado
                  </Button>
                )}
              </>
            )}

            {budget.status === "converted" && (
              <div className="flex flex-col gap-2 p-3 bg-green-50/50 border border-green-200 rounded-lg text-xs text-green-800">
                <p className="font-bold flex items-center gap-1.5">
                  <Check className="w-4.5 h-4.5 text-green-650 shrink-0" />
                  Cotización confirmada
                </p>
                <p className="font-medium">Esta cotización ya fue convertida a pedido de fábrica.</p>
                <Button asChild variant="outline" className="mt-2 w-full text-xs font-bold border-green-200 hover:bg-green-50 text-green-800 cursor-pointer">
                  <Link href="/admin-comercial/pedidos">
                    Ir a Pedidos de Fábrica
                  </Link>
                </Button>
              </div>
            )}
            
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 border border-stone-300 hover:bg-stone-50 text-stone-850 px-4 py-2.5 rounded-lg text-xs font-semibold mt-4 transition-colors cursor-pointer w-full"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF Profesional
            </button>
            <div className="border-t border-stone-200 my-4"></div>
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-lg text-xs flex flex-col gap-2.5">
              <span className="font-bold text-stone-600 uppercase tracking-wider block text-[9px]">Seguimiento Online:</span>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Estado de Lectura:</span>
                {budget.view_count && budget.view_count > 0 ? (
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Leído ({budget.view_count} vistas)
                  </span>
                ) : (
                  <span className="bg-stone-200 text-stone-750 font-bold px-2 py-0.5 rounded-full text-[10px]">No leído aún</span>
                )}
              </div>
              {budget.viewed_at && (
                <div className="text-[10px] text-stone-400 mt-0.5">Último ingreso: {new Date(budget.viewed_at).toLocaleString("es-AR")}</div>
              )}
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleCopyLink}
                type="button"
                className="w-full flex items-center justify-center gap-2 border border-stone-300 hover:bg-stone-50 text-stone-855 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4 text-stone-500" />
                {copied ? "¡Enlace Copiado!" : "Copiar Enlace Público"}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center decoration-transparent font-sans"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.993L2 22l5.197-1.355a9.95 9.95 0 004.815 1.23c5.505 0 9.99-4.478 9.99-9.983 0-2.667-1.037-5.176-2.924-7.063C17.192 3.042 14.68 2 12.012 2zm0 1.664c2.22 0 4.31.865 5.88 2.433a8.27 8.27 0 012.43 5.887c0 4.582-3.737 8.316-8.31 8.316-1.464 0-2.906-.388-4.175-1.122l-.3-.178-3.096.808.823-3.007-.196-.312a8.273 8.273 0 01-1.267-4.51c0-4.582 3.738-8.317 8.31-8.317zm-1.854 3.195c-.25 0-.46.098-.636.273-.207.208-.63.619-.63 1.509 0 .89.65 1.752.74 1.872.09.12 1.252 1.91 3.033 2.68.423.183.753.292 1.01.374.425.134.81.115 1.116.07.34-.05.89-.364 1.016-.714.125-.35.125-.65.088-.713-.037-.063-.138-.1-.289-.175s-.89-.438-1.027-.488c-.138-.05-.238-.075-.338.075-.1.15-.389.488-.476.588-.088.1-.176.113-.327.038-.15-.075-.636-.234-1.21-.747-.448-.4-.75-.893-.837-1.043-.088-.15-.01-.231.066-.306.068-.068.15-.175.226-.263.075-.088.1-.15.15-.25.05-.1.025-.187-.013-.262-.037-.075-.338-.813-.463-1.114-.121-.293-.245-.253-.338-.258-.087-.005-.188-.005-.288-.005z"/>
                </svg>
                {cleanPhone ? "Enviar por WhatsApp al Cliente" : "Compartir por WhatsApp"}
              </a>
            </div>
          </div>
        </Card>
      </div>
      <div className="hidden print:block">
        <BudgetPrintPdf ref={printRef} budget={budget} />
      </div>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-100 bg-stone-900 border border-stone-800 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm animate-bounce">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
          <div>
            <span className="font-bold text-accent-deep text-[10px] block uppercase tracking-widest">En Tiempo Real</span>
            <p className="text-xs text-stone-200 leading-relaxed font-semibold mt-0.5">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-stone-500 hover:text-white font-black text-sm ml-2">×</button>
        </div>
      )}
    </div>
  );
}
