"use client";

import { useState, useEffect, useMemo, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, DollarSign, Check, X, FileText, AlertCircle, ShieldAlert } from "lucide-react";
import { createBudget } from "@/lib/supabase/comercial";
import { calculateCommercialTotals, formatCurrencyARS } from "@/lib/commercial-calculations";

// Importar catálogo oficial unificado (fuente única compartida con el servidor)
import { getOfficialCatalog } from "@/lib/catalog-service";

interface Client {
  id: string;
  name: string;
  company_name: string | null;
}

interface BudgetItem {
  id: string; // ID temporal local
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  isManual?: boolean;
  manualPriceReason?: string;
}

interface NewBudgetClientProps {
  clients: Client[];
  initialClientId?: string;
  userId?: string;
}

export function NewBudgetClient({ clients, initialClientId, userId }: NewBudgetClientProps) {
  const router = useRouter();
  const creationRequest = useRef<{ payload: string; key: string } | null>(null);
  const storageKey = `fivesaint_draft_budget_${userId || "default"}`;

  const [clientId, setClientId] = useState(initialClientId || "");
  const [notes, setNotes] = useState("");
  const [publicNotes, setPublicNotes] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([]);

  // Descuentos en cascada
  const [discount1, setDiscount1] = useState<string>("");
  const [discount2, setDiscount2] = useState<string>("");
  const [discount3, setDiscount3] = useState<string>("");

  // Form para agregar ítem
  const [itemType, setItemType] = useState<"catalog" | "manual">("catalog");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProductKey, setSelectedProductKey] = useState("");

  // Custom manual item state
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Opciones de catálogo mapeadas
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<{ key: string; name: string; variantName?: string; price: number }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Helper para parsear precio de string (ej: "$ 3 199 000") a número (3199000)
  const parsePriceString = (priceStr: string | undefined): number => {
    if (!priceStr) return 0;
    if (priceStr.toLowerCase().includes("oferta")) return 0;
    const cleanStr = priceStr.replace(/[^0-9]/g, "");
    return Number(cleanStr) || 0;
  };

  // 1. Advertencia al abandonar cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (items.length > 0 || notes || publicNotes) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [items, notes, publicNotes]);

  // 2. Recuperar borrador seguro de sessionStorage (sin datos personales)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items) && parsed.items.length > 0 && items.length === 0) {
          setItems(parsed.items);
          if (parsed.publicNotes) setPublicNotes(parsed.publicNotes);
        }
      }
    } catch {
      // Ignorar fallas de parsing de storage
    }
  }, [storageKey]);

  // 3. Persistir borrador seguro (solo items y condiciones de venta, SIN PII)
  useEffect(() => {
    if (items.length > 0) {
      setHasUnsavedChanges(true);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({
          items,
          publicNotes
        }));
      } catch {
        // Ignorar límites de storage
      }
    } else {
      setHasUnsavedChanges(false);
    }
  }, [items, publicNotes, storageKey]);

  // Catálogo oficial unificado (única fuente de verdad compartida con el servidor)
  const officialCatalog = useMemo(() => getOfficialCatalog(), []);

  // Inicializar categorías de catálogo dinámicamente desde el catálogo oficial
  useEffect(() => {
    const cats = Array.from(new Set(officialCatalog.map((i) => i.category)));
    setCatalogCategories(cats);
    if (cats.length > 0 && !selectedCategory) {
      setSelectedCategory(cats[0]);
    }
  }, [officialCatalog, selectedCategory]);

  // Cargar productos de la categoría seleccionada
  useEffect(() => {
    if (!selectedCategory) return;
    const prods = officialCatalog
      .filter((item) => item.category === selectedCategory)
      .map((item) => ({
        key: item.key,
        name: item.name,
        variantName: item.variantName,
        price: item.price
      }));
    setCatalogProducts(prods);
    if (prods.length > 0) {
      setSelectedProductKey(prods[0].key);
    }
  }, [selectedCategory, officialCatalog]);

  const handleAddItem = () => {
    const qty = Math.max(1, Math.floor(quantity));

    if (itemType === "catalog") {
      const prod = catalogProducts.find((p) => p.key === selectedProductKey);
      if (!prod) return;

      const newItem: BudgetItem = {
        id: Math.random().toString(36).substring(7),
        productName: prod.name,
        variantName: prod.variantName,
        quantity: qty,
        unitPrice: prod.price,
        isManual: false
      };

      setItems((prev) => [...prev, newItem]);
    } else {
      if (!customName.trim()) {
        setError("El ítem manual debe tener una descripción válida.");
        return;
      }

      if (!customReason.trim() || customReason.trim().length < 3) {
        setError("Debe especificar un motivo explícito (mínimo 3 caracteres) para el ítem manual o excepción de precio.");
        return;
      }

      const numPrice = Number(customPrice);
      if (!Number.isFinite(numPrice) || numPrice < 0) {
        setError("El precio unitario del ítem manual debe ser un número válido mayor o igual a 0.");
        return;
      }

      const newItem: BudgetItem = {
        id: Math.random().toString(36).substring(7),
        productName: customName.trim(),
        quantity: qty,
        unitPrice: numPrice,
        isManual: true,
        manualPriceReason: customReason.trim()
      };

      setItems((prev) => [...prev, newItem]);
      setCustomName("");
      setCustomPrice("");
      setCustomReason("");
    }

    setQuantity(1);
    setError(null);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCreateBudget = async () => {
    if (!clientId) {
      setError("Tenés que seleccionar un cliente de la lista.");
      return;
    }
    if (items.length === 0) {
      setError("El presupuesto debe contener al menos un producto.");
      return;
    }

    // Validar descuentos
    const d1 = Number(discount1) || 0;
    const d2 = Number(discount2) || 0;
    const d3 = Number(discount3) || 0;

    for (const d of [d1, d2, d3]) {
      if (d < 0 || d > 100) {
        setError("Los porcentajes de descuento deben estar entre 0 y 100.");
        return;
      }
    }

    const validDiscounts = [d1, d2, d3].filter(d => d > 0);

    setLoading(true);
    setError(null);

    // Clave de idempotencia para evitar duplicaciones por doble clic
    const payload = JSON.stringify({ clientId, items, notes, publicNotes, discounts: validDiscounts });
    if (creationRequest.current?.payload !== payload) {
      creationRequest.current = { payload, key: crypto.randomUUID() };
    }
    const idempotencyKey = creationRequest.current.key;

    try {
      const budget = await createBudget(
        clientId,
        items.map(item => ({
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          isManual: item.isManual,
          manualPriceReason: item.manualPriceReason
        })),
        notes,
        validDiscounts,
        {
          publicNotes,
          idempotencyKey
        }
      );

      // Limpiar borrador temporal guardado
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // Ignorar
      }

      router.push(`/admin-comercial/presupuestos/${budget.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al registrar el presupuesto.");
      setLoading(false);
    }
  };

  // Cálculo unificado para la pantalla
  const activeDiscounts = [
    Number(discount1) || 0,
    Number(discount2) || 0,
    Number(discount3) || 0
  ].filter(d => d > 0 && d <= 100);

  const breakdown = calculateCommercialTotals(
    items.map(it => ({ quantity: it.quantity, unitPrice: it.unitPrice })),
    activeDiscounts,
    21.00
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Columna Izquierda: Información General y Agregar ítems */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card className="p-6 border-stone-200 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-stone-900">Información del Cliente</h2>
            {hasUnsavedChanges && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Borrador con cambios sin guardar
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700">Seleccionar Cliente *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850 bg-white text-sm"
              >
                <option value="">-- Elegí un cliente de la lista --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Condiciones comerciales destinadas al cliente */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                  Condiciones Comerciales (Visibles para el Cliente en el Presupuesto y PDF)
                </label>
                <span className="text-[10px] text-stone-400">Público para el cliente</span>
              </div>
              <textarea
                value={publicNotes}
                onChange={(e) => setPublicNotes(e.target.value)}
                placeholder="Ej. Tiempo estimado de entrega: 15 días hábiles. Forma de pago: 50% anticipo y saldo contra entrega. Garantía de fábrica por 5 años."
                rows={2}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-xs text-stone-800 focus:ring-1 focus:ring-accent-deep placeholder-stone-400"
              />
            </div>

            {/* Notas internas privadas */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                  Notas Internas de Gestión (Solo visibles para Vendedores y Fábrica)
                </label>
                <span className="text-[10px] text-stone-400">Confidencial interno</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Cliente consultó por flete a Rosario. Evaluar bonificación especial si confirma esta semana."
                rows={2}
                className="w-full px-3 py-2 border border-stone-250 bg-stone-50/60 rounded-md text-xs text-stone-700 focus:ring-1 focus:ring-stone-400 placeholder-stone-400"
              />
            </div>
          </div>
        </Card>

        {/* Sección de Selección de Ítems */}
        <Card className="p-6 border-stone-200 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Agregar Productos</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Elegí un modelo del catálogo oficial o cargá un ítem manual con trazabilidad.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => setItemType("catalog")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  itemType === "catalog"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Catálogo Oficial
              </button>
              <button
                type="button"
                onClick={() => setItemType("manual")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  itemType === "manual"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Ítem Manual / Medida Especial
              </button>
            </div>
          </div>

          {itemType === "catalog" ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4 flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-600">Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-800 bg-white"
                >
                  {catalogCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-5 flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-600">Modelo / Configuración</label>
                <select
                  value={selectedProductKey}
                  onChange={(e) => setSelectedProductKey(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-800 bg-white"
                >
                  {catalogProducts.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name} - {formatCurrencyARS(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1 flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-600">Cant.</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2 py-2 border border-stone-300 rounded text-xs text-center text-stone-800 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-accent-deep hover:bg-accent-hover text-white text-xs font-bold py-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4 flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-600">Descripción del Producto / Servicio</label>
                <input
                  type="text"
                  placeholder="Ej. Bañera a medida con faldón curvo reforzado"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-800 bg-white"
                />
              </div>

              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-600">Motivo de Excepción / Ítem Manual *</label>
                <input
                  type="text"
                  placeholder="Ej. Pedido especial por arquitecto"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-800 bg-white"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-600">Precio Neto ($)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Monto neto sin IVA"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-800 bg-white"
                />
              </div>

              <div className="md:col-span-1 flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-600">Cant.</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2 py-2 border border-stone-300 rounded text-xs text-center text-stone-800 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-accent-deep hover:bg-accent-hover text-white text-xs font-bold py-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          )}

          {/* Grilla de Ítems Agregados */}
          <div className="mt-6 border border-stone-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 font-bold text-stone-600 uppercase text-[10px]">
                  <th className="p-3">Producto</th>
                  <th className="p-3 text-right">Cant.</th>
                  <th className="p-3 text-right">P. Unitario</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-stone-400 italic">
                      Todavía no agregaste productos al presupuesto.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/50">
                      <td className="p-3 font-semibold text-stone-850">
                        <div className="flex items-center gap-1.5">
                          <span>{item.productName}</span>
                          {item.isManual && (
                            <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.2 font-medium">
                              Manual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right text-stone-700 font-bold">{item.quantity}</td>
                      <td className="p-3 text-right text-stone-600">{formatCurrencyARS(item.unitPrice)}</td>
                      <td className="p-3 text-right font-bold text-stone-900">
                        {formatCurrencyARS(item.quantity * item.unitPrice)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                          title="Eliminar ítem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Columna Derecha: Resumen de Totales y Emisión */}
      <div className="flex flex-col gap-6 lg:col-span-1">
        <Card className="p-6 border-stone-200 bg-white sticky top-6 shadow-md">
          <h2 className="text-lg font-bold text-stone-900 mb-4">Resumen de Cotización</h2>

          {error && (
            <div className="bg-red-50 text-red-650 border border-red-200 p-3.5 rounded-lg text-xs mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Descuentos en cascada */}
          <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-lg">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
              Descuentos en Cascada (% OFF)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Desc. 1</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="%"
                  value={discount1}
                  onChange={(e) => setDiscount1(e.target.value)}
                  className="w-full px-2 py-1.5 border border-stone-300 rounded text-center text-xs font-bold text-stone-800 bg-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Desc. 2</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="%"
                  value={discount2}
                  onChange={(e) => setDiscount2(e.target.value)}
                  className="w-full px-2 py-1.5 border border-stone-300 rounded text-center text-xs font-bold text-stone-800 bg-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Desc. 3</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="%"
                  value={discount3}
                  onChange={(e) => setDiscount3(e.target.value)}
                  className="w-full px-2 py-1.5 border border-stone-300 rounded text-center text-xs font-bold text-stone-800 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Desglose exacto de importes */}
          <div className="flex flex-col gap-2 border-t border-stone-200 pt-4 mb-6 text-xs">
            <div className="flex justify-between items-center text-stone-600">
              <span>Subtotal Bruto:</span>
              <span className="font-semibold">{formatCurrencyARS(breakdown.subtotal)}</span>
            </div>

            {breakdown.discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-700 font-semibold">
                <span>Descuento aplicado:</span>
                <span>-{formatCurrencyARS(breakdown.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-stone-850 font-bold border-t border-stone-100 pt-2">
              <span>Subtotal Neto:</span>
              <span>{formatCurrencyARS(breakdown.netTotal)}</span>
            </div>

            <div className="flex justify-between items-center text-stone-500 text-[11px]">
              <span>IVA Estimado ({breakdown.taxRate}%):</span>
              <span>+{formatCurrencyARS(breakdown.taxAmount)}</span>
            </div>

            <div className="flex justify-between items-baseline border-t-2 border-stone-200 pt-3 mt-1">
              <span className="text-sm font-black text-stone-900 uppercase">Total Final:</span>
              <span className="text-2xl font-black text-accent-deep">
                {formatCurrencyARS(breakdown.totalWithTax)}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 block text-right">
              Importe neto: {formatCurrencyARS(breakdown.netTotal)}
            </span>
          </div>

          <Button
            onClick={handleCreateBudget}
            disabled={loading || items.length === 0}
            className="w-full bg-accent-deep hover:bg-accent-hover text-white font-bold py-3 rounded-lg shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Generando presupuesto...</span>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Emitir Presupuesto</span>
              </>
            )}
          </Button>

          <p className="text-[10px] text-stone-400 text-center mt-3 leading-normal">
            Al emitir, se genera el presupuesto digital con identificador único, inmutable y listo para compartir con el cliente.
          </p>
        </Card>
      </div>
    </div>
  );
}
