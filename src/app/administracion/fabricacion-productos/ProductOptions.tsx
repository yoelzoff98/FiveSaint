"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createConfigurableOptionAction,
  updateConfigurableOptionAction,
} from "@/lib/supabase/manufacturing";
import type { Supply } from "./ProductManufacturingClient";

type Effect = {
  action: "add" | "replace" | "adjust";
  supplyCode: string;
  supplyName?: string;
  quantity: number;
  unitOfMeasure?: string;
  targetSupplyCode?: string;
};
type Choice = { value: string; label: string };
type Option = {
  id: string;
  product_id: string | null;
  code: string;
  name: string;
  description: string | null;
  is_required: boolean;
  default_value: string | null;
  allowed_values: Choice[];
  manufacturing_instructions: Record<string, string>;
  materials_effect: { ifValue: string; effects: Effect[] }[];
  compatibility_rules: unknown[];
  is_active: boolean;
  sort_order: number;
};
const field = "w-full border border-stone-300 rounded-lg p-2 text-sm bg-white";

export function ProductOptions({
  productId,
  options,
  supplies,
}: {
  productId: string;
  options: Option[];
  supplies: Supply[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Option | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [required, setRequired] = useState(false);
  const [choices, setChoices] = useState<
    (Choice & { instruction: string; effects: Effect[] })[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  function edit(option: Option | null) {
    setEditing(option);
    setName(option?.name || "");
    setRequired(option?.is_required || false);
    setError("");
    setMessage("");
    setChoices(
      option
        ? option.allowed_values.map((v) => ({
            ...v,
            instruction: option.manufacturing_instructions?.[v.value] || "",
            effects:
              option.materials_effect?.find((e) => e.ifValue === v.value)
                ?.effects || [],
          }))
        : [
            {
              value: `valor_${crypto.randomUUID().slice(0, 8)}`,
              label: "",
              instruction: "",
              effects: [],
            },
          ],
    );
  }
  function update(index: number, change: Partial<(typeof choices)[number]>) {
    setChoices((previous) =>
      previous.map((v, i) => (i === index ? { ...v, ...change } : v)),
    );
  }
  return (
    <details className="bg-white border rounded-xl p-4">
      <summary className="cursor-pointer font-medium">
        Opciones que puede elegir el cliente{" "}
        <span className="text-stone-500 font-normal">(opcional)</span>
      </summary>
      <p className="text-sm text-stone-500 my-3">
        Por ejemplo: lado del motor o cantidad de jets. Indicá qué cambia en la
        fabricación con cada elección.
      </p>
      {error && (
        <p role="alert" className="text-red-800 bg-red-50 p-3 rounded">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-green-800 bg-green-50 p-3 rounded">
          {message}
        </p>
      )}
      <div className="divide-y">
        {options.map((option) => (
          <div
            key={option.id}
            className="flex justify-between gap-3 py-3 text-sm"
          >
            <div>
              <strong>{option.name}</strong>
              <p className="text-stone-500">
                {option.allowed_values.map((v) => v.label).join(" · ")}
                {!option.is_active ? " — Inactiva" : ""}
              </p>
              {!option.product_id && (
                <p className="text-xs text-stone-500">
                  Compartida por todos los productos
                </p>
              )}
            </div>
            <button
              disabled={busy}
              type="button"
              className="underline"
              onClick={() => {
                if (
                  editing !== undefined &&
                  !window.confirm(
                    "¿Descartar los cambios de la opción que estás editando?",
                  )
                )
                  return;
                edit(option);
              }}
            >
              Editar
            </button>
          </div>
        ))}
      </div>
      {editing === undefined ? (
        <button
          className="border rounded-lg p-2 text-sm mt-2"
          type="button"
          onClick={() => edit(null)}
        >
          + Agregar opción
        </button>
      ) : (
        <form
          className="mt-4 border-t pt-4 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              !editing?.product_id &&
              editing &&
              !window.confirm(
                "Esta opción se comparte con todos los productos. ¿Guardar el cambio para todos?",
              )
            )
              return;
            setBusy(true);
            setError("");
            try {
              const input = {
                productId: editing ? editing.product_id : productId,
                code:
                  editing?.code ||
                  `opcion_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`,
                name,
                description: editing?.description || null,
                isRequired: required,
                defaultValue: editing?.default_value || null,
                allowedValues: choices.map(({ value, label }) => ({
                  value,
                  label,
                })),
                manufacturingInstructions: {
                  ...editing?.manufacturing_instructions,
                  ...Object.fromEntries(
                    choices.map((c) => [c.value, c.instruction]),
                  ),
                },
                materialsEffect: choices
                  .filter((c) => c.effects.length)
                  .map((c) => ({ ifValue: c.value, effects: c.effects })),
                compatibilityRules: editing?.compatibility_rules || [],
                isActive: editing?.is_active ?? true,
                sortOrder: editing?.sort_order || 0,
              };
              if (editing)
                await updateConfigurableOptionAction(editing.id, input);
              else await createConfigurableOptionAction(input);
              setEditing(undefined);
              setMessage("Opción guardada.");
              router.refresh();
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "No se pudo guardar la opción.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy} className="space-y-4">
            <label className="block text-sm">
              Nombre de la opción
              <input
                required
                minLength={2}
                maxLength={150}
                className={field}
                placeholder="Ej.: Lado del motor"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
              />
              El vendedor debe elegir una respuesta
            </label>
            {choices.map((choice, index) => (
              <div
                key={choice.value}
                className="bg-stone-50 border rounded-lg p-3 space-y-2"
              >
                <label className="block text-sm">
                  Respuesta {index + 1}
                  <input
                    required
                    maxLength={100}
                    className={field}
                    placeholder="Ej.: A la derecha"
                    value={choice.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Indicación para fábrica
                  <input
                    className={field}
                    placeholder="Ej.: Montar el motor a la derecha"
                    value={choice.instruction}
                    onChange={(e) =>
                      update(index, { instruction: e.target.value })
                    }
                  />
                </label>
                <details className="text-sm">
                  <summary className="cursor-pointer">
                    Componentes que cambian con esta respuesta (
                    {choice.effects.length})
                  </summary>
                  {choice.effects.map((effect, i) => (
                    <div
                      key={i}
                      className="grid sm:grid-cols-2 gap-2 border-t mt-3 pt-3"
                    >
                      <label>
                        Qué cambia
                        <select
                          className={field}
                          value={effect.action}
                          onChange={(e) =>
                            update(index, {
                              effects: choice.effects.map((v, j) =>
                                j === i
                                  ? {
                                      ...v,
                                      action: e.target
                                        .value as Effect["action"],
                                    }
                                  : v,
                              ),
                            })
                          }
                        >
                          <option value="add">Agregar</option>
                          <option value="adjust">
                            Sumar cantidad a un componente existente
                          </option>
                          <option value="replace">Reemplazar</option>
                        </select>
                      </label>
                      <label>
                        Componente
                        <select
                          required
                          className={field}
                          value={effect.supplyCode}
                          onChange={(e) => {
                            const supply = supplies.find(
                              (s) => s.code === e.target.value,
                            );
                            update(index, {
                              effects: choice.effects.map((v, j) =>
                                j === i
                                  ? {
                                      ...v,
                                      supplyCode: e.target.value,
                                      supplyName: supply?.name,
                                      unitOfMeasure: supply?.unit_of_measure,
                                    }
                                  : v,
                              ),
                            });
                          }}
                        >
                          <option value="">Elegir componente</option>
                          {supplies
                            .filter(
                              (s) =>
                                s.is_active || s.code === effect.supplyCode,
                            )
                            .map((s) => (
                              <option key={s.code} value={s.code}>
                                {s.name} ({s.unit_of_measure})
                              </option>
                            ))}
                        </select>
                      </label>
                      {effect.action === "replace" && (
                        <label>
                          Componente a reemplazar
                          <select
                            required
                            className={field}
                            value={effect.targetSupplyCode || ""}
                            onChange={(e) =>
                              update(index, {
                                effects: choice.effects.map((v, j) =>
                                  j === i
                                    ? { ...v, targetSupplyCode: e.target.value }
                                    : v,
                                ),
                              })
                            }
                          >
                            <option value="">Elegir componente</option>
                            {supplies.map((s) => (
                              <option key={s.code} value={s.code}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      <label>
                        Cantidad
                        <input
                          required
                          type="number"
                          min="0.000001"
                          step="any"
                          className={field}
                          value={effect.quantity}
                          onChange={(e) =>
                            update(index, {
                              effects: choice.effects.map((v, j) =>
                                j === i
                                  ? { ...v, quantity: e.target.valueAsNumber }
                                  : v,
                              ),
                            })
                          }
                        />
                      </label>
                      <button
                        className="text-red-700 text-sm text-left"
                        type="button"
                        onClick={() =>
                          update(index, {
                            effects: choice.effects.filter((_, j) => j !== i),
                          })
                        }
                      >
                        Quitar cambio de componente
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="underline mt-2"
                    onClick={() =>
                      update(index, {
                        effects: [
                          ...choice.effects,
                          { action: "add", supplyCode: "", quantity: 1 },
                        ],
                      })
                    }
                  >
                    + Agregar cambio de componente
                  </button>
                </details>
              </div>
            ))}
            <button
              type="button"
              className="underline text-sm"
              onClick={() =>
                setChoices((previous) => [
                  ...previous,
                  {
                    value: `valor_${crypto.randomUUID().slice(0, 8)}`,
                    label: "",
                    instruction: "",
                    effects: [],
                  },
                ])
              }
            >
              + Agregar respuesta
            </button>
          </fieldset>
          <div className="flex gap-3">
            <button
              disabled={busy}
              className="bg-cyan-700 text-white p-2 rounded-lg text-sm"
            >
              {busy ? "Guardando…" : "Guardar opción"}
            </button>
            <button
              disabled={busy}
              type="button"
              className="text-sm underline"
              onClick={() => setEditing(undefined)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </details>
  );
}
