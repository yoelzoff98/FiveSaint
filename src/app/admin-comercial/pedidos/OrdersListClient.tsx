"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, Eye, Calendar, User, Factory, Store } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  order_number: number;
  status: string;
  total_amount: number;
  created_at: string;
  clients: { name: string; company_name: string | null; status?: string } | null;
  sellers: { full_name: string } | null;
}

interface Budget {
  id: string;
  budget_number: number;
  status: string;
  total_amount: number;
  created_at: string;
  clients: { name: string; company_name: string | null; status?: string } | null;
  sellers: { full_name: string } | null;
}

interface OrdersListClientProps {
  initialOrders: Order[];
  initialBudgets: Budget[];
  isAdmin: boolean;
}

export function OrdersListClient({ initialOrders, initialBudgets, isAdmin }: OrdersListClientProps) {
  const [activeTab, setActiveTab] = useState<"factory" | "distributor">("factory");
  const [orders] = useState<Order[]>(initialOrders);
  const [budgets] = useState<Budget[]>(initialBudgets);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  // 1. Filtrar presupuestos/ventas vendidas por distribuidor
  const isDistributorSaleBudget = (b: Budget) => {
    const s = b.clients?.status?.toLowerCase();
    return b.status === "distributor_sale" || s === "inactivo" || s === "vendido_distribuidor";
  };

  const distributorBudgetsList = budgets.filter((b) => isDistributorSaleBudget(b));

  // 2. Filtro general por fecha
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

  // 3. Filtrar pedidos de fábrica
  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    const clientName = o.clients?.name.toLowerCase() || "";
    const companyName = o.clients?.company_name?.toLowerCase() || "";
    const orderNum = o.order_number.toString();

    const matchesSearch = clientName.includes(term) || companyName.includes(term) || orderNum.includes(term);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesDate = passesDateFilter(o.created_at);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // 4. Filtrar ventas por distribuidor
  const filteredDistributorBudgets = distributorBudgetsList.filter((b) => {
    const term = searchTerm.toLowerCase();
    const clientName = b.clients?.name.toLowerCase() || "";
    const companyName = b.clients?.company_name?.toLowerCase() || "";
    const budgetNum = b.budget_number.toString();

    const matchesSearch = clientName.includes(term) || companyName.includes(term) || budgetNum.includes(term);
    const matchesDate = passesDateFilter(b.created_at);

    return matchesSearch && matchesDate;
  });

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pendiente de Aprobación</Badge>;
      case "processing":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">En Fabricación / Proceso</Badge>;
      case "delivered":
        return <Badge className="bg-green-50 text-green-700 border-green-200">Entregado</Badge>;
      case "cancelled":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
      default:
        return <Badge className="bg-stone-100 text-stone-600 border-stone-300">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Botones de Navegación por Pestañas principales */}
      <div className="flex flex-wrap items-center gap-3 border-b border-stone-200 pb-3">
        <button
          onClick={() => setActiveTab("factory")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === "factory"
              ? "bg-stone-900 text-white shadow-md"
              : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Pedidos de Fábrica</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === "factory" ? "bg-stone-800 text-stone-200" : "bg-stone-100 text-stone-700"
            }`}
          >
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("distributor")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === "distributor"
              ? "bg-teal-700 text-white shadow-md"
              : "bg-white text-stone-600 border border-stone-200 hover:bg-teal-50/50 hover:text-teal-800"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Vendidos por Distribuidor</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === "distributor" ? "bg-teal-800 text-teal-100" : "bg-teal-50 text-teal-800 border border-teal-200"
            }`}
          >
            {distributorBudgetsList.length}
          </span>
        </button>
      </div>

      {/* Controles de Filtros */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="flex items-center bg-stone-50 border border-stone-300 rounded-lg px-3 py-2">
            <Search className="w-5 h-5 text-stone-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por cliente, empresa o nro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full focus:outline-none text-stone-800 placeholder-stone-400 bg-transparent text-sm"
            />
          </div>

          {/* Filtro Estado (Solo visible para Pedidos de Fábrica) */}
          {activeTab === "factory" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0">Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-855 text-sm bg-white cursor-pointer w-full"
              >
                <option value="all">Todos los Pedidos</option>
                <option value="pending">Pendientes de Aprobación</option>
                <option value="processing">En Fabricación / Proceso</option>
                <option value="delivered">Entregados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0">Origen:</span>
              <div className="px-3 py-2 border border-stone-200 rounded-md bg-stone-50 text-stone-700 text-sm font-semibold w-full">
                Ventas concretadas vía Distribuidor
              </div>
            </div>
          )}

          {/* Filtro Período */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0">Período:</span>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-855 text-sm bg-white cursor-pointer w-full"
            >
              <option value="all">Cualquier fecha</option>
              <option value="current_month">Mes actual</option>
              <option value="previous_month">Mes anterior</option>
              <option value="last_7">Últimos 7 días</option>
              <option value="last_14">Últimos 14 días</option>
              <option value="last_30">Últimos 30 días</option>
              <option value="custom">Fecha personalizada...</option>
            </select>
          </div>
        </div>

        {/* Controles de Fecha Personalizada */}
        {dateRangeFilter === "custom" && (
          <div className="flex flex-wrap items-center gap-4 bg-stone-50 p-4 border border-stone-200 rounded-lg text-sm transition-all duration-300">
            <div className="flex items-center gap-2">
              <span className="text-stone-600 font-semibold">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-stone-300 rounded text-stone-850 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-600 font-semibold">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-stone-300 rounded text-stone-850 bg-white"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
              >
                Limpiar Fechas
              </button>
            )}
          </div>
        )}
      </div>

      {/* VISTA 1: Pedidos de Fábrica */}
      {activeTab === "factory" && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-sm italic">
              No se encontraron pedidos de fábrica registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Pedido</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Fecha Confirmado</th>
                    {isAdmin && <th className="px-6 py-4">Vendedor</th>}
                    <th className="px-6 py-4">Monto Pedido</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm text-stone-800">
                  {filteredOrders.map((o) => {
                    const date = new Date(o.created_at);
                    return (
                      <tr key={o.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-stone-900">
                          #{o.order_number}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-stone-900">{o.clients?.name}</div>
                          {o.clients?.company_name && (
                            <div className="text-xs text-stone-500 font-normal">{o.clients.company_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-stone-600 font-medium">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>{date.toLocaleDateString("es-AR")}</span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-xs text-stone-700 bg-stone-100 px-2.5 py-1 rounded-full w-max">
                              <User className="w-3.5 h-3.5 text-stone-400" />
                              <span>{o.sellers?.full_name || "Admin"}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 font-bold text-stone-950">
                          {formatCurrency(o.total_amount)}
                        </td>
                        <td className="px-6 py-4">
                          {getOrderStatusBadge(o.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            className="cursor-pointer"
                          >
                            <Link href={`/admin-comercial/pedidos/${o.id}`} className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              Seguimiento
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: Vendidos por Distribuidor */}
      {activeTab === "distributor" && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          {filteredDistributorBudgets.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-sm italic">
              No hay ventas por distribuidor registradas en este período.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Presupuesto Originario</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Fecha Venta</th>
                    {isAdmin && <th className="px-6 py-4">Vendedor Asignado</th>}
                    <th className="px-6 py-4">Monto Venta</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm text-stone-800">
                  {filteredDistributorBudgets.map((b) => {
                    const date = new Date(b.created_at);
                    return (
                      <tr key={b.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-stone-900">
                          FS-P-{b.budget_number}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-stone-900">{b.clients?.name}</div>
                          {b.clients?.company_name && (
                            <div className="text-xs text-stone-500 font-normal">{b.clients.company_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-stone-600 font-medium">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>{date.toLocaleDateString("es-AR")}</span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-xs text-stone-700 bg-stone-100 px-2.5 py-1 rounded-full w-max">
                              <User className="w-3.5 h-3.5 text-stone-400" />
                              <span>{b.sellers?.full_name || "Admin"}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 font-bold text-teal-800">
                          {formatCurrency(b.total_amount)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-teal-50 text-teal-700 border-teal-200 font-semibold">
                            Vendido por distribuidor
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            className="cursor-pointer"
                          >
                            <Link href={`/admin-comercial/presupuestos/${b.id}`} className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              Ver Detalle
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrdersListClient;
