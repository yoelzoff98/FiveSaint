"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Layers, Plus, Search, Eye, CheckCircle2, Archive, Copy, X,
  Trash2, AlertTriangle, Check
} from "lucide-react";
import {
  createProductCompositionAction,
  publishProductCompositionAction,
  retireProductCompositionAction,
  createNextVersionCompositionAction,
  getProductCompositionById
} from "@/lib/supabase/manufacturing";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador (Editable)",
  published: "Publicada (Vigente)",
  retired: "Retirada (Histórica)"
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-50 text-amber-800 border-amber-300",
  published: "bg-emerald-50 text-emerald-800 border-emerald-300",
  retired: "bg-stone-100 text-stone-500 border-stone-200"
};

interface CompositionsClientProps {
  initialCompositions: any[];
  products: any[];
  supplies: any[];
}

export function CompositionsClient({
  initialCompositions,
  products,
  supplies
}: CompositionsClientProps) {
  const router = useRouter();
  const [compositions, setCompositions] = useState<any[]>(initialCompositions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal Nueva Composición
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [name, setName] = useState("");
  const [technicalNotes, setTechnicalNotes] = useState("");
  const [wastePercentage, setWastePercentage] = useState(0);
  const [items, setItems] = useState<Array<{ supplyId: string; quantity: number; notes?: string }>>([]);

  // Detalle de Composición
  const [viewingComp, setViewingComp] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const openCreateModal = () => {
    setSelectedProductId(products[0]?.id || "");
    setSelectedVariantId("");
    setName("");
    setTechnicalNotes("");
    setWastePercentage(0);
    setItems([]);
    setShowCreateModal(true);
  };

  const handleAddItem = () => {
    if (supplies.length === 0) return;
    setItems([...items, { supplyId: supplies[0].id, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    setItems(next);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError("Debe seleccionar un producto.");
      return;
    }
    if (!name.trim()) {
      setError("El nombre de la composición es obligatorio.");
      return;
    }
    if (items.length === 0) {
      setError("Debe agregar al menos un insumo a la composición.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createProductCompositionAction({
        productId: selectedProductId,
        variantId: selectedVariantId || null,
        name,
        technicalNotes,
        wastePercentage,
        items
      });
      setShowCreateModal(false);
      setSuccess("Composición borrador creada exitosamente.");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    if (!confirm("¿Publicar esta composición? Al publicarse, cualquier versión anterior quedará retirada automáticamente y esta versión será la fuente activa para fabricar.")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await publishProductCompositionAction(id);
      setSuccess("Composición publicada exitosamente.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRetire = async (id: string) => {
    if (!confirm("¿Retirar esta versión de composición? Quedará disponible para consultas y reimpresiones históricas.")) {
      return;
    }

    setLoading(true);
    try {
      await retireProductCompositionAction(id);
      setSuccess("Composición retirada.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNextVersion = async (id: string) => {
    if (!confirm("Modificar una composición publicada genera automáticamente una nueva versión en borrador, preservando la versión original intacta. ¿Desea continuar?")) {
      return;
    }

    setLoading(true);
    try {
      const nextComp = await createNextVersionCompositionAction(id);
      setSuccess(`Nueva versión v${nextComp.version} generada en estado borrador.`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const details = await getProductCompositionById(id);
      setViewingComp(details);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const filtered = compositions.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.products?.name && c.products.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      {/* Filtros */}
      <Card className="p-4 border-stone-200 bg-white">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por producto o nombre de composición..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-deep"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="published">Publicadas (Vigentes)</option>
              <option value="draft">Borradores</option>
              <option value="retired">Retiradas</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="bg-accent-deep hover:bg-accent-hover text-white text-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Composición</span>
          </Button>
        </div>
      </Card>

      {/* Listado */}
      <Card className="border-stone-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Producto / Variante</th>
                <th className="py-3 px-4">Nombre de Composición</th>
                <th className="py-3 px-4 w-24 text-center">Versión</th>
                <th className="py-3 px-4 w-28">Estado</th>
                <th className="py-3 px-4 w-24 text-center">Merma</th>
                <th className="py-3 px-4">Autor / Fecha</th>
                <th className="py-3 px-4 text-right w-40">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No se encontraron composiciones técnicas registradas.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-stone-900 block text-sm">
                        {c.products?.name || "Producto sin nombre"}
                      </span>
                      {c.product_variants?.name && (
                        <span className="text-stone-500 text-[11px] block">
                          Variante: {c.product_variants.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-stone-800 block">{c.name}</span>
                      {c.technical_notes && (
                        <span className="text-stone-400 text-[10px] truncate max-w-[200px] block">
                          {c.technical_notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-stone-900">
                      v{c.version}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`text-[10px] px-2 py-0.5 border ${STATUS_COLORS[c.status] || STATUS_COLORS.draft}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center text-stone-700 font-mono">
                      {c.waste_percentage ? `${c.waste_percentage}%` : "0%"}
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-[11px]">
                      <span>{new Date(c.created_at).toLocaleDateString("es-AR")}</span>
                      <span className="block text-[10px] text-stone-400">
                        {c.created_by_name || "Administración"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(c.id)}
                          className="h-7 px-2 text-stone-600 hover:bg-stone-50"
                          title="Ver Insumos"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        {c.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublish(c.id)}
                            className="h-7 px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            title="Publicar (Habilitar para fábrica)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {c.status === "published" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateNextVersion(c.id)}
                              className="h-7 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                              title="Generar nueva versión borrador"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetire(c.id)}
                              className="h-7 px-2 text-stone-500 border-stone-200 hover:bg-stone-50"
                              title="Retirar versión"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* =========================================================================
          MODAL: DETALLE DE INSUMOS DE LA COMPOSICIÓN
         ========================================================================= */}
      {viewingComp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <Card className="w-full max-w-2xl p-6 bg-white border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h2 className="text-sm font-bold text-stone-900">
                  {viewingComp.name} (Versión {viewingComp.version})
                </h2>
                <p className="text-xs text-stone-500">
                  Producto: <strong>{viewingComp.products?.name}</strong>
                  {viewingComp.product_variants?.name ? ` | Variante: ${viewingComp.product_variants.name}` : ''}
                </p>
              </div>
              <button onClick={() => setViewingComp(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Estado:</span>
                  <Badge className={`text-[10px] mt-0.5 ${STATUS_COLORS[viewingComp.status]}`}>
                    {STATUS_LABELS[viewingComp.status]}
                  </Badge>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Merma Técnica:</span>
                  <span className="font-bold text-stone-900">{viewingComp.waste_percentage || 0}%</span>
                </div>
                {viewingComp.published_at && (
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase font-bold">Publicada el:</span>
                    <span className="text-stone-800">{new Date(viewingComp.published_at).toLocaleDateString("es-AR")}</span>
                  </div>
                )}
              </div>

              {viewingComp.technical_notes && (
                <div className="text-xs text-stone-700 bg-amber-50/50 p-2.5 rounded border border-amber-200/60">
                  <span className="font-bold block text-amber-900 mb-0.5">Observaciones Técnicas:</span>
                  <p>{viewingComp.technical_notes}</p>
                </div>
              )}

              {/* Insumos */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Insumos Necesarios por Unidad Fabricada ({viewingComp.items?.length || 0})
                </h3>
                <table className="w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-stone-100 text-stone-600 text-[10px] uppercase">
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3">Insumo</th>
                      <th className="py-2 px-3 text-right">Cantidad Base</th>
                      <th className="py-2 px-3 text-center">Unidad</th>
                      <th className="py-2 px-3">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(viewingComp.items || []).map((it: any) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 font-mono font-bold text-stone-800">
                          {it.supplies?.code}
                        </td>
                        <td className="py-2 px-3 font-medium text-stone-900">
                          {it.supplies?.name}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                          {it.quantity}
                        </td>
                        <td className="py-2 px-3 text-center font-semibold text-stone-600 uppercase">
                          {it.supplies?.unit_of_measure}
                        </td>
                        <td className="py-2 px-3 text-stone-500 text-[11px] italic">
                          {it.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-3 border-t border-stone-200">
                <Button variant="outline" size="sm" onClick={() => setViewingComp(null)} className="text-xs">
                  Cerrar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          MODAL: NUEVA COMPOSICIÓN (Borrador)
         ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <Card className="w-full max-w-2xl p-6 bg-white border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h2 className="text-sm font-bold text-stone-900">
                Nueva Composición Base (Borrador)
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Producto Aplicable *
                  </label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white text-stone-800 outline-none"
                  >
                    <option value="">Seleccione un producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Nombre Descriptivo de la Composición *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Estructura Casco y Refuerzo Estándar"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Merma Técnica (%) (Opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={wastePercentage}
                    onChange={(e) => setWastePercentage(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Se calcula explícitamente solo si está definida.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Observaciones Técnicas
                  </label>
                  <input
                    type="text"
                    value={technicalNotes}
                    onChange={(e) => setTechnicalNotes(e.target.value)}
                    placeholder="Instrucciones para laminado, ensamblado, etc."
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                  />
                </div>
              </div>

              {/* Lista dinámica de Insumos */}
              <div className="border border-stone-200 p-3.5 rounded-xl bg-stone-50/50">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Insumos por Unidad Fabricada ({items.length})
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="text-xs h-7 px-2 border-stone-300 text-stone-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Insumo</span>
                  </Button>
                </div>

                {items.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-3 text-center">
                    Agregue los insumos y cantidades requeridas por unidad.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, idx) => {
                      const supplyDef = supplies.find((s) => s.id === item.supplyId);
                      return (
                        <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-stone-200">
                          <select
                            value={item.supplyId}
                            onChange={(e) => handleUpdateItem(idx, "supplyId", e.target.value)}
                            className="flex-1 px-2 py-1.5 border border-stone-200 rounded text-xs bg-white text-stone-800 outline-none"
                          >
                            {supplies.map((s) => (
                              <option key={s.id} value={s.id}>
                                [{s.code}] {s.name} ({s.unit_of_measure})
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1 w-28">
                            <input
                              type="number"
                              min="0.0001"
                              step={supplyDef?.unit_of_measure === 'un' ? '1' : '0.01'}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(idx, "quantity", parseFloat(e.target.value) || 1)}
                              className="w-full px-2 py-1.5 border border-stone-200 rounded text-xs font-mono font-bold text-right outline-none"
                            />
                            <span className="text-[10px] text-stone-500 font-mono uppercase">
                              {supplyDef?.unit_of_measure || 'un'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  {loading ? "Guardando..." : "Crear Borrador"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
