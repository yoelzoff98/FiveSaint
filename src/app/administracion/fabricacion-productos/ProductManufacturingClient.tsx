"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProductCompositionAction,
  publishProductCompositionAction,
  createSupplyAction,
} from "@/lib/supabase/manufacturing";
import { ProductOptions } from "./ProductOptions";

type Product = { id: string; name: string; is_active: boolean };
type Variant = Product & { product_id: string };
export type Supply = {
  id: string;
  code: string;
  name: string;
  unit_of_measure: string;
  is_active: boolean;
};
type Line = { supplyId: string; quantity: number; notes: string };
type Recipe = {
  id: string;
  status: string;
  technical_notes: string | null;
  waste_percentage: number;
  items: { supply_id: string; quantity: number; notes: string | null }[];
};
type Composition = {
  product_id: string;
  variant_id: string | null;
  status: string;
};
const field = "w-full border border-stone-300 rounded-lg p-2 text-sm bg-white";

export function ProductManufacturingClient({
  products,
  variants,
  compositions,
  supplies: initialSupplies,
  productId,
  variantId,
  recipe,
  options,
}: {
  products: Product[];
  variants: Variant[];
  compositions: Composition[];
  supplies: Supply[];
  productId: string;
  variantId: string;
  recipe: Recipe | null;
  options: React.ComponentProps<typeof ProductOptions>["options"];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [supplies, setSupplies] = useState(initialSupplies);
  const [lines, setLines] = useState<Line[]>(
    recipe?.items.map((i) => ({
      supplyId: i.supply_id,
      quantity: i.quantity,
      notes: i.notes || "",
    })) || [],
  );
  const [notes, setNotes] = useState(recipe?.technical_notes || "");
  const [waste, setWaste] = useState(recipe?.waste_percentage || 0);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [unit, setUnit] = useState<
    "un" | "m" | "kg" | "l" | "m2" | "m3" | "g" | "cm"
  >("un");
  const [adding, setAdding] = useState(false);
  // Si una publicación falla, reintentar usa el mismo borrador y no crea otra receta.
  const [savedDraft, setSavedDraft] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const product = products.find((p) => p.id === productId);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function navigate(id: string, variant = "") {
    if (
      dirty &&
      !window.confirm("Tenés cambios sin guardar. ¿Salir de esta ficha?")
    )
      return;
    router.push(
      `/administracion/fabricacion-productos?product=${encodeURIComponent(id)}${variant ? `&variant=${encodeURIComponent(variant)}` : ""}`,
    );
  }
  function update(index: number, change: Partial<Line>) {
    setLines((previous) =>
      previous.map((line, i) => (i === index ? { ...line, ...change } : line)),
    );
    setDirty(true);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const content = JSON.stringify({ lines, notes, waste });
    try {
      let id = savedDraft?.content === content ? savedDraft.id : null;
      if (!id) {
        const draft = await createProductCompositionAction({
          productId,
          variantId: variantId || null,
          name: `Receta ${product?.name || "producto"}`.slice(0, 200),
          technicalNotes: notes,
          wastePercentage: waste,
          items: lines,
        });
        id = draft.id;
        setSavedDraft({ id: draft.id, content });
      }
      await publishProductCompositionAction(id!);
      setDirty(false);
      setMessage(
        "Receta guardada y lista para fabricar. Las órdenes anteriores conservan sus datos.",
      );
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar la receta.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-5">
      <section className="bg-white border rounded-xl p-4 space-y-3 self-start">
        <label className="block text-sm font-medium">
          Buscar producto
          <input
            className={`${field} mt-2`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre del producto"
          />
        </label>
        <div className="max-h-[60vh] overflow-auto space-y-1">
          {products
            .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
            .map((p) => (
              <button
                disabled={busy}
                type="button"
                key={p.id}
                onClick={() => navigate(p.id)}
                aria-pressed={productId === p.id}
                className={`block w-full text-left rounded-lg p-3 text-sm ${productId === p.id ? "bg-cyan-50 text-cyan-900 border border-cyan-300" : "hover:bg-stone-50"}`}
              >
                <span className="font-medium block">
                  {p.name}
                  {!p.is_active ? " (Inactivo)" : ""}
                </span>
                <span className="text-xs text-stone-500">
                  {compositions.some(
                    (c) => c.product_id === p.id && c.status === "published",
                  )
                    ? "Con receta"
                    : "Sin receta activa"}
                </span>
              </button>
            ))}
        </div>
      </section>
      {!product ? (
        <div className="bg-white border rounded-xl p-10 text-center text-stone-500">
          Seleccioná un producto para ver o completar su fabricación.
        </div>
      ) : (
        <section className="space-y-4 min-w-0">
          <form
            onSubmit={save}
            className="bg-white border rounded-xl p-5 space-y-5"
          >
            <div>
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-sm text-stone-500">
                Componentes necesarios para fabricar una unidad.
              </p>
            </div>
            {variants.some((v) => v.product_id === productId) && (
              <label className="block text-sm font-medium">
                Presentación del producto
                <select
                  disabled={busy}
                  value={variantId}
                  onChange={(e) => navigate(productId, e.target.value)}
                  className={`${field} mt-1`}
                >
                  <option value="">Receta base</option>
                  {variants
                    .filter((v) => v.product_id === productId)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                        {!v.is_active ? " (Inactiva)" : ""}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {!recipe && (
              <p className="bg-amber-50 p-3 rounded text-sm">
                Todavía no tiene una receta. Agregá los componentes y guardá
                para poder fabricar.
              </p>
            )}
            {recipe && (
              <p className="text-sm text-stone-500">
                {recipe.status === "published"
                  ? "Receta activa para fabricación."
                  : "Receta pendiente de guardar y activar."}{" "}
                Los cambios se aplican a nuevas órdenes.
              </p>
            )}
            {error && (
              <p role="alert" className="bg-red-50 text-red-800 p-3 rounded">
                {error}
              </p>
            )}
            {message && (
              <p
                role="status"
                className="bg-green-50 text-green-800 p-3 rounded"
              >
                {message}
              </p>
            )}
            <fieldset disabled={busy} className="space-y-3">
              <legend className="font-semibold mb-3">
                ¿Qué lleva este producto?
              </legend>
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="grid sm:grid-cols-[1fr_100px_auto] gap-2 border-b pb-3"
                >
                  <label className="text-xs text-stone-600">
                    Componente
                    <select
                      required
                      className={`${field} mt-1`}
                      value={line.supplyId}
                      onChange={(e) =>
                        update(index, { supplyId: e.target.value })
                      }
                    >
                      <option value="">Seleccionar componente</option>
                      {supplies
                        .filter((s) => s.is_active || s.id === line.supplyId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.unit_of_measure})
                            {!s.is_active ? " — Inactivo" : ""}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="text-xs text-stone-600">
                    Cantidad
                    <input
                      required
                      type="number"
                      min="0.000001"
                      max="100000"
                      step="any"
                      className={`${field} mt-1`}
                      value={line.quantity}
                      onChange={(e) =>
                        update(index, { quantity: e.target.valueAsNumber })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    aria-label={`Quitar componente ${index + 1}`}
                    className="text-red-700 text-sm self-end p-2"
                    onClick={() => {
                      setLines((previous) =>
                        previous.filter((_, i) => i !== index),
                      );
                      setDirty(true);
                    }}
                  >
                    Quitar
                  </button>
                  <label className="text-xs text-stone-600 sm:col-span-3">
                    Indicación para este componente (opcional)
                    <input
                      maxLength={300}
                      className={`${field} mt-1`}
                      value={line.notes}
                      onChange={(e) => update(index, { notes: e.target.value })}
                    />
                  </label>
                </div>
              ))}
              <button
                type="button"
                className="border rounded-lg px-3 py-2 text-sm"
                onClick={() => {
                  setLines((previous) => [
                    ...previous,
                    { supplyId: "", quantity: 1, notes: "" },
                  ]);
                  setDirty(true);
                }}
              >
                + Agregar componente
              </button>
              <label className="block font-medium text-sm pt-3">
                Instrucciones para fábrica
                <textarea
                  maxLength={2000}
                  rows={4}
                  className={`${field} mt-1`}
                  placeholder="Indicaciones de armado, montaje o terminación…"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setDirty(true);
                  }}
                />
              </label>
              <details className="text-sm">
                <summary className="cursor-pointer text-stone-500">
                  Merma de materiales (opcional)
                </summary>
                <label className="block mt-2">
                  Porcentaje adicional de material
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={waste}
                    onChange={(e) => {
                      setWaste(e.target.valueAsNumber);
                      setDirty(true);
                    }}
                    className={field}
                  />
                </label>
              </details>
            </fieldset>
            <button
              disabled={busy || adding || !lines.length}
              className="bg-cyan-700 text-white rounded-lg px-5 py-2 disabled:opacity-50"
            >
              {busy ? "Guardando…" : "Guardar receta"}
            </button>
          </form>
          <details className="bg-white border rounded-xl p-4">
            <summary className="cursor-pointer font-medium">
              ¿Falta un componente? Crearlo aquí
            </summary>
            <form
              className="mt-3 flex flex-wrap gap-3 items-end"
              onSubmit={async (e) => {
                e.preventDefault();
                setAdding(true);
                setError("");
                try {
                  const supply = await createSupplyAction({
                    name: newName,
                    code: `MAT-${crypto.randomUUID().slice(0, 12)}`,
                    unitOfMeasure: unit,
                  });
                  setSupplies((previous) => [...previous, supply]);
                  setLines((previous) => [
                    ...previous,
                    { supplyId: supply.id, quantity: 1, notes: "" },
                  ]);
                  setDirty(true);
                  setNewName("");
                } catch (cause) {
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "No se pudo crear el componente.",
                  );
                } finally {
                  setAdding(false);
                }
              }}
            >
              <label className="flex-1 text-sm">
                Nombre
                <input
                  required
                  minLength={2}
                  maxLength={200}
                  className={field}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </label>
              <label className="text-sm">
                Unidad
                <select
                  className={field}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as typeof unit)}
                >
                  {["un", "m", "kg", "l", "m2", "m3", "g", "cm"].map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </label>
              <button
                disabled={adding || busy}
                className="border rounded-lg p-2 text-sm"
              >
                {adding ? "Creando…" : "Crear y agregar"}
              </button>
            </form>
          </details>
          <ProductOptions
            key={JSON.stringify(options)}
            productId={productId}
            options={options}
            supplies={supplies}
          />
        </section>
      )}
    </div>
  );
}
