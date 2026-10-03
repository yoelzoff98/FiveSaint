"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  Search, AlertCircle, Clock, Phone, Mail,
  FileText, ArrowRight, UserPlus, CheckCircle2, User, HelpCircle, Eye
} from "lucide-react";
import { formatCurrencyARS } from "@/lib/commercial-calculations";

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
  budget_number: number;
  status: string;
  client_id: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  sent_at?: string | null;
  view_count?: number | null;
  clients: { name: string; company_name: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  presupuestado: "Presupuestado",
  negociacion: "En negociación",
  ganado: "Vendido",
  vendido: "Vendido",
  perdido: "Perdido",
  inactivo: "Vendido por distribuidor",
  vendido_distribuidor: "Vendido por distribuidor"
};

const STATUS_COLORS: Record<string, string> = {
  nuevo: "bg-blue-50 text-blue-700 border-blue-200",
  contactado: "bg-purple-50 text-purple-700 border-purple-200",
  presupuestado: "bg-amber-50 text-amber-700 border-amber-200",
  negociacion: "bg-orange-50 text-orange-700 border-orange-200",
  ganado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  vendido: "bg-emerald-50 text-emerald-700 border-emerald-200",
  perdido: "bg-rose-50 text-rose-700 border-rose-200",
  inactivo: "bg-teal-50 text-teal-700 border-teal-200",
  vendido_distribuidor: "bg-teal-50 text-teal-700 border-teal-200"
};

interface SellerDashboardProps {
  clients: Client[];
  budgets: Budget[];
  profileName: string;
}

export function SellerDashboard({ clients, budgets, profileName }: SellerDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const now = new Date();

  // 1. Leads Nuevos (Prioridad Urgente)
  const newLeads = useMemo(() => {
    return clients.filter(c => c.status === "nuevo");
  }, [clients]);

  // 2. Presupuestos Pendientes de Seguimiento (> 48 horas)
  // REGLA CRÍTICA: Utilizar sent_at o created_at del presupuesto original.
  // Las visitas del cliente online NO deben postergar el seguimiento comercial.
  const budgetsToFollowUp = useMemo(() => {
    return budgets.filter(b => {
      if (b.status !== "sent") return false;

      const referenceDate = new Date(b.sent_at || b.created_at);
      const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays >= 2; // pasaron 2 días o más desde el envío
    });
  }, [budgets]);

  // 3. Clientes en Negociacion (Calientes)
  const inNegotiation = useMemo(() => {
    return clients.filter(c => c.status === "negociacion");
  }, [clients]);

  // 4. Clientes Fríos (Contactados hace > 7 dias sin avance)
  const coldClients = useMemo(() => {
    return clients.filter(c => {
      if (c.status !== "contactado") return false;

      const updatedDate = new Date(c.updated_at);
      const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays >= 7; // hace mas de una semana que no avanza
    });
  }, [clients]);

  // Buscador Universal
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return { clients: [], budgets: [] };

    const term = searchTerm.toLowerCase();

    const matchedClients = clients.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    );

    const matchedBudgets = budgets.filter(b =>
      b.budget_number.toString().includes(term) ||
      (b.clients?.name && b.clients.name.toLowerCase().includes(term))
    );

    return { clients: matchedClients, budgets: matchedBudgets };
  }, [searchTerm, clients, budgets]);

  const hasSearch = searchTerm.trim().length > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Saludo y Buscador */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Hola, {profileName} 👋
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Centro de seguimiento y prioridades comerciales.
          </p>
        </div>

        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono, mail o # de presupuesto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-accent-deep text-stone-800"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Resultados de Búsqueda si hay término ingresado */}
      {hasSearch && (
        <Card className="p-6 border-stone-200">
          <h2 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-stone-500" />
            Resultados para &quot;{searchTerm}&quot;
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clientes Encontrados */}
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
                Clientes ({searchResults.clients.length})
              </h3>
              {searchResults.clients.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No se encontraron clientes.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {searchResults.clients.map(c => (
                    <Link
                      key={c.id}
                      href={`/admin-comercial/clientes`}
                      className="p-3 bg-stone-50 hover:bg-stone-100 rounded-lg flex items-center justify-between border border-stone-100 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-stone-900">{c.name}</p>
                        <p className="text-[11px] text-stone-500">{c.company_name || c.email || c.phone}</p>
                      </div>
                      <Badge className={`text-[10px] font-semibold ${STATUS_COLORS[c.status] || "bg-stone-100 text-stone-600"}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Presupuestos Encontrados */}
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
                Presupuestos ({searchResults.budgets.length})
              </h3>
              {searchResults.budgets.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No se encontraron presupuestos.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {searchResults.budgets.map(b => (
                    <Link
                      key={b.id}
                      href={`/admin-comercial/presupuestos/${b.id}`}
                      className="p-3 bg-stone-50 hover:bg-stone-100 rounded-lg flex items-center justify-between border border-stone-100 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-stone-900">FS-P-#{b.budget_number}</p>
                        <p className="text-[11px] text-stone-500">{b.clients?.name || "Cliente"}</p>
                      </div>
                      <span className="text-xs font-bold text-stone-900">{formatCurrencyARS(b.total_amount)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 4 Secciones Operativas del CRM */}
      {!hasSearch && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prioridad 1: Nuevos Contactos */}
          <Card className="p-6 border-blue-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  {newLeads.length}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">Nuevos Leads</h2>
                  <p className="text-[11px] text-stone-500">Contactar y calificar</p>
                </div>
              </div>
            </div>

            {newLeads.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 italic">
                No hay contactos nuevos sin contactar.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto">
                {newLeads.map(c => (
                  <div key={c.id} className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-stone-900">{c.name}</p>
                      <p className="text-[11px] text-stone-500">{c.phone || c.email}</p>
                    </div>
                    <Link
                      href={`/admin-comercial/clientes`}
                      className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-200 rounded text-[11px] font-semibold text-stone-700"
                    >
                      Gestionar
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Prioridad 2: Presupuestos Pendientes de Seguimiento (> 48h) */}
          <Card className="p-6 border-amber-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  {budgetsToFollowUp.length}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">Seguimiento de Cotizaciones</h2>
                  <p className="text-[11px] text-stone-500">Enviadas hace más de 48 horas sin respuesta</p>
                </div>
              </div>
            </div>

            {budgetsToFollowUp.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 italic">
                Al día. No hay presupuestos antiguos pendientes de seguimiento.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto">
                {budgetsToFollowUp.map(b => (
                  <div key={b.id} className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-stone-900">
                        Presupuesto #{b.budget_number} - {b.clients?.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                        <span>{formatCurrencyARS(b.total_amount)}</span>
                        {b.view_count && b.view_count > 0 ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Visto {b.view_count} veces
                          </span>
                        ) : (
                          <span className="text-stone-400">Sin abrir</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/admin-comercial/presupuestos/${b.id}`}
                      className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-200 rounded text-[11px] font-semibold text-stone-700"
                    >
                      Ver Ficha
                    </Link>
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

export default SellerDashboard;
