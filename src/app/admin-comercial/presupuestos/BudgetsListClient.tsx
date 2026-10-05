"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, Eye, FileText, Calendar, User, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatCurrencyARS } from "@/lib/commercial-calculations";

import { useRouter } from "next/navigation";

interface Budget {
  id: string;
  budget_number: number;
  status: string;
  total_amount: number;
  created_at: string;
  creator_role?: string | null;
  created_by_user_id?: string | null;
  clients: { name: string; company_name: string | null; status?: string } | null;
  sellers: { full_name: string } | null;
}

interface BudgetsListClientProps {
  initialBudgets: Budget[];
  totalCount?: number;
  serverPage?: number;
  serverPageSize?: number;
  serverTotalPages?: number;
  initialSearch?: string;
  initialStatus?: string;
  isAdmin: boolean;
  basePath?: string;
}

const PAGE_SIZE = 20;

export function BudgetsListClient({
  initialBudgets,
  totalCount,
  serverPage = 1,
  serverTotalPages = 1,
  initialSearch = "",
  initialStatus = "all",
  isAdmin,
  basePath = "/admin-comercial/presupuestos"
}: BudgetsListClientProps) {
  const router = useRouter();
  const [budgets] = useState<Budget[]>(initialBudgets);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(serverPage);

  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const term = searchTerm.toLowerCase();
      const clientName = b.clients?.name.toLowerCase() || "";
      const companyName = b.clients?.company_name?.toLowerCase() || "";
      const budgetNum = b.budget_number.toString();

      const matchesSearch = clientName.includes(term) || companyName.includes(term) || budgetNum.includes(term);
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;

      let matchesDate = true;
      if (dateRangeFilter !== "all") {
        const itemDate = new Date(b.created_at);
        const now = new Date();

        if (dateRangeFilter === "current_month") {
          matchesDate = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        } else if (dateRangeFilter === "previous_month") {
          const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          matchesDate = itemDate.getMonth() === prevMonth && itemDate.getFullYear() === prevYear;
        } else if (dateRangeFilter === "last_7") {
          const diffTime = Math.abs(now.getTime() - itemDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          matchesDate = diffDays <= 7;
        } else if (dateRangeFilter === "last_14") {
          const diffTime = Math.abs(now.getTime() - itemDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          matchesDate = diffDays <= 14;
        } else if (dateRangeFilter === "last_30") {
          const diffTime = Math.abs(now.getTime() - itemDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          matchesDate = diffDays <= 30;
        } else if (dateRangeFilter === "custom") {
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;
          if (start) start.setHours(0, 0, 0, 0);
          if (end) end.setHours(23, 59, 59, 999);

          if (start && end) {
            matchesDate = itemDate >= start && itemDate <= end;
          } else if (start) {
            matchesDate = itemDate >= start;
          } else if (end) {
            matchesDate = itemDate <= end;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [budgets, searchTerm, statusFilter, dateRangeFilter, startDate, endDate]);

  // Totales globales basados en el filtro actual
  const totalAmountFiltered = useMemo(() => {
    return filteredBudgets.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  }, [filteredBudgets]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredBudgets.length / PAGE_SIZE));
  const paginatedBudgets = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredBudgets.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredBudgets, currentPage]);

  const getStatusBadge = (b: Budget) => {
    switch (b.status) {
      case "converted":
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs py-0.5 px-2.5">Convertido Total</Badge>;
      case "partially_converted":
        return <Badge className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs py-0.5 px-2.5">Convertido Parcial</Badge>;
      case "distributor_sale":
        return <Badge className="bg-teal-50 text-teal-800 border-teal-300 font-bold text-xs py-0.5 px-2.5">Vendido Distribuidor</Badge>;
      case "sent":
        return <Badge className="bg-blue-50 text-blue-800 border-blue-300 font-bold text-xs py-0.5 px-2.5">Enviado</Badge>;
      case "draft":
        return <Badge className="bg-stone-100 text-stone-700 border-stone-300 font-bold text-xs py-0.5 px-2.5">Borrador</Badge>;
      case "accepted":
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs py-0.5 px-2.5">Aceptado</Badge>;
      case "rejected":
        return <Badge className="bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs py-0.5 px-2.5">Rechazado</Badge>;
      default:
        return <Badge className="bg-stone-100 text-stone-600 border-stone-300 text-xs py-0.5 px-2.5">{b.status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por N° presupuesto, nombre o empresa del cliente..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-accent-deep text-stone-850 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 bg-white"
            >
              <option value="all">Todos los Estados</option>
              <option value="draft">Borrador</option>
              <option value="sent">Enviado</option>
              <option value="accepted">Aceptado</option>
              <option value="partially_converted">Convertido Parcial</option>
              <option value="converted">Convertido Total</option>
              <option value="distributor_sale">Vendido Distribuidor</option>
              <option value="rejected">Rechazado</option>
            </select>

            <select
              value={dateRangeFilter}
              onChange={(e) => {
                setDateRangeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 bg-white"
            >
              <option value="all">Cualquier fecha</option>
              <option value="current_month">Mes actual</option>
              <option value="previous_month">Mes anterior</option>
              <option value="last_7">Últimos 7 días</option>
              <option value="last_14">Últimos 14 días</option>
              <option value="last_30">Últimos 30 días</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>

        {/* Resumen del filtro */}
        <div className="flex justify-between items-center text-xs text-stone-500 border-t border-stone-100 pt-3">
          <span>
            Mostrando <strong>{filteredBudgets.length}</strong> presupuestos encontrados
          </span>
          <span className="font-semibold text-stone-800">
            Subtotal en página actual: <strong>{formatCurrencyARS(totalAmountFiltered)}</strong>
          </span>
        </div>
      </div>

      {/* Tabla de Presupuestos */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        {filteredBudgets.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs italic">
            No se encontraron presupuestos con los criterios seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 font-bold uppercase text-[10px]">
                  <th className="px-4 py-3">Presupuesto</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha Emisión</th>
                  {isAdmin && <th className="px-4 py-3">Asesor</th>}
                  <th className="px-4 py-3 text-right">Importe Neto</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {paginatedBudgets.map((b) => {
                  const date = new Date(b.created_at);
                  return (
                    <tr key={b.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-stone-900">
                        #{b.budget_number}
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
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-[11px] text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full w-max">
                              <User className="w-3 h-3 text-stone-400" />
                              <span>{b.sellers?.full_name || "Sin Asignar"}</span>
                            </div>
                            {b.creator_role && b.creator_role !== "seller" && (
                              <span className="text-[10px] text-accent-deep font-semibold pl-1">
                                {b.creator_role === "admin" ? "Por: Admin Central" : "Por: Administración"}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-bold text-stone-950">
                        {formatCurrencyARS(b.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(b)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="cursor-pointer text-xs py-1 px-2.5"
                        >
                          <Link href={`${basePath}/${b.id}`} className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Ficha</span>
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

        {/* Paginador */}
        {(serverTotalPages > 1 || totalPages > 1) && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 bg-stone-50 text-xs">
            <span className="text-stone-500">
              Página <strong>{currentPage}</strong> de <strong>{Math.max(serverTotalPages, totalPages)}</strong>
              {totalCount !== undefined && <span className="ml-2">({totalCount} presupuestos totales)</span>}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => {
                  const newP = Math.max(1, currentPage - 1);
                  setCurrentPage(newP);
                  const sParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
                  const stParam = statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "";
                  router.push(`/admin-comercial/presupuestos?page=${newP}${sParam}${stParam}`);
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
                  const sParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
                  const stParam = statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "";
                  router.push(`/admin-comercial/presupuestos?page=${newP}${sParam}${stParam}`);
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
    </div>
  );
}
