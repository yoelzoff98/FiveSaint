"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, Eye, Calendar, User, Factory, Store, ChevronLeft, ChevronRight, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatCurrencyARS } from "@/lib/commercial-calculations";
import { cancelOrder } from "@/lib/supabase/comercial";

interface Order {
  id: string;
  order_number: number;
  status: string;
  total_amount: number;
  created_at: string;
  sale_channel?: string | null;
  order_type?: string | null;
  clients: { name: string; company_name: string | null; status?: string } | null;
  sellers: { full_name: string } | null;
}

interface Budget {
  id: string;
  budget_number: number;
  status: string;
  total_amount: number;
  created_at: string;
  sale_channel?: string | null;
  clients: { name: string; company_name: string | null; status?: string } | null;
  sellers: { full_name: string } | null;
}

import { useRouter } from "next/navigation";

interface OrdersListClientProps {
  initialOrders: Order[];
  totalOrdersCount?: number;
  serverPage?: number;
  serverPageSize?: number;
  serverTotalPages?: number;
  initialBudgets: Budget[];
  initialStatus?: string;
  initialSaleChannel?: string;
  isAdmin: boolean;
  ordersBasePath?: string;
  budgetsBasePath?: string;
}

const PAGE_SIZE = 15;

export function OrdersListClient({
  initialOrders,
  totalOrdersCount,
  serverPage = 1,
  serverTotalPages = 1,
  initialBudgets,
  initialStatus = "all",
  initialSaleChannel = "all",
  isAdmin,
  ordersBasePath = "/admin-comercial/pedidos",
  budgetsBasePath = "/admin-comercial/presupuestos"
}: OrdersListClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"factory" | "distributor">("factory");
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [budgets] = useState<Budget[]>(initialBudgets);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(serverPage);

  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filtrar presupuestos/ventas vendidas por distribuidor consultando canal persistido
  const isDistributorSaleBudget = (b: Budget) => {
    return b.sale_channel === "distributor" || b.status === "distributor_sale";
  };

  const distributorBudgetsList = useMemo(() => {
    return budgets.filter((b) => isDistributorSaleBudget(b));
  }, [budgets]);

  // Filtro general por fecha
  const passesDateFilter = (created_at: string) => {
    if (dateRangeFilter === "all") return true;
    const itemDate = new Date(created_at);
    const now = new Date();

    if (dateRangeFilter === "current_month") {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (dateRangeFilter === "previous_month") {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return itemDate.getMonth() === prevMonth && itemDate.getFullYear() === prevYear;
    }
    if (dateRangeFilter === "last_7") {
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
    }
    if (dateRangeFilter === "last_14") {
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 14;
    }
    if (dateRangeFilter === "last_30") {
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 30;
    }
    if (dateRangeFilter === "custom") {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      if (start && end) return itemDate >= start && itemDate <= end;
      if (start) return itemDate >= start;
      if (end) return itemDate <= end;
    }
    return true;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const term = searchTerm.toLowerCase();
      const clientName = o.clients?.name.toLowerCase() || "";
      const companyName = o.clients?.company_name?.toLowerCase() || "";
      const orderNum = o.order_number.toString();

      const matchesSearch = clientName.includes(term) || companyName.includes(term) || orderNum.includes(term);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      const matchesDate = passesDateFilter(o.created_at);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateRangeFilter, startDate, endDate]);

  // Pedidos de fábrica filtrados según el canal persistido
  const filteredFactoryOrders = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.sale_channel !== "distributor" && o.order_type !== "distributor_sale"
    );
  }, [filteredOrders]);

  const filteredDistributorBudgets = useMemo(() => {
    return distributorBudgetsList.filter((b) => {
      const term = searchTerm.toLowerCase();
      const clientName = b.clients?.name.toLowerCase() || "";
      const companyName = b.clients?.company_name?.toLowerCase() || "";
      const budgetNum = b.budget_number.toString();

      const matchesSearch = clientName.includes(term) || companyName.includes(term) || budgetNum.includes(term);
      const matchesDate = passesDateFilter(b.created_at);

      return matchesSearch && matchesDate;
    });
  }, [distributorBudgetsList, searchTerm, dateRangeFilter, startDate, endDate]);

  // Cálculos de métricas separadas consultando el canal persistido
  const factoryTotalSales = useMemo(() => {
    return filteredFactoryOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }, [filteredFactoryOrders]);

  const distributorTotalSales = useMemo(() => {
    const ordersTotal = filteredOrders
      .filter((o) => o.status !== "cancelled" && (o.sale_channel === "distributor" || o.order_type === "distributor_sale"))
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const budgetsTotal = filteredDistributorBudgets.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    return ordersTotal + budgetsTotal;
  }, [filteredOrders, filteredDistributorBudgets]);

  // Paginación
  const currentList = activeTab === "factory" ? filteredFactoryOrders : filteredDistributorBudgets;
  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return currentList.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentList, currentPage]);

  const handleConfirmCancel = async () => {
    if (!cancellingOrderId) return;
    setActionLoading(true);
    setActionError(null);

    try {
      await cancelOrder(cancellingOrderId, cancelReason);
      setOrders(prev => prev.map(o => o.id === cancellingOrderId ? { ...o, status: "cancelled" } : o));
      setCancellingOrderId(null);
      setCancelReason("");
    } catch (err: any) {
      setActionError(err.message || "Error al cancelar pedido");
    } finally {
      setActionLoading(false);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs py-0.5 px-2">Pendiente Fábrica</Badge>;
      case "processing":
        return <Badge className="bg-blue-50 text-blue-800 border-blue-300 font-bold text-xs py-0.5 px-2">En Producción</Badge>;
      case "completed":
        return <Badge className="bg-purple-50 text-purple-800 border-purple-300 font-bold text-xs py-0.5 px-2">Venta confirmada</Badge>;
      case "delivered":
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs py-0.5 px-2">Entregado</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs py-0.5 px-2">Cancelado</Badge>;
      default:
        return <Badge className="bg-stone-100 text-stone-600 border-stone-300 text-xs py-0.5 px-2">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Selector de Canal / Pestañas */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => { setActiveTab("factory"); setCurrentPage(1); }}
          className={`flex items-center gap-2 py-3 px-6 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === "factory"
              ? "border-emerald-600 text-emerald-950 bg-emerald-50/40 rounded-t-lg"
              : "border-transparent text-stone-500 hover:text-stone-850"
          }`}
        >
          <Factory className="w-4 h-4 text-emerald-700" />
          <span>Pedidos a Fábrica ({filteredFactoryOrders.length})</span>
          <span className="ml-2 font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]" title="Subtotal de la vista actual">
            {formatCurrencyARS(factoryTotalSales)} (vista)
          </span>
        </button>

        <button
          onClick={() => { setActiveTab("distributor"); setCurrentPage(1); }}
          className={`flex items-center gap-2 py-3 px-6 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === "distributor"
              ? "border-teal-600 text-teal-950 bg-teal-50/40 rounded-t-lg"
              : "border-transparent text-stone-500 hover:text-stone-850"
          }`}
        >
          <Store className="w-4 h-4 text-teal-700" />
          <span>Vendido por Distribuidor ({filteredDistributorBudgets.length})</span>
          <span className="ml-2 font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-full text-[10px]" title="Subtotal de la vista actual">
            {formatCurrencyARS(distributorTotalSales)} (vista)
          </span>
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por N° pedido, cliente o empresa..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-xs text-stone-850 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "factory" && (
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 bg-white"
              >
                <option value="all">Todos los Estados</option>
                <option value="pending">Pendiente Fábrica</option>
                <option value="processing">En Producción</option>
                <option value="completed">Venta confirmada</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            )}

            <select
              value={dateRangeFilter}
              onChange={(e) => { setDateRangeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 bg-white"
            >
              <option value="all">Cualquier fecha</option>
              <option value="current_month">Mes actual</option>
              <option value="previous_month">Mes anterior</option>
              <option value="last_7">Últimos 7 días</option>
              <option value="last_14">Últimos 14 días</option>
              <option value="last_30">Últimos 30 días</option>
            </select>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabla de Resultados */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {currentList.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs italic">
            No se encontraron registros para la búsqueda seleccionada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 font-bold uppercase text-[10px]">
                  <th className="px-4 py-3">N° Operación</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha</th>
                  {isAdmin && <th className="px-4 py-3">Asesor</th>}
                  <th className="px-4 py-3 text-right">Importe</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {activeTab === "factory" ? (
                  (paginatedList as Order[]).map((o) => {
                    const date = new Date(o.created_at);
                    return (
                      <tr key={o.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="px-4 py-3 font-bold text-stone-900">
                          #{o.order_number}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-stone-900">{o.clients?.name}</div>
                          {o.clients?.company_name && (
                            <div className="text-[11px] text-stone-500">{o.clients.company_name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>{date.toLocaleDateString("es-AR")}</span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-[11px] text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full w-max">
                              <User className="w-3 h-3 text-stone-400" />
                              <span>{o.sellers?.full_name || "Admin"}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-bold text-stone-950">
                          {formatCurrencyARS(o.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getOrderStatusBadge(o.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" asChild className="text-xs py-1 px-2.5">
                              <Link href={`${ordersBasePath}/${o.id}`} className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver</span>
                              </Link>
                            </Button>
                            {o.status !== "cancelled" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCancellingOrderId(o.id)}
                                className="text-xs text-stone-400 hover:text-rose-600 py-1 px-2"
                                title="Cancelar pedido"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  (paginatedList as Budget[]).map((b) => {
                    const date = new Date(b.created_at);
                    return (
                      <tr key={b.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-stone-900">
                          FS-P-{b.budget_number}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-stone-900">{b.clients?.name}</div>
                          {b.clients?.company_name && (
                            <div className="text-[11px] text-stone-500">{b.clients.company_name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>{date.toLocaleDateString("es-AR")}</span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-[11px] text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full w-max">
                              <User className="w-3 h-3 text-stone-400" />
                              <span>{b.sellers?.full_name || "Admin"}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-bold text-teal-800">
                          {formatCurrencyARS(b.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className="bg-teal-50 text-teal-800 border-teal-300 font-bold text-xs py-0.5 px-2">
                            Vendido Distribuidor
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" asChild className="text-xs py-1 px-2.5">
                            <Link href={`${budgetsBasePath}/${b.id}`} className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detalle</span>
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        {(serverTotalPages > 1 || totalPages > 1) && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 bg-stone-50 text-xs">
            <span className="text-stone-500">
              Página <strong>{currentPage}</strong> de <strong>{Math.max(serverTotalPages, totalPages)}</strong>
              {totalOrdersCount !== undefined && <span className="ml-2">({totalOrdersCount} ventas totales)</span>}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => {
                  const newP = Math.max(1, currentPage - 1);
                  setCurrentPage(newP);
                  const stParam = statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "";
                  router.push(`/admin-comercial/pedidos?page=${newP}${stParam}`);
                }}
                className="text-xs px-2.5 py-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= Math.max(serverTotalPages, totalPages)}
                onClick={() => {
                  const newP = Math.min(Math.max(serverTotalPages, totalPages), currentPage + 1);
                  setCurrentPage(newP);
                  const stParam = statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "";
                  router.push(`/admin-comercial/pedidos?page=${newP}${stParam}`);
                }}
                className="text-xs px-2.5 py-1 cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cancelación de Pedido */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-300 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-stone-900 mb-2">Cancelar Pedido</h3>
            <p className="text-xs text-stone-500 mb-4">
              Al cancelar este pedido, se restablecerá automáticamente el saldo de unidades disponibles en el presupuesto de origen.
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo de cancelación (opcional)"
              className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-850 mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancellingOrderId(null)} disabled={actionLoading}>
                Volver
              </Button>
              <Button
                onClick={handleConfirmCancel}
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Confirmar Cancelación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersListClient;
