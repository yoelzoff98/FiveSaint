"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, DollarSign, Check, X, FileText } from "lucide-react";
import { createBudget } from "@/lib/supabase/comercial";

// Importar datos de precios oficiales
import { 
  banerasPremiumData, 
  banerasData, 
  equipamientosData, 
  ofertasData, 
  spaDataPage1, 
  spaDataPage2, 
  spaOpcionalesData,
  platosDuchaData, 
  columnasDuchaData, 
  duchaEscocesaData 
} from "@/config/price-list-data";

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
}

interface NewBudgetClientProps {
  clients: Client[];
  initialClientId?: string;
}

export function NewBudgetClient({ clients, initialClientId }: NewBudgetClientProps) {
  const router = useRouter();
  const [clientId, setClientId] = useState(initialClientId || "");
  const [notes, setNotes] = useState("");
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
  const [quantity, setQuantity] = useState(1);

  // Opciones de catálogo mapeadas
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<{ key: string; name: string; price: number }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auxiliar para parsear precio de string (ej: "$ 3 199 000") a número (3199000)
  const parsePriceString = (priceStr: string | undefined): number => {
    if (!priceStr) return 0;
    if (priceStr.toLowerCase().includes("oferta")) return 0;
    const cleanStr = priceStr.replace(/[^0-9]/g, "");
    return Number(cleanStr) || 0;
  };

  // Inicializar categorías de catálogo
  useEffect(() => {
    setCatalogCategories([
      "Bañeras Premium",
      "Bañeras Standard",
      "Cascos (Bañeras sin jets)",
      "Equipamiento Opcional",
      "Opcionales Spas / Minipiscinas",
      "Ofertas Especiales",
      "Spas / Hidromasajes",
      "Platos de Ducha",
      "Columnas de Ducha",
      "Ducha Escocesa"
    ]);
    setSelectedCategory("Bañeras Premium");
  }, []);

  // Cargar productos de la categoría seleccionada
  useEffect(() => {
    let prods: { key: string; name: string; price: number }[] = [];

    switch (selectedCategory) {
      case "Bañeras Premium":
        banerasPremiumData.forEach((bp) => {
          prods.push({
            key: `premium-confort-${bp.name}-${bp.medidas}`,
            name: `Bañera Premium ${bp.name} (${bp.medidas}) - Confort`,
            price: parsePriceString(bp.confortPrice)
          });
          prods.push({
            key: `premium-confortplus-${bp.name}-${bp.medidas}`,
            name: `Bañera Premium ${bp.name} (${bp.medidas}) - Confort Plus`,
            price: parsePriceString(bp.confortPlusPrice)
          });
        });
        break;

      case "Cascos (Bañeras sin jets)":
        banerasData.products.forEach((bp) => {
          if (bp.cascos) {
            prods.push({
              key: `casco-only-${bp.name}-${bp.medidas}`,
              name: `Bañera ${bp.name} (${bp.medidas}) - Casco (Sin Jets)`,
              price: parsePriceString(bp.cascos)
            });
          }
        });
        break;

      case "Bañeras Standard":
        banerasData.products.forEach((bp) => {
          if (bp.cascos) {
            prods.push({
              key: `std-casco-${bp.name}-${bp.medidas}`,
              name: `Bañera ${bp.name} (${bp.medidas}) - Casco`,
              price: parsePriceString(bp.cascos)
            });
          }
          if (bp.jet4) {
            prods.push({
              key: `std-jet4-${bp.name}-${bp.medidas}`,
              name: `Bañera ${bp.name} (${bp.medidas}) - 4 Jets`,
              price: parsePriceString(bp.jet4)
            });
          }
          if (bp.jet6) {
            prods.push({
              key: `std-jet6-${bp.name}-${bp.medidas}`,
              name: `Bañera ${bp.name} (${bp.medidas}) - 6 Jets`,
              price: parsePriceString(bp.jet6)
            });
          }
          if (bp.jet8) {
            prods.push({
              key: `std-jet8-${bp.name}-${bp.medidas}`,
              name: `Bañera ${bp.name} (${bp.medidas}) - 8 Jets`,
              price: parsePriceString(bp.jet8)
            });
          }
        });
        break;

      case "Equipamiento Opcional":
        equipamientosData.forEach((eq) => {
          prods.push({
            key: `equip-${eq.codigo}`,
            name: `Equipamiento: ${eq.nombre} (${eq.codigo})`,
            price: parsePriceString(eq.precio)
          });
        });
        spaOpcionalesData.forEach((op) => {
          prods.push({
            key: `equip-spa-${op.code}`,
            name: `Equipamiento Spa: ${op.name} (${op.code})`,
            price: parsePriceString(op.price)
          });
        });
        break;

      case "Opcionales Spas / Minipiscinas":
        spaOpcionalesData.forEach((op) => {
          prods.push({
            key: `spa-opcion-${op.code}`,
            name: `Opcional Spa / Minipiscina: ${op.name} (${op.code})`,
            price: parsePriceString(op.price)
          });
        });
        break;

      case "Ofertas Especiales":
        ofertasData.forEach((o) => {
          prods.push({
            key: `oferta-${o.code}`,
            name: `Oferta ${o.name} (${o.medidas}) - ${o.jetLabel}`,
            price: parsePriceString(o.precio)
          });
        });
        break;

      case "Spas / Hidromasajes":
        const spas = [...spaDataPage1, ...spaDataPage2];
        spas.forEach((s) => {
          s.prices.forEach((p, idx) => {
            const version = s.columns && s.columns[idx] ? s.columns[idx] : "Estándar";
            prods.push({
              key: `spa-${s.name}-${p.code}`,
              name: `Spa ${s.name} - Versión ${version}`,
              price: parsePriceString(p.price)
            });
          });
        });
        spaOpcionalesData.forEach((op) => {
          prods.push({
            key: `spa-opcion-comb-${op.code}`,
            name: `Opcional Spa / Minipiscina: ${op.name} (${op.code})`,
            price: parsePriceString(op.price)
          });
        });
        break;

      case "Platos de Ducha":
        platosDuchaData.forEach((cat) => {
          cat.items.forEach((item) => {
            prods.push({
              key: `plato-${item.code}`,
              name: `Plato Ducha ${cat.title} (${item.largo}x${item.ancho}x${item.altura}cm)`,
              price: parsePriceString(item.price)
            });
          });
        });
        // Opcional / Adicional de Desagüe para Platos de Ducha
        prods.push({
          key: "opcional-plato-desague-fse131",
          name: "Opcional Plato de Ducha: Desagüe (FSE131)",
          price: 28000
        });
        break;

      case "Columnas de Ducha":
        columnasDuchaData.forEach((col) => {
          prods.push({
            key: `columna-${col.code}`,
            name: `Columna Ducha ${col.name} - ${col.description}`,
            price: parsePriceString(col.price)
          });
        });
        break;

      case "Ducha Escocesa":
        duchaEscocesaData.models.forEach((m) => {
          prods.push({
            key: `escocesa-${m.code}`,
            name: `Ducha Escocesa: ${m.name}`,
            price: parsePriceString(m.price)
          });
        });
        break;
    }

    setCatalogProducts(prods);
    if (prods.length > 0) {
      setSelectedProductKey(prods[0].key);
    } else {
      setSelectedProductKey("");
    }
  }, [selectedCategory]);

  const handleAddItem = () => {
    if (itemType === "catalog") {
      const prod = catalogProducts.find((p) => p.key === selectedProductKey);
      if (!prod) return;

      const newItem: BudgetItem = {
        id: Math.random().toString(36).substring(7),
        productName: prod.name,
        quantity: quantity,
        unitPrice: prod.price
      };

      setItems((prev) => [...prev, newItem]);
    } else {
      if (!customName.trim() || !customPrice) return;

      const newItem: BudgetItem = {
        id: Math.random().toString(36).substring(7),
        productName: customName,
        quantity: quantity,
        unitPrice: Math.max(0, Number(customPrice) || 0)
      };

      setItems((prev) => [...prev, newItem]);
      setCustomName("");
      setCustomPrice("");
    }

    setQuantity(1);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCreateBudget = async () => {
    if (!clientId) {
      setError("Tenés que seleccionar un cliente.");
      return;
    }
    if (items.length === 0) {
      setError("El presupuesto debe contener al menos un producto.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validDiscounts = [
        Number(discount1) || 0,
        Number(discount2) || 0,
        Number(discount3) || 0
      ].filter(d => d > 0);

      const budget = await createBudget(
        clientId,
        items.map(item => ({
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        notes,
        validDiscounts
      );

      window.location.href = `/admin-comercial/presupuestos/${budget.id}`;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al registrar el presupuesto.");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  // Cálculo en cascada para la vista previa
  let totalAmount = subtotal;
  const activeDiscounts = [
    Number(discount1) || 0,
    Number(discount2) || 0,
    Number(discount3) || 0
  ].filter(d => d > 0);

  activeDiscounts.forEach(d => {
    totalAmount = totalAmount * (1 - d / 100);
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Columna Izquierda: Información General y Agregar ítems */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card className="p-6 border-stone-200 bg-white">
          <h2 className="text-lg font-bold text-stone-900 mb-4">Información del Cliente</h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700">Seleccionar Cliente *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850 bg-white"
              >
                <option value="">-- Elegí un cliente de la lista --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700">Notas / Comentarios del presupuesto</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800"
                placeholder="Anotar formas de pago acordadas, plazos de entrega, etc..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-700">Descuentos en cascada (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Desc. 1"
                  value={discount1}
                  onChange={(e) => setDiscount1(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800 text-sm"
                />
                <span className="text-stone-400 text-sm font-bold">%</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Desc. 2"
                  value={discount2}
                  onChange={(e) => setDiscount2(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800 text-sm"
                />
                <span className="text-stone-400 text-sm font-bold">%</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Desc. 3"
                  value={discount3}
                  onChange={(e) => setDiscount3(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800 text-sm"
                />
                <span className="text-stone-400 text-sm font-bold">%</span>
              </div>
              <p className="text-xs text-stone-500">Ej: 10, 10, 5. Se aplican uno sobre otro.</p>
            </div>
          </div>
        </Card>

        {/* Cargar Ítem */}
        <Card className="p-6 border-stone-200 bg-white">
          <h2 className="text-lg font-bold text-stone-900 mb-4">Añadir Producto a Cotizar</h2>

          <div className="flex bg-stone-100 p-1.5 rounded-lg mb-6 w-max">
            <button
              onClick={() => setItemType("catalog")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                itemType === "catalog" ? "bg-stone-900 text-white" : "text-stone-600"
              }`}
            >
              Seleccionar del Catálogo
            </button>
            <button
              onClick={() => setItemType("manual")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                itemType === "manual" ? "bg-stone-900 text-white" : "text-stone-600"
              }`}
            >
              Carga Personalizada / Manual
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {itemType === "catalog" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-600">Categoría</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800 text-sm bg-white cursor-pointer"
                  >
                    {catalogCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-stone-600">Producto y Precio Oficial</label>
                  <select
                    value={selectedProductKey}
                    onChange={(e) => setSelectedProductKey(e.target.value)}
                    className="px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-800 text-sm bg-white cursor-pointer w-full"
                  >
                    {catalogProducts.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.name} - {formatCurrency(p.price)}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-stone-600">Nombre del Producto / Concepto</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ej. Bañera Romana Especial Con Grifería"
                    className="px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850 text-sm bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-600">Precio Unitario ($)</label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="1500000"
                    className="px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850 text-sm bg-white"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-600">Cantidad</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep text-stone-850 text-sm bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="button"
                onClick={handleAddItem}
                className="flex items-center justify-center gap-2 cursor-pointer w-full bg-stone-900 hover:bg-stone-800 text-white"
              >
                <Plus className="w-4 h-4" />
                Agregar Producto
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Columna Derecha: Resumen de Cotización */}
      <div className="flex flex-col gap-6 lg:col-span-1">
        <Card className="p-6 border-stone-200 bg-white sticky top-6 shadow-md">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-stone-500" />
            Resumen de Cotización
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {/* Listado de ítems cargados */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm italic">
              No hay productos agregados en el presupuesto.
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-4 p-2.5 bg-stone-50 rounded-lg border border-stone-150 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-900 truncate" title={item.productName}>
                      {item.productName}
                    </div>
                    <div className="text-stone-500 font-medium mt-0.5">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-950">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-stone-400 hover:text-red-650 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <hr className="border-stone-200 my-4" />

          {/* Totales */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-550 font-medium">Subtotal Bruto:</span>
              <span className="text-stone-900 font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            
            {activeDiscounts.length > 0 && (
              <div className="flex justify-between items-center text-sm text-green-700 bg-green-50 p-2 rounded border border-green-100">
                <span className="font-medium">Descuentos ({activeDiscounts.join("% + ")}%):</span>
                <span className="font-bold">-{formatCurrency(subtotal - totalAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-base mt-2">
              <span className="text-stone-900 font-bold">Total Estimado:</span>
              <span className="text-accent-deep text-lg font-bold">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <hr className="border-stone-250 my-4" />

          <Button
            onClick={handleCreateBudget}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 cursor-pointer h-12 text-sm font-semibold"
          >
            <Check className="w-5 h-5" />
            {loading ? "Registrando..." : "Guardar Presupuesto"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
