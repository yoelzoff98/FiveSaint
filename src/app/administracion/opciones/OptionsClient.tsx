"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  SlidersHorizontal, Plus, Search, Edit2, Check, X, AlertTriangle,
  Layers, Wrench, ShieldAlert, Trash2
} from "lucide-react";
import {
  createConfigurableOptionAction,
  updateConfigurableOptionAction
} from "@/lib/supabase/manufacturing";

interface OptionsClientProps {
  initialOptions: any[];
  products: any[];
  supplies: any[];
}

export function OptionsClient({
  initialOptions,
  products,
  supplies
}: OptionsClientProps) {
  const router = useRouter();
  const [options, setOptions] = useState<any[]>(initialOptions);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingOption, setEditingOption] = useState<any | null>(null);

  // Form State
  const [productId, setProductId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState("");
  
  // Valores permitidos
  const [allowedValues, setAllowedValues] = useState<Array<{ value: string; label: string }>>([
    { value: "", label: "" }
  ]);

  // Instrucciones por valor
  const [instructionsMap, setInstructionsMap] = useState<Record<string, string>>({});

  // Efectos en materiales
  const [materialsEffects, setMaterialsEffects] = useState<Array<{
    ifValue: string;
    action: 'add' | 'replace' | 'adjust';
    supplyCode: string;
    quantity: number;
    unitOfMeasure: string;
  }>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingOption(null);
    setProductId("");
    setCode("");
    setName("");
    setDescription("");
    setIsRequired(false);
    setDefaultValue("");
    setAllowedValues([
      { value: "opcion_1", label: "Opción 1" },
      { value: "opcion_2", label: "Opción 2" }
    ]);
    setInstructionsMap({});
    setMaterialsEffects([]);
    setShowModal(true);
  };

  const openEditModal = (opt: any) => {
    setEditingOption(opt);
    setProductId(opt.product_id || "");
    setCode(opt.code);
    setName(opt.name);
    setDescription(opt.description || "");
    setIsRequired(Boolean(opt.is_required));
    setDefaultValue(opt.default_value || "");
    setAllowedValues(opt.allowed_values || []);
    setInstructionsMap(opt.manufacturing_instructions || {});
    
    // Mapear efectos planos
    const flattenedEffects: any[] = [];
    if (Array.isArray(opt.materials_effect)) {
      for (const grp of opt.materials_effect) {
        if (Array.isArray(grp.effects)) {
          for (const eff of grp.effects) {
            flattenedEffects.push({
              ifValue: grp.ifValue,
              action: eff.action,
              supplyCode: eff.supplyCode,
              quantity: eff.quantity,
              unitOfMeasure: eff.unitOfMeasure || "un"
            });
          }
        }
      }
    }
    setMaterialsEffects(flattenedEffects);
    setShowModal(true);
  };

  const handleAddAllowedValue = () => {
    setAllowedValues([...allowedValues, { value: "", label: "" }]);
  };

  const handleRemoveAllowedValue = (index: number) => {
    setAllowedValues(allowedValues.filter((_, i) => i !== index));
  };

  const handleAddMaterialEffect = () => {
    if (allowedValues.length === 0 || supplies.length === 0) return;
    setMaterialsEffects([
      ...materialsEffects,
      {
        ifValue: allowedValues[0].value || "",
        action: "add",
        supplyCode: supplies[0].code,
        quantity: 1,
        unitOfMeasure: supplies[0].unit_of_measure
      }
    ]);
  };

  const handleRemoveMaterialEffect = (index: number) => {
    setMaterialsEffects(materialsEffects.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre de la opción es obligatorio.");
      return;
    }
    if (!editingOption && !code.trim()) {
      setError("El código es obligatorio.");
      return;
    }

    const cleanAllowed = allowedValues.filter(v => v.value.trim() && v.label.trim());
    if (cleanAllowed.length === 0) {
      setError("Debe definir al menos un valor permitido.");
      return;
    }

    // Agrupar efectos de materiales por ifValue
    const groupedEffectsMap: Record<string, any[]> = {};
    for (const eff of materialsEffects) {
      if (!eff.ifValue || !eff.supplyCode) continue;
      if (!groupedEffectsMap[eff.ifValue]) {
        groupedEffectsMap[eff.ifValue] = [];
      }
      groupedEffectsMap[eff.ifValue].push({
        action: eff.action,
        supplyCode: eff.supplyCode,
        quantity: eff.quantity,
        unitOfMeasure: eff.unitOfMeasure
      });
    }

    const structuredMaterialsEffect = Object.entries(groupedEffectsMap).map(([ifValue, effects]) => ({
      ifValue,
      effects
    }));

    const changesMaterials = structuredMaterialsEffect.length > 0;

    setLoading(true);
    setError(null);

    try {
      if (editingOption) {
        await updateConfigurableOptionAction(editingOption.id, {
          productId: productId || null,
          name,
          description,
          isRequired,
          defaultValue: defaultValue || null,
          allowedValues: cleanAllowed,
          manufacturingInstructions: instructionsMap,
          materialsEffect: structuredMaterialsEffect,
          changesMaterials
        });
        setSuccess("Opción configurable actualizada exitosamente.");
      } else {
        await createConfigurableOptionAction({
          productId: productId || null,
          code,
          name,
          description,
          isRequired,
          defaultValue: defaultValue || null,
          allowedValues: cleanAllowed,
          manufacturingInstructions: instructionsMap,
          materialsEffect: structuredMaterialsEffect,
          changesMaterials
        });
        setSuccess("Opción configurable creada exitosamente.");
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

  const filtered = options.filter((o) => {
    return (
      !search ||
      o.code.toLowerCase().includes(search.toLowerCase()) ||
      o.name.toLowerCase().includes(search.toLowerCase())
    );
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
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por código de opción o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-deep"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="bg-accent-deep hover:bg-accent-hover text-white text-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Opción Configurable</span>
          </Button>
        </div>
      </Card>

      {/* Grilla de Opciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400">
            No se encontraron opciones configurables registradas.
          </div>
        ) : (
          filtered.map((opt) => (
            <Card key={opt.id} className="p-5 border-stone-200 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">{opt.name}</h3>
                    <span className="font-mono text-xs text-stone-500 font-semibold">{opt.code}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {opt.is_required && (
                      <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
                        Obligatorio
                      </Badge>
                    )}
                    {opt.changes_materials ? (
                      <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0 flex items-center gap-1">
                        <Wrench className="w-2.5 h-2.5" />
                        <span>Afecta Insumos</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                        Solo Montaje
                      </Badge>
                    )}
                  </div>
                </div>

                {opt.description && (
                  <p className="text-xs text-stone-600 mb-3">{opt.description}</p>
                )}

                {/* Valores permitidos */}
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1">
                    Valores Disponibles:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(opt.allowed_values || []).map((v: any, idx: number) => (
                      <span
                        key={idx}
                        className="bg-stone-100 text-stone-800 text-[11px] px-2 py-0.5 rounded font-medium border border-stone-200"
                      >
                        {v.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
                <span className="text-[10px] text-stone-400">
                  {opt.product_id ? "Producto específico" : "Universal para bañeras"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(opt)}
                  className="h-7 px-2.5 text-xs text-stone-700 border-stone-300"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  <span>Configurar</span>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <Card className="w-full max-w-2xl p-6 bg-white border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h2 className="text-sm font-bold text-stone-900">
                {editingOption ? `Editar Opción (${editingOption.code})` : "Nueva Opción Configurable"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {!editingOption && (
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Código de Opción (Snake Case) *
                    </label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.toLowerCase())}
                      placeholder="ej: jets_count, motor_position"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-accent-deep outline-none"
                    />
                  </div>
                )}

                <div className={editingOption ? "col-span-2" : ""}>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Nombre Descriptivo de la Opción *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej: Cantidad de Jets, Lado del Motor"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Descripción Comercial / Ayuda
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instrucciones breves para el asesor comercial..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs focus:ring-2 focus:ring-accent-deep outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reqCheck"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded text-accent-deep focus:ring-accent-deep"
                />
                <label htmlFor="reqCheck" className="text-xs font-semibold text-stone-800">
                  Selección Obligatoria al confeccionar el presupuesto
                </label>
              </div>

              {/* Valores permitidos */}
              <div className="border border-stone-200 p-3.5 rounded-xl bg-stone-50/50">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Valores Permitidos
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAllowedValue}
                    className="text-xs h-7 px-2 border-stone-300"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Agregar Valor</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  {allowedValues.map((val, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-stone-200">
                      <input
                        type="text"
                        placeholder="Clave (ej: 6_jets)"
                        value={val.value}
                        onChange={(e) => {
                          const next = [...allowedValues];
                          next[idx].value = e.target.value.toLowerCase().replace(/\s+/g, '_');
                          setAllowedValues(next);
                        }}
                        className="w-1/3 px-2 py-1.5 border border-stone-200 rounded text-xs font-mono font-bold outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Etiqueta visible (ej: 6 Jets)"
                        value={val.label}
                        onChange={(e) => {
                          const next = [...allowedValues];
                          next[idx].label = e.target.value;
                          setAllowedValues(next);
                        }}
                        className="flex-1 px-2 py-1.5 border border-stone-200 rounded text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAllowedValue(idx)}
                        className="text-rose-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Efectos sobre materiales */}
              <div className="border border-amber-200 p-3.5 rounded-xl bg-amber-50/30">
                <div className="flex justify-between items-center mb-2.5">
                  <div>
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                      Efecto Estructurado sobre Insumos de Fabricación
                    </span>
                    <span className="text-[10px] text-amber-700">
                      Agrega, reemplaza o ajusta insumos según el valor elegido (sin fórmulas arbitrarias).
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMaterialEffect}
                    className="text-xs h-7 px-2 border-amber-300 bg-white"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Agregar Regla</span>
                  </Button>
                </div>

                {materialsEffects.length === 0 ? (
                  <p className="text-xs text-stone-500 italic py-2">
                    Esta opción actualmente solo genera instrucciones de montaje sin alterar la lista de materiales.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {materialsEffects.map((eff, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-amber-200">
                        <select
                          value={eff.ifValue}
                          onChange={(e) => {
                            const next = [...materialsEffects];
                            next[idx].ifValue = e.target.value;
                            setMaterialsEffects(next);
                          }}
                          className="w-1/4 px-2 py-1.5 border border-stone-200 rounded text-xs bg-white text-stone-800 outline-none"
                        >
                          {allowedValues.map((v, i) => (
                            <option key={i} value={v.value}>
                              Si es: {v.label || v.value}
                            </option>
                          ))}
                        </select>

                        <select
                          value={eff.action}
                          onChange={(e) => {
                            const next = [...materialsEffects];
                            next[idx].action = e.target.value as any;
                            setMaterialsEffects(next);
                          }}
                          className="w-1/4 px-2 py-1.5 border border-stone-200 rounded text-xs bg-white text-stone-800 outline-none"
                        >
                          <option value="add">Agregar insumo</option>
                          <option value="adjust">Ajustar cantidad</option>
                          <option value="replace">Reemplazar insumo</option>
                        </select>

                        <select
                          value={eff.supplyCode}
                          onChange={(e) => {
                            const next = [...materialsEffects];
                            next[idx].supplyCode = e.target.value;
                            const found = supplies.find(s => s.code === e.target.value);
                            if (found) next[idx].unitOfMeasure = found.unit_of_measure;
                            setMaterialsEffects(next);
                          }}
                          className="flex-1 px-2 py-1.5 border border-stone-200 rounded text-xs bg-white text-stone-800 outline-none font-mono"
                        >
                          {supplies.map((s) => (
                            <option key={s.id} value={s.code}>
                              [{s.code}] {s.name}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          step="0.01"
                          value={eff.quantity}
                          onChange={(e) => {
                            const next = [...materialsEffects];
                            next[idx].quantity = parseFloat(e.target.value) || 1;
                            setMaterialsEffects(next);
                          }}
                          className="w-20 px-2 py-1.5 border border-stone-200 rounded text-xs font-mono font-bold text-right outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveMaterialEffect(idx)}
                          className="text-rose-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  {loading ? "Guardando..." : editingOption ? "Actualizar Opción" : "Crear Opción"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
