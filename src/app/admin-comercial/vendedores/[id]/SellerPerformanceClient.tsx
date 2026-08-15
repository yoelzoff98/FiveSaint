"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Briefcase, FileText, CheckCircle, Percent, DollarSign, Calendar } from "lucide-react";

interface ClientRef {
  name: string;
  company_name: string | null;
}

interface Budget {
  id: string;
  budget_number: number;
  total_amount: number;
  status: string;
  created_at: string;
  clients: ClientRef | null;
}

interface Order {
  id: string;
  order_number: number;
  total_amount: number;
  status: string;
  created_at: string;
  clients: ClientRef | null;
}

interface Seller {
  id: string;
  username: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface SellerPerformanceClientProps {
  seller: Seller;
  budgets: Budget[];
  orders: Order[];
}

export function SellerPerformanceClient({ seller, budgets, orders }: SellerPerformanceClientProps) {
  const [commissionRate, setCommissionRate] = useState<number>(5);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("this_month");

  // Filtrar presupuestos según el período seleccionado
  const filteredBudgets = budgets.filter((b) => {
    if (selectedPeriod === "all") return true;
    const date = new Date(b.created_at);
    const now = new Date();

    if (selectedPeriod === "this_month") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (selectedPeriod === "last_month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    }
    if (selectedPeriod === "this_year") {
      return date.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Cálculos de métricas según el período filtrado
  const totalBudgets = filteredBudgets.length;
  const closedBudgets = filteredBudgets.filter(b => b.status === "converted").length;
  const conversionRate = totalBudgets > 0 ? (closedBudgets / totalBudgets) * 100 : 0;
  
  const totalRevenue = filteredBudgets
    .filter(b => b.status === "converted")
    .reduce((acc, curr) => acc + curr.total_amount, 0);

  const calculatedCommission = totalRevenue * (commissionRate / 100);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Selector de Período / Filtro Temporal */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-stone-800">
          <Calendar className="w-4 h-4 text-accent-deep" />
          <span>Filtrar Desempeño por Período:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "this_month", label: "Mes Actual" },
            { id: "last_month", label: "Mes Anterior" },
            { id: "this_year", label: "Año Actual" },
            { id: "all", label: "Histórico Completo" },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedPeriod === period.id
                  ? "bg-accent-deep text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda: Métricas Globales */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-stone-200 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-stone-700">Cotizaciones Enviadas</h3>
              </div>
              <div className="text-3xl font-black text-stone-900 mt-2">{totalBudgets}</div>
            </Card>

            <Card className="p-5 border-stone-200 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-stone-700">Cotizaciones Cerradas</h3>
              </div>
              <div className="text-3xl font-black text-stone-900 mt-2">{closedBudgets}</div>
              <p className="text-xs text-stone-500 font-medium mt-1">
                Tasa de conversión: {conversionRate.toFixed(1)}%
              </p>
            </Card>

            <Card className="p-5 border-stone-200 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-accent-deep/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent-deep" />
                </div>
                <h3 className="font-bold text-stone-700">Total Ingresos</h3>
              </div>
              <div className="text-2xl font-black text-accent-deep mt-2">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-stone-500 font-medium mt-1">Solo cotizaciones convertidas</p>
            </Card>
          </div>

          {/* Historial Reciente de Cotizaciones (Cerradas) */}
          <Card className="p-6 border-stone-200 bg-white">
            <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-stone-500" />
              Cotizaciones Convertidas a Pedido (Filtradas)
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">N° Presupuesto</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  {filteredBudgets.filter(b => b.status === "converted").slice(0, 10).map(b => (
                    <tr key={b.id} className="hover:bg-stone-50/50">
                      <td className="px-4 py-3 font-mono text-stone-900 font-bold">FS-P-{b.budget_number}</td>
                      <td className="px-4 py-3 text-stone-500">{new Date(b.created_at).toLocaleDateString("es-AR")}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-stone-850">{b.clients?.name}</div>
                        {b.clients?.company_name && <div className="text-xs text-stone-500">{b.clients.company_name}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(b.total_amount)}</td>
                    </tr>
                  ))}
                  {closedBudgets === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-stone-500 italic">No hay cotizaciones cerradas en este período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      {/* Columna Derecha: Liquidador de Comisiones */}
      <div className="flex flex-col gap-6 lg:col-span-1">
        <Card className="p-6 border-stone-200 bg-stone-50 shadow-md sticky top-6">
          <div className="flex items-center gap-2 mb-4 text-stone-900">
            <Percent className="w-5 h-5" />
            <h2 className="text-lg font-bold">Liquidador de Comisiones</h2>
          </div>
          <p className="text-xs text-stone-600 mb-6 leading-relaxed">
            Calculá rápidamente cuánto debe percibir el vendedor en función del volumen total de ventas cerradas.
          </p>

          <div className="flex flex-col gap-2 mb-6">
            <label className="text-sm font-semibold text-stone-750">Porcentaje de Comisión (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-900 font-bold"
              />
              <span className="text-stone-500 font-bold">%</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-4 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm border-b border-stone-100 pb-2">
              <span className="text-stone-500 font-medium">Base Imponible (Ventas cerradas):</span>
              <span className="text-stone-900 font-bold">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-900 font-bold">Total a Liquidar:</span>
              <span className="text-2xl font-black text-green-700">{formatCurrency(calculatedCommission)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
  );
}
