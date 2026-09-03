"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Briefcase, FileText, CheckCircle, Percent, DollarSign, Calendar, Store, Building2 } from "lucide-react";

interface ClientRef {
  name: string;
  company_name: string | null;
  status?: string;
}

interface Budget {
  id: string;
  client_id?: string;
  budget_number: number;
  total_amount: number;
  status: string;
  created_at: string;
  clients: ClientRef | null;
}

interface Order {
  id: string;
  client_id?: string;
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

  // Helper para identificar venta por distribuidor
  const isDistributorSale = (item: Budget | Order) => {
    const status = item.clients?.status?.toLowerCase();
    return status === "inactivo" || status === "vendido_distribuidor" || item.status === "distributor_sale";
  };

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

  // Métricas de presupuestos y clientes cotizados
  const totalBudgets = filteredBudgets.length;
  
  // Clientes únicos presupuestados en este período
  const quotedClientsSet = new Set(
    filteredBudgets.map((b) => b.client_id || b.clients?.name).filter(Boolean)
  );
  const totalQuotedClients = quotedClientsSet.size;

  const convertedBudgets = filteredBudgets.filter((b) => b.status === "converted" || b.status === "distributor_sale");
  const totalClosedCount = convertedBudgets.length;

  // Clientes únicos que concretaron compra (conversión real por cliente)
  const convertedClientsSet = new Set(
    convertedBudgets.map((b) => b.client_id || b.clients?.name).filter(Boolean)
  );
  const totalConvertedClients = convertedClientsSet.size;

  const directSalesBudgets = convertedBudgets.filter((b) => !isDistributorSale(b));
  const distributorSalesBudgets = convertedBudgets.filter((b) => isDistributorSale(b));

  const directRevenue = directSalesBudgets.reduce((acc, curr) => acc + curr.total_amount, 0);
  const distributorRevenue = distributorSalesBudgets.reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalRevenue = directRevenue + distributorRevenue;

  // Conversión basada en clientes (clientes ganados / clientes cotizados)
  const conversionRate = totalQuotedClients > 0 
    ? (totalConvertedClients / totalQuotedClients) * 100 
    : (totalBudgets > 0 ? (totalClosedCount / totalBudgets) * 100 : 0);

  // La comisión SE CALCULA ÚNICAMENTE sobre las Ventas Directas de Fábrica
  const calculatedCommission = directRevenue * (commissionRate / 100);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            {/* Clientes Cotizados */}
            <Card className="p-5 border-stone-200 bg-white flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <h3 className="font-bold text-xs text-stone-600 uppercase tracking-wider">Clientes Cotizados</h3>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight">{totalQuotedClients}</div>
                <p className="text-xs text-stone-500 mt-1">{totalBudgets} presupuestos en el período</p>
              </div>
            </Card>

            {/* Ventas Directas Fábrica */}
            <Card className="p-5 border-emerald-200 bg-emerald-50/30 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-4.5 h-4.5 text-emerald-700" />
                </div>
                <h3 className="font-bold text-xs text-emerald-850 uppercase tracking-wider">Ventas Directas Fábrica</h3>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-black text-emerald-800 tracking-tight">{formatCurrency(directRevenue)}</div>
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  {directSalesBudgets.length} pedido(s) confirmado(s)
                </p>
              </div>
            </Card>

            {/* Ventas por Distribuidor */}
            <Card className="p-5 border-teal-200 bg-teal-50/40 flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <Store className="w-4.5 h-4.5 text-teal-700" />
                </div>
                <h3 className="font-bold text-xs text-teal-850 uppercase tracking-wider">Vendido por Distribuidor</h3>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-black text-teal-800 tracking-tight">{formatCurrency(distributorRevenue)}</div>
                <p className="text-xs text-teal-700 font-medium mt-1">
                  {distributorSalesBudgets.length} venta(s) concretada(s)
                </p>
              </div>
            </Card>

            {/* Total Ingresos Combinado */}
            <Card className="p-5 border-stone-200 bg-white flex flex-col justify-between shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-accent-deep/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4.5 h-4.5 text-accent-deep" />
                </div>
                <h3 className="font-bold text-xs text-stone-600 uppercase tracking-wider">Total Ventas Globales</h3>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-black text-stone-900 tracking-tight">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-stone-500 font-medium mt-1">
                  Tasa de conversión: <span className="font-bold text-stone-800">{conversionRate.toFixed(1)}%</span>
                </p>
              </div>
            </Card>
          </div>

          {/* Historial Reciente de Cotizaciones (Cerradas) */}
          <Card className="p-6 border-stone-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-stone-500" />
                Ventas Cerradas en el Período
              </h2>
              <Badge variant="outline" className="text-xs">
                {totalClosedCount} cerradas
              </Badge>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Presupuesto</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Canal de Venta</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  {convertedBudgets.slice(0, 15).map((b) => {
                    const isDist = isDistributorSale(b);
                    return (
                      <tr key={b.id} className="hover:bg-stone-50/50">
                        <td className="px-4 py-3 font-mono text-stone-900 font-bold">
                          FS-P-{b.budget_number}
                        </td>
                        <td className="px-4 py-3 text-stone-500 text-xs">
                          {new Date(b.created_at).toLocaleDateString("es-AR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-stone-850">{b.clients?.name}</div>
                          {b.clients?.company_name && (
                            <div className="text-xs text-stone-500">{b.clients.company_name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isDist ? (
                            <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[10px]">
                              Vendido por distribuidor
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                              Directa Fábrica
                            </Badge>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${isDist ? "text-teal-700" : "text-emerald-700"}`}>
                          {formatCurrency(b.total_amount)}
                        </td>
                      </tr>
                    );
                  })}
                  {totalClosedCount === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-stone-500 italic">
                        No hay cotizaciones cerradas en este período.
                      </td>
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
              <Percent className="w-5 h-5 text-accent-deep" />
              <h2 className="text-lg font-bold">Liquidador de Comisiones</h2>
            </div>
            <p className="text-xs text-stone-600 mb-6 leading-relaxed">
              Las comisiones se liquidan exclusivamente sobre las **Ventas Directas a Fábrica**. Las ventas por distribuidor quedan desglosadas al 0%.
            </p>

            <div className="flex flex-col gap-2 mb-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">Porcentaje de Comisión (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-900 font-bold bg-white"
                />
                <span className="text-stone-500 font-bold">%</span>
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-stone-100">
                <span className="text-stone-600 font-semibold">Ventas Directas (Comisionable):</span>
                <span className="text-emerald-700 font-bold">{formatCurrency(directRevenue)}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Ventas por Distribuidor:</span>
                <span className="text-teal-700 font-bold">{formatCurrency(distributorRevenue)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-stone-900 font-bold text-sm">Total Comisión Vendedor:</span>
                <span className="text-2xl font-black text-emerald-700">{formatCurrency(calculatedCommission)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SellerPerformanceClient;
