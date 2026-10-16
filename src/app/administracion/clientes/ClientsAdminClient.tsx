"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  Plus, Search, Eye, Phone, Mail, Building, MapPin, X, Check,
  AlertTriangle, UserCheck, ChevronLeft, ChevronRight, RefreshCw, Trash2
} from "lucide-react";
import {
  createClientAdmin,
  reassignClientAction,
  checkClientDuplicatesAction,
  deleteClientSafeAction
} from "@/lib/supabase/manufacturing";

const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  presupuestado: "Presupuestado",
  negociacion: "En negociación",
  ganado: "Vendido",
  vendido: "Vendido",
  perdido: "Perdido",
  inactivo: "Inactivo"
};

const STATUS_COLORS: Record<string, string> = {
  nuevo: "bg-blue-50 text-blue-700 border-blue-200",
  contactado: "bg-purple-50 text-purple-700 border-purple-200",
  presupuestado: "bg-amber-50 text-amber-700 border-amber-200",
  negociacion: "bg-orange-50 text-orange-700 border-orange-200",
  ganado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  vendido: "bg-emerald-50 text-emerald-700 border-emerald-200",
  perdido: "bg-rose-50 text-rose-700 border-rose-200",
  inactivo: "bg-stone-100 text-stone-600 border-stone-300"
};

interface Client {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  source?: string;
  seller_id: string | null;
  created_by_name?: string | null;
  created_by_role?: string | null;
  sellers?: any;
}

interface Seller {
  id: string;
  full_name: string;
}

interface ClientsAdminClientProps {
  initialClients: Client[];
  totalCount: number;
  serverPage: number;
  serverPageSize: number;
  serverTotalPages: number;
  sellers: Seller[];
  initialSearch?: string;
  initialStatus?: string;
  initialSellerId?: string;
  isAdmin: boolean;
}

