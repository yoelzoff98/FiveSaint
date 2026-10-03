"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  Users, FileText, ShoppingBag, DollarSign, PlusSquare,
  Receipt, Calendar, ArrowRight, Store, Factory
} from "lucide-react";
import { SellerDashboard } from "./SellerDashboard";
import { formatCurrencyARS, getUnlinkedLegacyDistributorBudgets } from "@/lib/commercial-calculations";

interface Client {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  updated_at: string;
  created_at: string;
}

interface Budget {
  sale_channel?: string | null;
  id: string;
  client_id: string;
  budget_number: number;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  sent_at?: string | null;
  clients: { name: string; company_name: string | null } | null;
}

interface Order {
  id: string;
  client_id: string;
  order_number: number;
  status: string;
  total_amount: number;
  sale_channel?: string | null;
  order_type?: string | null;
  budget_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface DashboardClientProps {
  initialClients: Client[];
  initialBudgets: Budget[];
  initialOrders: Order[];
  profileName: string;
  isAdmin: boolean;
  loadError?: string | null;
}

type PeriodType = "this_month" | "7_days" | "14_days" | "custom" | "all";

export function DashboardClient({
  initialClients,
  initialBudgets,
  initialOrders,
  profileName,
  isAdmin,
  loadError,
}: DashboardClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Helper para chequear si una fecha entra en el filtro seleccionado
  const isDateInPeriod = (dateString: string) => {
    if (selectedPeriod === "all") return true;
    if (!dateString) return false;

    const itemDate = new Date(dateString);
    const now = new Date();

    if (selectedPeriod === "this_month") {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }

    if (selectedPeriod === "7_days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return itemDate >= sevenDaysAgo && itemDate <= now;
    }

    if (selectedPeriod === "14_days") {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(now.getDate() - 14);
      fourteenDaysAgo.setHours(0, 0, 0, 0);
      return itemDate >= fourteenDaysAgo && itemDate <= now;
    }

    if (selectedPeriod === "custom") {
      if (!customStartDate && !customEndDate) return true;
      const start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : new Date(0);
      const end = customEndDate ? new Date(`${customEndDate}T23:59:59`) : new Date();
      return itemDate >= start && itemDate <= end;
    }

    return true;
  };

  // Filtrado de colecciones
  const filteredClients = useMemo(() => {
    return initialClients.filter((c) => isDateInPeriod(c.created_at));
  }, [initialClients, selectedPeriod, customStartDate, customEndDate]);

  const filteredBudgets = useMemo(() => {
    return initialBudgets.filter((b) => isDateInPeriod(b.created_at));
  }, [initialBudgets, selectedPeriod, customStartDate, customEndDate]);

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((o) => isDateInPeriod(o.created_at));
  }, [initialOrders, selectedPeriod, customStartDate, customEndDate]);

  // Cálculos de estadísticas según periodo seleccionado
  const totalClients = selectedPeriod === "all" ? initialClients.length : filteredClients.length;

  // Clientes únicos cotizados en el período
  const quotedClientIds = new Set(filteredBudgets.map((b) => b.client_id).filter(Boolean));
  const totalQuotedClients = quotedClientIds.size;

  // Clientes con presupuestos pendientes de cierre en el período
  const pendingQuotedClientIds = new Set(
    filteredBudgets
      .filter((b) => b.status === "draft" || b.status === "sent")
      .map((b) => b.client_id)
      .filter(Boolean)
  );
  const pendingQuotedClients = pendingQuotedClientIds.size;

  const totalBudgetsCount = filteredBudgets.length;
  const totalQuotedAmount = filteredBudgets.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

  // 1. Pedidos activos (excluyendo cancelados)
  const activeOrders = filteredOrders.filter((o) => o.status !== "cancelled");
  const totalOrders = activeOrders.length;
  const pendingOrders = activeOrders.filter(
    (o) => o.status === "pending" || o.status === "processing"
  ).length;

  // 2. Pedidos directos de fábrica (excluye canal distribuidor para evitar doble conteo)
  const factoryOrders = activeOrders.filter(
    (o) => o.sale_channel !== "distributor" && o.order_type !== "distributor_sale"
  );
  const factorySalesTotal = factoryOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  // 3. Ventas por distribuidor:
  // a) Pedidos confirmados asignados a distribuidor
  const distributorOrders = activeOrders.filter(
    (o) => o.sale_channel === "distributor" || o.order_type === "distributor_sale"
  );
  const distributorOrdersTotal = distributorOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  // b) Históricos sin orden asociada que solo tienen presupuesto en distributor_sale
  const historicalDistributorBudgetsWithoutOrder = getUnlinkedLegacyDistributorBudgets(filteredBudgets, initialOrders);
  const historicalDistributorSalesTotal = historicalDistributorBudgetsWithoutOrder.reduce(
    (sum, b) => sum + Number(b.total_amount || 0), 0
  );

  // Total sin doble conteo: cada operación se suma una única vez
  const distributorSalesTotal = distributorOrdersTotal + historicalDistributorSalesTotal;

  // Total global de ventas comerciales confirmadas (fábrica + distribuidores)
  const totalConfirmedSales = factorySalesTotal + distributorSalesTotal;

  return (
    <div className="flex flex-col gap-6">
      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-xs text-rose-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold">Error de conexión:</span>
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Encabezado y Filtro Temporal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">
            ¡Hola, {profileName}!
          </h1>
          <p className="text-stone-500 text-sm">
            {isAdmin
              ? "Tablero de control de ventas, producción y distribuidores."
              : "Tu resumen de cartera de clientes, cotizaciones y pedidos."}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Nota: Importes correspondientes a presupuestos y pedidos comerciales. No constituyen facturación fiscal ni cobranzas.
          </p>
        </div>

        {/* Filtros de Tiempo */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
          <div className="flex items-center gap-1.5 px-2 text-stone-500 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">Período:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPeriod("this_month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedPeriod === "this_month"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            Mes Actual
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("7_days")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedPeriod === "7_days"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            Últimos 7 días
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("14_days")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedPeriod === "14_days"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            Últimos 14 días
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedPeriod === "all"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            Todo
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("custom")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedPeriod === "custom"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            Personalizado
          </button>
        </div>
      </div>

      {/* Selectores de rango para Fecha Personalizada */}
      {selectedPeriod === "custom" && (
        <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex flex-wrap items-center gap-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-stone-600">Desde:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs text-stone-800"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-stone-600">Hasta:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs text-stone-800"
            />
          </div>
        </div>
      )}

      {/* Tarjetas de Estadísticas Comerciales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
          <div>
            <p className="text-sm text-stone-500 font-medium">Clientes en Cartera</p>
            <h3 className="text-3xl font-bold text-stone-950 mt-1">{totalClients}</h3>
            {selectedPeriod !== "all" && (
              <p className="text-[11px] text-stone-400 mt-0.5">
                {initialClients.length} totales registrados
              </p>
            )}
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
          <div>
            <p className="text-sm text-stone-500 font-medium">Total Cotizado</p>
            <h3 className="text-2xl font-bold text-stone-950 mt-1">
              {formatCurrencyARS(totalQuotedAmount)}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {totalBudgetsCount} presupuestos ({totalQuotedClients} clientes)
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
          <div>
            <p className="text-sm text-stone-500 font-medium">Pedidos en Fábrica</p>
            <h3 className="text-3xl font-bold text-stone-950 mt-1">{totalOrders}</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {pendingOrders} en producción activa
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <Factory className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
          <div>
            <p className="text-sm text-stone-500 font-medium">Ventas Confirmadas</p>
            <h3 className="text-xl sm:text-2xl font-bold text-accent-deep mt-1 truncate max-w-[180px]" title={formatCurrencyARS(totalConfirmedSales)}>
              {formatCurrencyARS(totalConfirmedSales)}
            </h3>
            <div className="text-[10px] text-stone-500 mt-1 space-y-0.5">
              <div>Fábrica: {formatCurrencyARS(factorySalesTotal)}</div>
              <div>Distribuidor: {formatCurrencyARS(distributorSalesTotal)}</div>
            </div>
          </div>
          <div className="w-12 h-12 bg-stone-900 text-white rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Contenido Dinámico según Rol */}
      {!isAdmin ? (
        <div className="mt-2">
          <SellerDashboard
            clients={initialClients as any}
            budgets={initialBudgets as any}
            profileName={profileName || "Vendedor"}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accesos Rápidos de Administración */}
          <Card className="p-6 border-stone-200 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 mb-2">Acciones Rápidas</h2>
              <p className="text-xs text-stone-500 mb-4">
                Accesos directos para la emisión de cotizaciones y pedidos.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button asChild className="w-full bg-accent-deep hover:bg-accent-hover text-white text-xs font-bold py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                <Link href="/admin-comercial/presupuestos/nuevo">
                  <PlusSquare className="w-4 h-4" />
                  Emitir Nueva Cotización
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full text-xs font-semibold py-2.5 flex items-center justify-center gap-2 cursor-pointer">
                <Link href="/admin-comercial/pedidos">
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  Ver Pedidos de Fábrica
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full text-xs font-semibold py-2.5 flex items-center justify-center gap-2 cursor-pointer">
                <Link href="/admin-comercial/lista-de-precios">
                  <Receipt className="w-4 h-4 text-stone-600" />
                  Lista de Precios Oficial
                </Link>
              </Button>
            </div>
          </Card>

          {/* Últimos Presupuestos Emitidos */}
          <Card className="p-6 border-stone-200 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-stone-900">Últimos Presupuestos Emitidos</h2>
              <Link href="/admin-comercial/presupuestos" className="text-xs text-accent-deep font-semibold flex items-center gap-1 hover:underline">
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {filteredBudgets.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-6 text-center">
                No hay presupuestos registrados en este período.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {filteredBudgets.slice(0, 5).map(b => (
                  <div key={b.id} className="p-3 bg-stone-50/70 hover:bg-stone-100 rounded-lg flex items-center justify-between border border-stone-100 text-xs">
                    <div>
                      <span className="font-bold text-stone-900 block">#{b.budget_number} - {b.clients?.name}</span>
                      <span className="text-stone-400 text-[11px]">{new Date(b.created_at).toLocaleDateString("es-AR")}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-stone-900 block">{formatCurrencyARS(b.total_amount)}</span>
                      <span className="text-[10px] text-stone-500 capitalize">{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default DashboardClient;
