"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  Building, Mail, Phone, MapPin, Calendar, Clock,
  PlusSquare, MessageSquare, FileText, ShoppingBag, Send,
  Eye, Check, X, ArrowRight, UserCheck, AlertTriangle, ShieldCheck
} from "lucide-react";
import { formatCurrencyARS } from "@/lib/commercial-calculations";
import { reassignClientAction, updateClientAdmin } from "@/lib/supabase/manufacturing";
import { createClientNote } from "@/lib/supabase/comercial";

interface ClientAdminDetailClientProps {
  initialClient: any;
  history: any[];
  sellers: any[];
  budgets: any[];
  orders: any[];
  initialNotes: any[];
}

export function ClientAdminDetailClient({
  initialClient,
  history,
  sellers,
  budgets,
  orders,
  initialNotes
}: ClientAdminDetailClientProps) {
  const router = useRouter();
  const [client, setClient] = useState(initialClient);
  const [notes, setNotes] = useState(initialNotes);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal Reasignar
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [newSellerId, setNewSellerId] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSellerId) {
      setError("Debe seleccionar un asesor comercial.");
      return;
    }
    if (!reassignReason || reassignReason.trim().length < 3) {
      setError("El motivo debe tener al menos 3 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await reassignClientAction({
        clientId: client.id,
        newSellerId,
        reason: reassignReason
      });
      setShowReassignModal(false);
      setNewSellerId("");
      setReassignReason("");
      setSuccess("Asesor comercial reasignado exitosamente.");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setLoading(true);
    try {
      const res = await createClientNote({
        client_id: client.id,
        content: newNoteContent.trim(),
        contacted_at: new Date().toISOString(),
        note_type: "manual"
      });
      if (res.data) {
        setNotes([res.data, ...notes]);
        setNewNoteContent("");
        setSuccess("Nota registrada.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Información del Cliente y Asignación */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 border-stone-200 bg-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-black text-stone-900">{client.name}</h2>
                {client.company_name && (
                  <p className="text-xs text-stone-500 font-medium">{client.company_name}</p>
                )}
              </div>
              <Badge variant="outline" className="text-xs capitalize font-bold">
                {client.status || "Nuevo"}
              </Badge>
            </div>

            <div className="space-y-3 text-xs border-t border-stone-100 pt-3">
              {client.email && (
                <div className="flex items-center gap-2 text-stone-700">
                  <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-stone-700">
                  <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2 text-stone-700">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <span>{client.address}</span>
                </div>
              )}
            </div>

            {/* Bloque de Autoría y Asignación */}
            <div className="mt-5 p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                  Asesor Comercial Asignado:
                </span>
                <span className="font-bold text-stone-900 text-sm">
                  {client.sellers?.full_name || "Sin asesor comercial"}
                </span>
              </div>
              <div className="border-t border-stone-200/60 pt-2 flex justify-between text-[11px] text-stone-600">
                <span>Alta realizada por:</span>
                <span className="font-semibold text-stone-800">
                  {client.created_by_name || "Comercial"} ({client.created_by_role || "asesor"})
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReassignModal(true)}
                className="w-full text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 mt-1 flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Reasignar Asesor Comercial</span>
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-100">
              <Button variant="primary" asChild className="w-full bg-accent-deep hover:bg-accent-hover text-white text-xs">
                <Link href={`/administracion/presupuestos/nuevo?clientId=${client.id}`} className="flex items-center justify-center gap-2">
                  <PlusSquare className="w-4 h-4" />
                  <span>Crear Presupuesto Administrativo</span>
                </Link>
              </Button>
            </div>
          </Card>

          {/* Historial de Reasignaciones Auditadas */}
          <Card className="p-6 border-stone-200 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-stone-400" />
              <span>Auditoría de Asignaciones ({history.length})</span>
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Sin reasignaciones registradas.</p>
            ) : (
              <div className="space-y-3">
                {history.map((h: any) => (
                  <div key={h.id} className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs">
                    <div className="flex justify-between items-center text-[10px] text-stone-500 mb-1">
                      <span>{new Date(h.created_at).toLocaleDateString("es-AR")}</span>
                      <span>Por: {h.changed_by_name}</span>
                    </div>
                    <div className="font-medium text-stone-800">
                      De: <strong>{h.previous_seller?.full_name || "Sin asesor"}</strong> → A:{" "}
                      <strong>{h.new_seller?.full_name}</strong>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1 italic">
                      Motivo: "{h.reason}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Columna Central y Derecha: Operaciones Comerciales y Seguimiento */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Presupuestos y Pedidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Presupuestos */}
            <Card className="p-5 border-stone-200 bg-white">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Presupuestos ({budgets.length})</span>
                </h3>
              </div>

              {budgets.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No registra cotizaciones.</p>
              ) : (
                <div className="space-y-2">
                  {budgets.map((b: any) => (
                    <Link
                      key={b.id}
                      href={`/administracion/presupuestos`}
                      className="p-2.5 rounded-lg border border-stone-100 hover:border-stone-300 hover:bg-stone-50 transition-all flex justify-between items-center text-xs block"
                    >
                      <div>
                        <span className="font-bold text-stone-900 block">
                          Presupuesto #{b.budget_number}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(b.created_at).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-900 font-mono block">
                          {formatCurrencyARS(b.total_amount)}
                        </span>
                        <Badge className="text-[9px] px-1.5 py-0 capitalize">
                          {b.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Pedidos */}
            <Card className="p-5 border-stone-200 bg-white">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-500" />
                  <span>Pedidos Confirmados ({orders.length})</span>
                </h3>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No registra pedidos.</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o: any) => (
                    <Link
                      key={o.id}
                      href={`/administracion/pedidos/${o.id}`}
                      className="p-2.5 rounded-lg border border-stone-100 hover:border-stone-300 hover:bg-stone-50 transition-all flex justify-between items-center text-xs block"
                    >
                      <div>
                        <span className="font-bold text-stone-900 block">
                          Pedido #{o.order_number}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(o.created_at).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-900 font-mono block">
                          {formatCurrencyARS(o.total_amount)}
                        </span>
                        <Badge className="text-[9px] px-1.5 py-0 capitalize">
                          {o.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Seguimiento y Notas CRM */}
          <Card className="p-6 border-stone-200 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-stone-400" />
              <span>Bitácora de Contacto y Seguimiento CRM</span>
            </h3>

            {/* Formulario de nueva nota */}
            <form onSubmit={handleAddNote} className="mb-6">
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Registrar nueva comunicación, requerimiento o nota técnica..."
                  className="flex-1 p-3 text-xs border border-stone-200 rounded-lg focus:ring-2 focus:ring-accent-deep outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !newNoteContent.trim()}
                  className="bg-accent-deep text-white px-4 shrink-0 text-xs flex items-center gap-1.5 self-end"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar</span>
                </Button>
              </div>
            </form>

            {/* Listado de Notas */}
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No hay notas de seguimiento registradas.</p>
              ) : (
                notes.map((n: any) => (
                  <div key={n.id} className="p-3 bg-stone-50/70 border border-stone-200/80 rounded-lg text-xs">
                    <div className="flex justify-between items-center text-[10px] text-stone-400 mb-1">
                      <span>{new Date(n.contacted_at || n.created_at).toLocaleString("es-AR")}</span>
                      <span className="font-semibold text-stone-600">
                        {n.sellers?.full_name || "Administración"}
                      </span>
                    </div>
                    <p className="text-stone-800 whitespace-pre-line">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Reasignar */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 bg-white border-stone-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h2 className="text-sm font-bold text-stone-900">
                Reasignar Asesor Comercial
              </h2>
              <button onClick={() => setShowReassignModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassign} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Nuevo Asesor Comercial *
                </label>
                <select
                  required
                  value={newSellerId}
                  onChange={(e) => setNewSellerId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white text-stone-800 outline-none"
                >
                  <option value="">Seleccione un asesor comercial...</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Motivo de Reasignación (Auditoría) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Justifique el motivo del cambio de cartera..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReassignModal(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  {loading ? "Reasignando..." : "Confirmar"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
