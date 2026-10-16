"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Boxes, Plus, Search, Edit2, Trash2, Check, X, AlertTriangle, Power
} from "lucide-react";
import {
  createSupplyAction,
  updateSupplyAction,
  toggleSupplyActiveAction,
  deleteSupplySafeAction
} from "@/lib/supabase/manufacturing";

const UOM_LABELS: Record<string, string> = {
  un: "Unidad (Entero)",
  m: "Metros (Decimal)",
  kg: "Kilogramos (Decimal)",
  l: "Litros (Decimal)",
  m2: "Metros Cuadrados (Decimal)",
  m3: "Metros Cúbicos (Decimal)",
  g: "Gramos (Decimal)",
  cm: "Centímetros (Decimal)"
};

interface SuppliesClientProps {
  initialSupplies: any[];
}

export function SuppliesClient({ initialSupplies }: SuppliesClientProps) {
  const router = useRouter();
  const [supplies, setSupplies] = useState<any[]>(initialSupplies);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [showModal, setShowModal] = useState(false);
  const [editingSupply, setEditingSupply] = useState<any | null>(null);

  // Form
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState<any>("un");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingSupply(null);
    setCode("");
    setName("");
    setDescription("");
    setUnitOfMeasure("un");
    setNotes("");
    setShowModal(true);
  };

  const openEditModal = (s: any) => {
    setEditingSupply(s);
    setCode(s.code);
    setName(s.name);
    setDescription(s.description || "");
    setUnitOfMeasure(s.unit_of_measure);
    setNotes(s.notes || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del insumo es obligatorio.");
      return;
    }
    if (!editingSupply && !code.trim()) {
      setError("El código único del insumo es obligatorio.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingSupply) {
        await updateSupplyAction(editingSupply.id, {
          name,
          description,
          unitOfMeasure,
          notes
        });
        setSuccess("Insumo actualizado exitosamente.");
      } else {
        await createSupplyAction({
          code,
          name,
          description,
          unitOfMeasure,
          notes
        });
        setSuccess("Insumo creado exitosamente.");
      }
      setShowModal(false);
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (s: any) => {
    try {
      await toggleSupplyActiveAction(s.id);
      setSuccess(`Insumo ${s.is_active ? "desactivado" : "activado"} correctamente.`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (s: any) => {
    if (!confirm(`¿Eliminar insumo "${s.name}"? Si está en uso en composiciones técnicas, la eliminación física se bloqueará para preservar la trazabilidad.`)) {
      return;
    }

    try {
      await deleteSupplySafeAction(s.id);
      setSuccess("Insumo eliminado exitosamente.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Filtrado en memoria
  const filtered = supplies.filter((s) => {
    const matchesSearch =
      !search ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.is_active) ||
      (statusFilter === "inactive" && !s.is_active);

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

      {/* Barra de Filtros */}
      <Card className="p-4 border-stone-200 bg-white">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-deep"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs border border-stone-200 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo Activos</option>
              <option value="inactive">Solo Inactivos</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="bg-accent-deep hover:bg-accent-hover text-white text-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Insumo</span>
          </Button>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="border-stone-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-28">Código</th>
                <th className="py-3 px-4">Nombre y Descripción</th>
                <th className="py-3 px-4 w-32">Unidad (UOM)</th>
                <th className="py-3 px-4 w-28">Estado</th>
                <th className="py-3 px-4">Alta / Autor</th>
                <th className="py-3 px-4 text-right w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No hay insumos registrados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {s.code}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-stone-900 block text-sm">{s.name}</span>
                      {s.description && (
                        <span className="text-stone-500 text-[11px] block">{s.description}</span>
                      )}
                      {s.notes && (
                        <span className="text-stone-400 text-[10px] italic block mt-0.5">Nota: {s.notes}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800">
                      <span className="uppercase bg-stone-100 px-2 py-0.5 rounded text-[11px] font-mono">
                        {s.unit_of_measure}
                      </span>
                      <span className="text-[10px] text-stone-500 block mt-0.5">
                        {UOM_LABELS[s.unit_of_measure] || s.unit_of_measure}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`text-[10px] px-2 py-0.5 ${
                          s.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-stone-100 text-stone-500 border-stone-200"
                        }`}
                      >
                        {s.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-[11px]">
                      <span>{new Date(s.created_at).toLocaleDateString("es-AR")}</span>
                      <span className="block text-[10px] text-stone-400">
                        {s.created_by_name || "Administración"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(s)}
                          className={`h-7 px-2 ${
                            s.is_active ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={s.is_active ? "Desactivar" : "Activar"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(s)}
                          className="h-7 px-2 text-stone-600 hover:bg-stone-50"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(s)}
                          className="h-7 px-2 text-rose-500 hover:bg-rose-50"
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
      </Card>

      {/* Modal Alta / Edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 bg-white border-stone-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h2 className="text-sm font-bold text-stone-900">
                {editingSupply ? `Editar Insumo (${editingSupply.code})` : "Nuevo Insumo de Catálogo"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingSupply && (
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Código Único *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ej: INS-JET-01, MOT-1HP, TUBO-PVC-40"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-accent-deep outline-none"
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Debe ser único en todo el catálogo.
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Nombre del Insumo / Componente *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Jet Hidromasaje Orientable 40mm"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Descripción Técnica (opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Especificación de material, diámetro, marca, etc."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Unidad de Medida (UOM) *
                </label>
                <select
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs bg-white text-stone-800 outline-none"
                >
                  <option value="un">Unidad (un) — Solo cantidades enteras</option>
                  <option value="m">Metros (m) — Admite decimales</option>
                  <option value="kg">Kilogramos (kg) — Admite decimales</option>
                  <option value="l">Litros (l) — Admite decimales</option>
                  <option value="m2">Metros Cuadrados (m2) — Admite decimales</option>
                  <option value="m3">Metros Cúbicos (m3) — Admite decimales</option>
                  <option value="g">Gramos (g) — Admite decimales</option>
                  <option value="cm">Centímetros (cm) — Admite decimales</option>
                </select>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Los componentes contados por unidad exigen enteros; metros, kilos y litros admiten decimales.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Observaciones Técnicas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instrucciones para almacenamiento o fabricación..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
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
                  {loading ? "Guardando..." : editingSupply ? "Actualizar Insumo" : "Crear Insumo"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
