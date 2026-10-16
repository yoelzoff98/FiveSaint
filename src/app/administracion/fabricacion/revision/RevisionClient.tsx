"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  CheckCircle2, XCircle, AlertTriangle, Eye, Check, X,
  Clock, ShieldAlert, SlidersHorizontal, ArrowLeft, RefreshCw
} from "lucide-react";
import { reviewOrderItemConfigurationAction } from "@/lib/supabase/manufacturing";

interface RevisionClientProps {
  pendingItems: any[];
  compositions: any[];
  options: any[];
}

export function RevisionClient({ pendingItems, compositions, options }: RevisionClientProps) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [adjustedConfig, setAdjustedConfig] = useState<Record<string, any>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const openReviewModal = (item: any) => {
    setSelectedItem(item);
    setReviewStatus("approved");
    setReviewNotes(item.configuration_review_notes || "");
    setAdjustedConfig(item.configuration && Object.keys(item.configuration).length > 0 ? item.configuration : {});
    setError(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (reviewStatus === "rejected" && (!reviewNotes || reviewNotes.trim().length < 3)) {
      setError("Debe especificar el motivo del rechazo de la configuración (mínimo 3 caracteres).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await reviewOrderItemConfigurationAction({
        orderItemId: selectedItem.id,
        status: reviewStatus,
        reviewNotes: reviewNotes.trim() || undefined,
        adjustedConfiguration: Object.keys(adjustedConfig).length > 0 ? adjustedConfig : undefined
      });

      setSuccess(`Ítem de pedido #${selectedItem.orders?.order_number} revisado como '${reviewStatus === 'approved' ? 'Aprobado para fabricación' : 'Rechazado'}' correctamente.`);
      setSelectedItem(null);
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

      {/* Tabla de Ítems Pendientes de Revisión Técnica */}
      <Card className="border-stone-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Pedido / Fecha</th>
                <th className="py-3 px-4">Cliente / Vendedor</th>
                <th className="py-3 px-4">Producto & Variante</th>
                <th className="py-3 px-4">Configuración Comercial</th>
                <th className="py-3 px-4 w-32 text-center">Estado Revisión</th>
                <th className="py-3 px-4 text-right w-36">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pendingItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No hay ítems con pendientes de revisión o fabricación.
                  </td>
                </tr>
              ) : (
                pendingItems.map((it) => {
                  const isApproved = it.configuration_status === "approved";
                  const isRejected = it.configuration_status === "rejected";
                  const isPending = !isApproved && !isRejected;

                  return (
                    <tr key={it.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/administracion/pedidos/${it.order_id}`}
                          className="font-bold text-stone-900 hover:text-accent-deep transition-colors text-sm block"
                        >
                          Pedido #{it.orders?.order_number}
                        </Link>
                        <span className="text-[10px] text-stone-400">
                          {new Date(it.orders?.created_at).toLocaleDateString("es-AR")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        <span className="font-semibold block">{it.orders?.clients?.name}</span>
                        <span className="text-[10px] text-stone-500">
                          Asesor: {it.orders?.sellers?.full_name || "FiveSaint Central"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-stone-900 block text-sm">
                          {it.product_name}
                        </span>
                        {it.variant_name && (
                          <span className="text-stone-500 text-[11px] block">{it.variant_name}</span>
                        )}
                        {it.factory_notes && (
                          <span className="text-amber-800 text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 block max-w-xs break-words">
                            Notas vendedor: "{it.factory_notes}"
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {it.configuration && Object.keys(it.configuration).length > 0 ? (
                          <div className="space-y-0.5">
                            {Object.entries(it.configuration).map(([k, v]) => (
                              <div key={k} className="text-[10px] text-stone-700">
                                <span className="font-semibold capitalize">{k.replace(/_/g, ' ')}:</span>{" "}
                                <span className="font-mono">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">
                            {it.factory_notes ? "Texto libre sin opciones estructuradas (Requiere revisión)" : "Estándar de catálogo"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isApproved ? (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                            Aprobado
                          </Badge>
                        ) : isRejected ? (
                          <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-[10px]">
                            Rechazado
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px]">
                            Pendiente Revisión
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewModal(it)}
                          className="h-8 px-3 text-xs border-stone-300 text-stone-700 hover:bg-stone-50"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                          <span>Revisar</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Revisión y Aprobación */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg p-6 bg-white border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h2 className="text-sm font-bold text-stone-900">
                  Revisión Técnica de Configuración
                </h2>
                <p className="text-xs text-stone-500">
                  Pedido #{selectedItem.orders?.order_number} | {selectedItem.product_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-stone-800">
                  Artículo: <strong className="font-black text-stone-900">{selectedItem.product_name}</strong>
                  {selectedItem.variant_name ? ` (${selectedItem.variant_name})` : ""}
                </div>
                {selectedItem.factory_notes && (
                  <div className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 text-[11px] mt-1">
                    <span className="font-bold block uppercase text-[9px]">Notas Libres del Vendedor:</span>
                    {selectedItem.factory_notes}
                  </div>
                )}
              </div>

              {/* Dictamen de Revisión */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Dictamen de Revisión *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus("approved")}
                    className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      reviewStatus === "approved"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs"
                        : "border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Aprobar Configuración</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus("rejected")}
                    className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      reviewStatus === "rejected"
                        ? "bg-rose-50 border-rose-400 text-rose-800 shadow-xs"
                        : "border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Rechazar / Observar</span>
                  </button>
                </div>
              </div>

              {/* Opciones configuradas */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Configuración Técnica Confirmada
                </label>
                {options.length > 0 ? (
                  <div className="space-y-2 border border-stone-200 p-3 rounded-lg bg-stone-50/50">
                    {options.map((opt) => (
                      <div key={opt.code} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-700">{opt.name}:</span>
                        <select
                          value={adjustedConfig[opt.code] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAdjustedConfig((prev) => ({
                              ...prev,
                              [opt.code]: val
                            }));
                          }}
                          className="px-2 py-1 border border-stone-200 rounded text-xs bg-white text-stone-800"
                        >
                          <option value="">Seleccionar...</option>
                          {opt.allowed_values?.map((v: any) => (
                            <option key={v.value} value={v.value}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">No hay opciones configurables definidas para este producto.</p>
                )}
              </div>

              {/* Observaciones de revisión */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Notas de Revisión y Dictamen Técnico
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Detalle la verificación de medidas, compatibilidad o motivo de rechazo..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-accent-deep"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedItem(null)}
                  disabled={loading}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className={`text-xs font-bold text-white ${
                    reviewStatus === "approved" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800"
                  }`}
                >
                  {loading ? "Guardando..." : reviewStatus === "approved" ? "Aprobar y Habilitar Emisión" : "Rechazar Configuración"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
