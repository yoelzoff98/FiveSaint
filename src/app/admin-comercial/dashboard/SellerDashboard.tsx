"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { 
  Search, AlertCircle, Clock, Phone, Mail, 
  FileText, ArrowRight, UserPlus, CheckCircle2, User, HelpCircle
} from "lucide-react";

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
  clients: { name: string; company_name: string | null } | null;
}

interface SellerDashboardProps {
  clients: Client[];
  budgets: Budget[];
  profileName: string;
}

export function SellerDashboard({ clients, budgets, profileName }: SellerDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // =========================================================================
  // LOGICA DE REGLAS DE NEGOCIO (RECORDATORIOS AUTOMATICOS)
  // =========================================================================

  const now = new Date();
  
  // 1. Leads Nuevos (Prioridad Urgente)
  const newLeads = useMemo(() => {
    return clients.filter(c => c.status === "nuevo");
  }, [clients]);

  // 2. Presupuestos Pendientes de Seguimiento (> 48 horas)
  const budgetsToFollowUp = useMemo(() => {
    return budgets.filter(b => {
      if (b.status !== "sent" && b.status !== "viewed") return false;
      
      const budgetDate = new Date(b.updated_at);
      const diffTime = Math.abs(now.getTime() - budgetDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      return diffDays >= 2; // pasaron 2 dias (48hs) o más
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

  // =========================================================================
  // BUSCADOR UNIVERSAL
  // =========================================================================

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Hola, {profileName} 👋
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Este es tu centro de acción comercial. Aquí tienes las prioridades para hoy.
          </p>
        </div>
        
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Buscar clientes o presupuestos..." 
            className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Resultados de Busqueda Dinamicos */}
      {hasSearch ? (
        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
          <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-stone-500" />
            Resultados de Búsqueda
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-stone-500 mb-3 uppercase tracking-wider">Clientes ({searchResults.clients.length})</h3>
              <div className="flex flex-col gap-3">
                {searchResults.clients.length === 0 ? (
                  <p className="text-sm text-stone-400">No hay clientes que coincidan.</p>
                ) : (
                  searchResults.clients.map(c => (
                    <Link key={c.id} href={`/admin-comercial/clientes/${c.id}`} className="block bg-white border border-stone-200 p-4 rounded-xl hover:border-stone-400 hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-stone-800 group-hover:text-black transition-colors">{c.name}</p>
                          <p className="text-xs text-stone-500 mt-1">{c.phone || "Sin teléfono"}</p>
                        </div>
                        <Badge variant="outline" className="bg-stone-50">{c.status}</Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-stone-500 mb-3 uppercase tracking-wider">Presupuestos ({searchResults.budgets.length})</h3>
              <div className="flex flex-col gap-3">
                {searchResults.budgets.length === 0 ? (
                  <p className="text-sm text-stone-400">No hay presupuestos que coincidan.</p>
                ) : (
                  searchResults.budgets.map(b => (
                    <Link key={b.id} href={`/admin-comercial/presupuestos/${b.id}`} className="block bg-white border border-stone-200 p-4 rounded-xl hover:border-amber-400 hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-amber-900 group-hover:text-amber-700 transition-colors">
                            PRE-{b.budget_number.toString().padStart(4, '0')}
                          </p>
                          <p className="text-xs text-stone-500 mt-1">{b.clients?.name}</p>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">{b.status}</Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Vista Principal de Action Center */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMNA IZQUIERDA: ALTA PRIORIDAD */}
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Alta Prioridad / Para Hoy
            </h2>

            {/* Panel: Nuevos Leads */}
            <Card className="p-0 overflow-hidden border-rose-200 shadow-sm">
              <div className="bg-rose-50 px-5 py-3 border-b border-rose-100 flex justify-between items-center">
                <h3 className="font-semibold text-rose-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-rose-600" />
                  Nuevos Leads ({newLeads.length})
                </h3>
              </div>
              <div className="p-2">
                {newLeads.length === 0 ? (
                  <div className="p-4 text-sm text-stone-500 text-center">
                    No tienes clientes nuevos pendientes. ¡Excelente trabajo! 🎉
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-stone-100">
                    {newLeads.map(lead => (
                      <div key={lead.id} className="p-3 flex items-center justify-between hover:bg-stone-50 transition-colors rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-stone-800 text-sm">{lead.name}</p>
                            <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> 
                              Registrado el {new Date(lead.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800">
                          <Link href={`/admin-comercial/clientes/${lead.id}`}>
                            Contactar
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Panel: Seguimiento de Presupuestos (>48hs) */}
            <Card className="p-0 overflow-hidden border-amber-200 shadow-sm">
              <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex justify-between items-center">
                <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Seguimiento de Presupuestos ({budgetsToFollowUp.length})
                </h3>
              </div>
              <div className="p-2">
                {budgetsToFollowUp.length === 0 ? (
                  <div className="p-4 text-sm text-stone-500 text-center">
                    No hay presupuestos pendientes de hacerles seguimiento.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-stone-100">
                    {budgetsToFollowUp.map(budget => (
                      <div key={budget.id} className="p-3 hover:bg-stone-50 transition-colors rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-600" />
                            <p className="font-bold text-stone-800 text-sm">PRE-{budget.budget_number.toString().padStart(4, '0')}</p>
                          </div>
                          <Badge variant="outline" className="bg-white border-amber-200 text-amber-700 text-[10px]">
                            {budget.status === 'viewed' ? 'Visto' : 'Enviado'}
                          </Badge>
                        </div>
                        <p className="text-xs text-stone-600 mb-3 flex items-center gap-1">
                          <User className="w-3 h-3" /> {budget.clients?.name}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="primary" size="sm" asChild className="w-full text-xs h-8 bg-amber-600 hover:bg-amber-700 cursor-pointer">
                            <Link href={`/admin-comercial/clientes/${budget.client_id}`}>
                              Llamar al cliente
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full text-xs h-8 border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                            <Link href={`/admin-comercial/presupuestos/${budget.id}`}>
                              Ver Presupuesto
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* COLUMNA DERECHA: EN ESPERA / SEGUIMIENTO SUAVE */}
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" />
              Seguimiento Activo e Inactivo
            </h2>

            {/* Panel: En Negociación */}
            <Card className="p-0 overflow-hidden border-indigo-200 shadow-sm">
              <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  En Negociación Activa ({inNegotiation.length})
                </h3>
              </div>
              <div className="p-2">
                {inNegotiation.length === 0 ? (
                  <div className="p-4 text-sm text-stone-500 text-center">
                    No tienes clientes en la etapa de negociación.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-stone-100">
                    {inNegotiation.map(client => (
                      <Link key={client.id} href={`/admin-comercial/clientes/${client.id}`} className="p-3 flex justify-between items-center hover:bg-stone-50 transition-colors rounded-lg group">
                        <div className="flex flex-col">
                          <p className="font-bold text-stone-800 text-sm group-hover:text-indigo-700 transition-colors">{client.name}</p>
                          <p className="text-xs text-stone-500 mt-0.5">Último avance: {new Date(client.updated_at).toLocaleDateString()}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-indigo-500 transition-colors" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Panel: Clientes Fríos */}
            <Card className="p-0 overflow-hidden border-stone-200 shadow-sm">
              <div className="bg-stone-100 px-5 py-3 border-b border-stone-200 flex justify-between items-center">
                <h3 className="font-semibold text-stone-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-500" />
                  Clientes "Fríos" ({coldClients.length})
                </h3>
              </div>
              <div className="p-2">
                {coldClients.length === 0 ? (
                  <div className="p-4 text-sm text-stone-500 text-center">
                    No tienes clientes atascados en la fase de contacto.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-stone-100">
                    {coldClients.map(client => (
                      <Link key={client.id} href={`/admin-comercial/clientes/${client.id}`} className="p-3 flex justify-between items-center hover:bg-stone-50 transition-colors rounded-lg group">
                        <div className="flex flex-col">
                          <p className="font-bold text-stone-800 text-sm group-hover:text-black transition-colors">{client.name}</p>
                          <p className="text-xs text-stone-500 mt-0.5">Sin contacto desde hace &gt; 7 días</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
