"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { 
  Users, FileText, ShoppingBag, DollarSign, PlusSquare, 
  Receipt, Calendar, ArrowRight 
} from "lucide-react";
import { SellerDashboard } from "./SellerDashboard";

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
  id: string;
  client_id: string;
  budget_number: number;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  clients: { name: string; company_name: string | null } | null;
}

interface Order {
  id: string;
  client_id: string;
  order_number: number;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface DashboardClientProps {
  initialClients: Client[];
  initialBudgets: Budget[];
  initialOrders: Order[];
  profileName: string;
  isAdmin: boolean;
}

type PeriodType = "this_month" | "7_days" | "14_days" | "custom" | "all";

export function DashboardClient({
  initialClients,
  initialBudgets,
  initialOrders,
  profileName,
  isAdmin,
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

  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(
    (o) => o.status === "pending" || o.status === "processing"
  ).length;

  const salesTotal = filteredOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const formattedSalesTotal = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(salesTotal);

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado y Filtro Temporal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">
            ¡Hola, {profileName}!
          </h1>
          <p className="text-stone-500 text-sm">
            {isAdmin 
              ? "Resumen de ventas y seguimiento de toda la empresa." 
              : "Tu resumen de cartera de clientes, cotizaciones y pedidos."}
          </p>
        </div>

        {/* Filtros de Tiempo Elegantes */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-xl border border-stone-200">
          <div className="flex items-center gap-1.5 px-2 text-stone-500 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">Período:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPeriod("this_month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedPeriod === "this_month"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200/80 font-bold"
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
                ? "bg-white text-stone-900 shadow-xs border border-stone-200/80 font-bold"
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
                ? "bg-white text-stone-900 shadow-xs border border-stone-200/80 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            Últimos 14 días
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("custom")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedPeriod === "custom"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200/80 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            Personalizada
          </button>

          <button
            type="button"
            onClick={() => setSelectedPeriod("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedPeriod === "all"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200/80 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
            }`}
          >
            Histórico
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
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-accent-deep"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-stone-600">Hasta:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-accent-deep"
            />
          </div>
          {(customStartDate || customEndDate) && (
            <button
              onClick={() => {
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="text-xs text-stone-500 hover:text-stone-800 underline ml-auto"
            >
              Limpiar rango
            </button>
          )}
        </div>
      )}

      {/* Tarjetas de estadísticas reactivas al período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
          <div>
            <p className="text-sm text-stone-500 font-medium">
              {selectedPeriod === "all" ? "Clientes en Cartera" : "Nuevos Clientes"}
            </p>
            <h3 className="text-3xl font-bold text-stone-950 mt-1">{totalClients}</h3>
            {selectedPeriod !== "all" && (
              <p className="text-[11px] text-stone-400 mt-0.5">
                {initialClients.length} totales en cartera
              </p>
            )}
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
          <div>
            <p className="text-sm text-stone-500 font-medium">Clientes Cotizados</p>
            <h3 className="text-3xl font-bold text-stone-950 mt-1">{totalQuotedClients}</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {totalBudgetsCount} presupuestos ({pendingQuotedClients} cl. pendientes)
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
          <div>
            <p className="text-sm text-stone-500 font-medium">Pedidos Confirmados</p>
            <h3 className="text-3xl font-bold text-stone-950 mt-1">{totalOrders}</h3>
            <p className="text-xs text-stone-400 mt-0.5">{pendingOrders} en producción/proceso</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between border-stone-200 shadow-xs">
          <div>
            <p className="text-sm text-stone-500 font-medium">Volumen Facturado</p>
            <h3 className="text-xl sm:text-2xl font-bold text-stone-950 mt-1 truncate max-w-[170px]" title={formattedSalesTotal}>
              {formattedSalesTotal}
            </h3>
            <p className="text-xs text-stone-400 mt-1">Excluye pedidos cancelados</p>
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
        <>
          {/* Accesos rápidos (Solo Admin) */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-800 mb-4">Acciones Comerciales Rápidas</h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" asChild className="cursor-pointer">
                <Link href="/admin-comercial/presupuestos/nuevo" className="flex items-center gap-2">
                  <PlusSquare className="w-4 h-4" />
                  Crear Nuevo Presupuesto
                </Link>
              </Button>
              <Button variant="outline" asChild className="cursor-pointer">
                <Link href="/admin-comercial/clientes" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Registrar / Gestionar Clientes
                </Link>
              </Button>
              <Button variant="outline" asChild className="cursor-pointer">
                <Link href="/admin-comercial/lista-de-precios" className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Consultar Lista de Precios
                </Link>
              </Button>
            </div>
          </div>

          {/* Breve guía de flujo (Solo Admin) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-stone-200 rounded-xl p-6 bg-white shadow-xs">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center font-bold text-stone-800 mb-4">1</div>
              <h3 className="font-bold text-stone-900">Registrar Cliente</h3>
              <p className="text-sm text-stone-500 mt-2">
                Ingresá al cliente en tu cartera comercial para llevar el registro de sus contactos, consultas y anotaciones.
              </p>
            </div>
            <div className="border border-stone-200 rounded-xl p-6 bg-white shadow-xs">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center font-bold text-stone-800 mb-4">2</div>
              <h3 className="font-bold text-stone-900">Armar Presupuesto</h3>
              <p className="text-sm text-stone-500 mt-2">
                Cotizá bañeras, equipamiento opcional y spas. Podés exportar el presupuesto en PDF para enviárselo directamente al cliente.
              </p>
            </div>
            <div className="border border-stone-200 rounded-xl p-6 bg-white shadow-xs">
              <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center font-bold text-stone-800 mb-4">3</div>
              <h3 className="font-bold text-stone-900">Confirmar Pedido</h3>
              <p className="text-sm text-stone-500 mt-2">
                Cuando el cliente confirme el presupuesto, convertilo en Pedido. Podés realizar conversiones parciales si decide fabricar solo algunos productos.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