export function ClientsAdminClient({
  initialClients,
  totalCount,
  serverPage,
  serverTotalPages,
  sellers,
  initialSearch = "",
  initialStatus = "all",
  initialSellerId = "all",
  isAdmin
}: ClientsAdminClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [sellerId, setSellerId] = useState(initialSellerId);

  // Modal Nuevo Cliente
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [assignedSellerId, setAssignedSellerId] = useState("");
  const [duplicateWarnings, setDuplicateWarnings] = useState<any[]>([]);

  // Modal Reasignar
  const [reassignClient, setReassignClient] = useState<Client | null>(null);
  const [newSellerId, setNewSellerId] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros aplicados con URL
  const applyFilters = (newParams: { search?: string; status?: string; sellerId?: string; page?: number }) => {
    const s = newParams.search !== undefined ? newParams.search : search;
    const st = newParams.status !== undefined ? newParams.status : status;
    const sl = newParams.sellerId !== undefined ? newParams.sellerId : sellerId;
    const p = newParams.page !== undefined ? newParams.page : 1;

    const query = new URLSearchParams();
    if (s) query.set("search", s);
    if (st && st !== "all") query.set("status", st);
    if (sl && sl !== "all") query.set("sellerId", sl);
    if (p > 1) query.set("page", String(p));

    startTransition(() => {
      router.push(`/administracion/clientes?${query.toString()}`);
    });
  };

  // Detección de duplicados al tipear
  const handleCheckDuplicates = async (currName: string, currEmail: string, currPhone: string, currCompany: string) => {
    try {
      const res = await checkClientDuplicatesAction({
        name: currName,
        email: currEmail,
        phone: currPhone,
        companyName: currCompany
      });
      setDuplicateWarnings(res.duplicates || []);
    } catch {
      // Ignorar fallas silenciosas en live search
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await createClientAdmin({
        name,
        company_name: companyName,
        email,
        phone,
        address,
        notes,
        seller_id: assignedSellerId || undefined
      });
      setShowCreateModal(false);
      setName("");
      setCompanyName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setNotes("");
      setAssignedSellerId("");
      setDuplicateWarnings([]);
      setSuccess("Cliente creado exitosamente.");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignClient) return;
    if (!newSellerId) {
      setError("Debe seleccionar un nuevo asesor comercial.");
      return;
    }
    if (!reassignReason || reassignReason.trim().length < 3) {
      setError("Debe ingresar un motivo fundado para la reasignación (mínimo 3 caracteres).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await reassignClientAction({
        clientId: reassignClient.id,
        newSellerId,
        reason: reassignReason
      });
      setReassignClient(null);
      setNewSellerId("");
      setReassignReason("");
      setSuccess("Cliente reasignado exitosamente con auditoría completa.");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`¿Está seguro de eliminar al cliente "${client.name}"? Solo se permite si no posee presupuestos ni pedidos registrados.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteClientSafeAction(client.id);
      setSuccess("Cliente eliminado exitosamente.");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Alertas */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Filtros y Acciones */}
      <Card className="p-4 border-stone-200 bg-white">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-2.5">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, empresa, email o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters({ search })}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-deep"
              />
            </div>

            {/* Filtro Asesor */}
            <select
              value={sellerId}
              onChange={(e) => {
                setSellerId(e.target.value);
                applyFilters({ sellerId: e.target.value });
              }}
              className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none"
            >
              <option value="all">Todos los asesores</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  Asesor: {s.full_name}
                </option>
              ))}
            </select>

            {/* Filtro Estado */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                applyFilters({ status: e.target.value });
              }}
              className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none"
            >
              <option value="all">Todos los estados CRM</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => applyFilters({ search, status, sellerId })}
              className="text-xs border-stone-200"
            >
              Filtrar
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-accent-deep hover:bg-accent-hover text-white text-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </Button>
        </div>
      </Card>

      {/* Tabla de Clientes */}
      <Card className="border-stone-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Cliente / Razón Social</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Asesor Asignado</th>
                <th className="py-3 px-4">Alta Por</th>
                <th className="py-3 px-4">Estado CRM</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No se encontraron clientes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/administracion/clientes/${c.id}`}
                        className="font-bold text-stone-900 hover:text-accent-deep transition-colors text-sm block"
                      >
                        {c.name}
                      </Link>
                      {c.company_name && (
                        <span className="text-stone-500 text-[11px] block">{c.company_name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {c.email && (
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                          <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {c.sellers?.full_name ? (
                        <Badge variant="outline" className="border-stone-300 text-stone-800 bg-stone-50">
                          {c.sellers.full_name}
                        </Badge>
                      ) : (
                        <span className="text-amber-600 font-semibold text-[11px]">Sin asignar</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-[11px]">
                      <span className="block font-medium text-stone-700">
                        {c.created_by_name || "Asesor Comercial"}
                      </span>
                      <span className="text-stone-400 text-[10px] capitalize">
                        {c.created_by_role || "comercial"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`px-2 py-0.5 text-[10px] font-semibold border ${STATUS_COLORS[c.status] || STATUS_COLORS.nuevo}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-7 px-2 text-stone-600 border-stone-200"
                        >
                          <Link href={`/administracion/clientes/${c.id}`} title="Ver Detalle">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReassignClient(c);
                            setNewSellerId(c.seller_id || "");
                            setReassignReason("");
                          }}
                          className="h-7 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          title="Reasignar Asesor"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClient(c)}
                          className="h-7 px-2 text-rose-500 border-rose-200 hover:bg-rose-50"
                          title="Eliminar seguro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {serverTotalPages > 1 && (
          <div className="p-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <span>
              Total: <strong>{totalCount}</strong> clientes | Página <strong>{serverPage}</strong> de <strong>{serverTotalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={serverPage <= 1}
                onClick={() => applyFilters({ page: serverPage - 1 })}
                className="h-7 px-2"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={serverPage >= serverTotalPages}
                onClick={() => applyFilters({ page: serverPage + 1 })}
                className="h-7 px-2"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* =========================================================================
          MODAL: NUEVO CLIENTE (Con detección de duplicados en tiempo real)
         ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg p-6 bg-white border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h2 className="text-base font-bold text-stone-900">
                Nuevo Cliente (Administración)
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Nombre Completo / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    handleCheckDuplicates(e.target.value, email, phone, companyName);
                  }}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                  placeholder="Ej: Juan Pérez o Sanitarios del Plata S.A."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Nombre de Fantasía / Empresa (opcional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    handleCheckDuplicates(name, email, phone, e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                  placeholder="Ej: Estudio de Arquitectura"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      handleCheckDuplicates(name, e.target.value, phone, companyName);
                    }}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      handleCheckDuplicates(name, email, e.target.value, companyName);
                    }}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                    placeholder="1144556677"
                  />
                </div>
              </div>

              {/* Aviso de duplicados detectados */}
              {duplicateWarnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Posibles Clientes Similares Detectados ({duplicateWarnings.length}):</span>
                  </div>
                  <ul className="space-y-1">
                    {duplicateWarnings.map((dup) => (
                      <li key={dup.id} className="border-t border-amber-200/50 pt-1 flex justify-between">
                        <span>
                          <strong>{dup.name}</strong> {dup.phone ? `(${dup.phone})` : ''} {dup.email ? `[${dup.email}]` : ''}
                        </span>
                        <span className="font-semibold text-amber-900">
                          Asesor: {dup.sellers?.full_name || 'Sin asignar'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-amber-700 mt-1 italic">
                    El sistema no fusionará los registros automáticamente. Verifique antes de registrar.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Asesor Comercial Asignado
                </label>
                <select
                  value={assignedSellerId}
                  onChange={(e) => setAssignedSellerId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white text-stone-800 outline-none"
                >
                  <option value="">Dejar sin asignar (Atención general)</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Dirección de Entrega / Localidad
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                  placeholder="Calle, Número, Localidad, CP"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Notas Internas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                  placeholder="Observaciones de fábrica o requerimientos especiales"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                  className="bg-accent-deep text-white text-xs"
                >
                  {loading ? "Guardando..." : "Crear Cliente"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* =========================================================================
          MODAL: REASIGNAR ASESOR COMERCIAL (Con auditoría obligatoria)
         ========================================================================= */}
      {reassignClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 bg-white border-stone-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h2 className="text-sm font-bold text-stone-900">
                  Reasignar Asesor Comercial
                </h2>
                <p className="text-xs text-stone-500">
                  Cliente: <strong>{reassignClient.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setReassignClient(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs">
                <span className="text-stone-500 block text-[11px]">Asesor actual:</span>
                <span className="font-bold text-stone-900">
                  {reassignClient.sellers?.full_name || "Sin asesor asignado"}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Nuevo Asesor Comercial Asignado *
                </label>
                <select
                  required
                  value={newSellerId}
                  onChange={(e) => setNewSellerId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white text-stone-800 outline-none"
                >
                  <option value="">Seleccione un asesor comercial activo...</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Motivo de la Reasignación (Auditoría obligatoria) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Ej: Cambio de zona geográfica / Solicitud del cliente / Reorganización de cartera"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  La reasignación quedará registrada en el historial inmutable y no modificará documentos pasados.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReassignClient(null)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  {loading ? "Reasignando..." : "Confirmar Reasignación"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
