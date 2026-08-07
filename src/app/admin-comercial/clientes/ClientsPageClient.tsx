"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Plus, Search, Eye, Phone, Mail, Building, MapPin, X, Check } from "lucide-react";
import { createClient, updateClient } from "@/lib/supabase/comercial";

interface Client {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  seller_id: string | null;
  sellers: { full_name: string } | null;
  created_at?: string;
}

interface Seller {
  id: string;
  full_name: string;
}

interface ClientsPageClientProps {
  initialClients: any[];
  sellers: Seller[];
  isAdmin: boolean;
}

export function ClientsPageClient({ initialClients, sellers, isAdmin }: ClientsPageClientProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("active");
  const [sellerId, setSellerId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setCompanyName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNotes("");
    setStatus("active");
    setSellerId("");
    setEditingClient(null);
    setShowForm(false);
    setError(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompanyName(client.company_name || "");
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setAddress(client.address || "");
    setNotes(client.notes || "");
    setStatus(client.status);
    setSellerId(client.seller_id || "");
    setShowForm(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const clientPayload = {
      name,
      company_name: companyName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      notes: notes || undefined,
      status,
      seller_id: isAdmin ? (sellerId || undefined) : undefined
    };

    try {
      if (editingClient) {
        // ACTUALIZAR
        const data = await updateClient(editingClient.id, clientPayload);
        setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...data } : c));
      } else {
        // CREAR
        const data = await createClient(clientPayload);
        setClients(prev => [data, ...prev]);
      }

      resetForm();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error al guardar el cliente.");
    } finally {
      setLoading(false);
    }
  };

  // Filtrado
  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(term) ||
      (c.company_name && c.company_name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term));
      
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    let matchesDate = true;
    if (dateRangeFilter !== "all") {
      const itemDate = new Date(c.created_at || new Date());
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Gestión de Clientes</h1>
          <p className="text-stone-500 text-sm">Administrá tus contactos y controlá sus interacciones.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <Card className="p-6 border-stone-200 shadow-md bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-stone-900">
              {editingClient ? `Editar Cliente: ${editingClient.name}` : "Registrar Nuevo Cliente"}
            </h2>
            <button onClick={resetForm} className="text-stone-400 hover:text-stone-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700">Nombre Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800"
                placeholder="Juan Pérez"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700">Empresa / Razón Social</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800"
                placeholder="Empresa S.A."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800"
                placeholder="juan@empresa.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800"
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700">Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800"
                placeholder="Av. Santa Fe 1234, CABA"
              />
            </div>

            {isAdmin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-stone-700">Vendedor Asignado</label>
                <select
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800 bg-white"
                >
                  <option value="">Sin Vendedor (Asignado al Admin)</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700">Estado del Cliente</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800 bg-white"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-stone-700">Observaciones Generales</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800"
                placeholder="Notas adicionales sobre el cliente..."
              />
            </div>

            <div className="flex justify-end gap-3 md:col-span-2 mt-2">
              <Button type="button" variant="outline" onClick={resetForm} disabled={loading} className="cursor-pointer">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="cursor-pointer">
                {loading ? "Guardando..." : "Guardar Cliente"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Buscador y filtros */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="flex items-center bg-stone-50 border border-stone-300 rounded-lg px-3 py-2">
            <Search className="w-5 h-5 text-stone-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre, empresa o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full focus:outline-none text-stone-800 placeholder-stone-400 bg-transparent text-sm"
            />
          </div>

          {/* Filtro Estado */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-855 text-sm bg-white cursor-pointer w-full"
            >
              <option value="all">Todos los Clientes</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* Filtro Período */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0">Período de Alta:</span>
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
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="text-xs text-red-650 hover:underline font-semibold cursor-pointer"
              >
                Limpiar Fechas
              </button>
            )}
          </div>
        )}
      </div>

      {/* Listado */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">
            No se encontraron clientes registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-600 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Ubicación</th>
                  {isAdmin && <th className="px-6 py-4">Vendedor</th>}
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm text-stone-800">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900">{client.name}</div>
                      {client.company_name && (
                        <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5" />
                          {client.company_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-xs text-stone-600">
                            <Mail className="w-3.5 h-3.5 text-stone-400" />
                            <a href={`mailto:${client.email}`} className="hover:text-accent-deep underline">
                              {client.email}
                            </a>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-stone-600">
                            <Phone className="w-3.5 h-3.5 text-stone-400" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {client.address ? (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[200px]" title={client.address}>
                            {client.address}
                          </span>
                        </div>
                      ) : (
                        <span className="text-stone-400 text-xs italic">No especificada</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        {client.sellers ? (
                          <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-full">
                            {client.sellers.full_name}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400 italic">Administrador</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {client.status === "active" ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200">Activo</Badge>
                      ) : (
                        <Badge className="bg-stone-100 text-stone-600 border-stone-300">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(client)}
                          className="cursor-pointer"
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="cursor-pointer"
                        >
                          <Link href={`/admin-comercial/clientes/${client.id}`} className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            Seguimiento
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
