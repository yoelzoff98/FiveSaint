"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  ShoppingBag, User, Calendar, DollarSign, Building, Mail, 
  Phone, MapPin, RefreshCw, AlertCircle, Check, X, Printer, Hammer, Truck
} from "lucide-react";
import { updateOrderStatus } from "@/lib/supabase/comercial";
import { useReactToPrint } from "react-to-print";
import { OrderPrintPdf } from "@/components/pdf/OrderPrintPdf";

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  factory_notes: string | null;
}

interface Order {
  id: string;
  order_number: number;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  budget_id: string | null;
  clients: {
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  sellers: {
    full_name: string;
  } | null;
  items: OrderItem[];
}

interface OrderDetailClientProps {
  initialOrder: Order;
}

export function OrderDetailClient({ initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Pedido-FS-O-${order.order_number}`,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateOrderStatus(order.id, newStatus);
      
      setOrder(prev => ({ ...prev, status: newStatus }));
      setSuccess(`Estado del pedido actualizado a: ${newStatus}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al actualizar estado del pedido.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-sm py-1 px-3">Pendiente de Aprobación</Badge>;
      case "processing":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-sm py-1 px-3">En Fabricación / Proceso</Badge>;
      case "delivered":
        return <Badge className="bg-green-50 text-green-700 border-green-200 text-sm py-1 px-3">Entregado</Badge>;
      case "cancelled":
        return <Badge className="bg-red-50 text-red-700 border-red-200 text-sm py-1 px-3">Cancelado</Badge>;
      default:
        return <Badge className="bg-stone-100 text-stone-600 border-stone-300 text-sm py-1 px-3">{status}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Columna Izquierda: Datos del pedido y lista de productos */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Cabecera / Ficha de Pedido */}
        <Card className="p-6 border-stone-200 bg-white">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-stone-650" />
              <div>
                <h2 className="text-xl font-bold text-stone-900">Pedido #{order.order_number}</h2>
                <span className="text-stone-500 text-xs font-semibold">
                  Confirmado: {new Date(order.created_at).toLocaleDateString("es-AR")}
                </span>
              </div>
            </div>
            <div>
              {getStatusBadge(order.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-stone-700 border-t border-stone-100 pt-6">
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Cliente Destinatario</h3>
              <p className="font-bold text-stone-900 mb-1">{order.clients?.name}</p>
              {order.clients?.company_name && (
                <p className="flex items-center gap-1.5 text-stone-600 mb-1">
                  <Building className="w-3.5 h-3.5 text-stone-400" />
                  {order.clients.company_name}
                </p>
              )}
              {order.clients?.email && (
                <p className="flex items-center gap-1.5 text-stone-600 mb-1">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  {order.clients.email}
                </p>
              )}
              {order.clients?.phone && (
                <p className="flex items-center gap-1.5 text-stone-600">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  {order.clients.phone}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Vendedor Registrante</h3>
              <div className="flex items-center gap-2 text-stone-800">
                <User className="w-4 h-4 text-stone-400" />
                <span>{order.sellers?.full_name || "Admin / Venta Directa"}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="mt-6 p-4 bg-stone-50 border border-stone-150 rounded-lg">
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Notas de Fabricación / Logística</h4>
              <p className="text-sm text-stone-700 font-normal whitespace-pre-line leading-relaxed">
                {order.notes}
              </p>
            </div>
          )}
        </Card>

        {/* Tabla de Productos del Pedido */}
        <Card className="p-6 border-stone-200 bg-white">
          <h3 className="font-bold text-stone-900 mb-4">Productos Solicitados</h3>

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
              <tbody className="divide-y divide-stone-100 text-stone-850">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-stone-900">{item.product_name}</div>
                      {item.variant_name && (
                        <div className="text-xs text-stone-500 font-medium mt-0.5">{item.variant_name}</div>
                      )}
                      {item.factory_notes && (
                        <div className="mt-1.5 p-2 bg-amber-50/60 border border-amber-100 rounded text-xs text-amber-900 font-medium max-w-lg">
                          <span className="font-bold block text-[10px] text-amber-700 uppercase tracking-wide">Aclaración Fábrica:</span>
                          {item.factory_notes}
                        </div>
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
      </div>

      {/* Columna Derecha: Estado de la Orden */}
      <div className="flex flex-col gap-6 lg:col-span-1">
        <Card className="p-6 border-stone-200 bg-white sticky top-6 shadow-md">
          <h3 className="font-bold text-stone-900 mb-4">Control de Producción</h3>

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
              <span className="text-xs text-stone-500 font-semibold uppercase block">Monto a Cobrar</span>
              <span className="text-2xl font-bold text-accent-deep">{formatCurrency(order.total_amount)}</span>
            </div>

            {order.status === "pending" && (
              <Button 
                onClick={() => handleUpdateStatus("processing")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 cursor-pointer bg-blue-700 hover:bg-blue-600 text-white font-semibold"
              >
                <Hammer className="w-4.5 h-4.5" />
                Iniciar Fabricación
              </Button>
            )}

            {order.status === "processing" && (
              <Button 
                onClick={() => handleUpdateStatus("delivered")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 cursor-pointer bg-green-700 hover:bg-green-600 text-white font-semibold"
              >
                <Truck className="w-4.5 h-4.5" />
                Marcar como Entregado
              </Button>
            )}

            {order.status !== "delivered" && order.status !== "cancelled" && (
              <Button 
                variant="ghost"
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 cursor-pointer text-stone-500 hover:bg-red-50 hover:text-red-650"
              >
                <X className="w-4 h-4" />
                Cancelar Pedido
              </Button>
            )}

            {order.status === "delivered" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 text-center font-bold">
                ✓ Este pedido ya fue entregado al cliente.
              </div>
            )}

            {order.status === "cancelled" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 text-center font-bold">
                ✕ Este pedido fue cancelado.
              </div>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 border border-stone-300 hover:bg-stone-50 text-stone-850 px-4 py-2.5 rounded-lg text-xs font-semibold mt-4 transition-colors cursor-pointer w-full"
            >
              <Printer className="w-4 h-4" />
              Imprimir Ficha de Pedido
            </button>
          </div>
        </Card>
      </div>

      <div className="hidden print:block">
        <OrderPrintPdf ref={printRef} order={order} />
      </div>
    </div>
  );
}
