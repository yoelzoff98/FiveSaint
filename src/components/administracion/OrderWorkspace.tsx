"use client";

import { ProductManufacturingClient } from "@/app/administracion/fabricacion-productos/ProductManufacturingClient";
import { getOrderMaterialsEditor } from "@/lib/supabase/manufacturing";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Factory,
  Printer,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import {
  getOrderWorkflow,
  emitOrderFromWorkspace,
} from "@/lib/supabase/order-workflow";
import { decideOrderRequest } from "@/lib/supabase/order-requests";
import { cancelOrder, updateOrderStatus } from "@/lib/supabase/comercial";
import { matchingRecipes, type WorkflowData } from "@/lib/order-workflow";
import { formatCurrencyARS } from "@/lib/commercial-calculations";

const field =
  "w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm";
export function OrderWorkspace({ data: initialData }: { data: WorkflowData }) {
  const [materials, setMaterials] = useState<WorkflowData["recipes"] | null>(
    null,
  );
  const data = materials ? { ...initialData, recipes: materials } : initialData;
  const [editor, setEditor] = useState<Awaited<
    ReturnType<typeof getOrderMaterialsEditor>
  > | null>(null);
  useEffect(() => {
    if (editor) document.getElementById("order-materials-editor")?.focus();
  }, [editor]);
  async function refreshMaterials() {
    const fresh = await getOrderWorkflow({
      orderId: data.orderId,
      requestId: data.requestId,
    });
    setMaterials(fresh.recipes);
    setLines((current) =>
      current.map((line) => ({
        ...line,
        bomId:
          matchingRecipes(fresh.recipes, line.productId, line.variantId).sort(
            (a, b) => b.version - a.version,
          )[0]?.id || "",
      })),
    );
    setConfirmed(false);
    setEditor(null);
  }
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [primary, setPrimary] = useState(
    data.lines.length === 1 ? data.lines[0].id : "",
  );
  const [lines, setLines] = useState(() =>
    data.lines.map((line) => ({
      id: line.id,
      productId: line.product_id || "",
      variantId: line.variant_id,
      bomId:
        matchingRecipes(
          data.recipes,
          line.product_id || "",
          line.variant_id,
        ).sort((a, b) => b.version - a.version)[0]?.id || "",
      quantity: line.quantity,
      configuration: line.configuration,
    })),
  );
  const intent = useRef<{ payload: string; key: string } | null>(null);
  const closed = data.requestId
    ? data.status !== "pending"
    : !["pending", "processing"].includes(data.status);
  const missing = lines.flatMap((line) => {
    const name = data.lines.find((i) => i.id === line.id)!.product_name;
    if (!line.productId) return [`Identificá el producto técnico de ${name}.`];
    const choices = matchingRecipes(
      data.recipes,
      line.productId,
      line.variantId,
    );
    if (!choices.length) return [`Falta cargar los materiales de ${name}.`];
    if (!choices.some((r) => r.id === line.bomId))
      return [`Revisá los materiales de ${name}.`];
    return [];
  });
  function update(id: string, changes: Partial<(typeof lines)[number]>) {
    setConfirmed(false);
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...changes } : line)),
    );
  }
  function execute(task: () => Promise<void>) {
    setError("");
    startTransition(async () => {
      try {
        await task();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "No se pudo completar la operación.",
        );
      }
    });
  }
  function emit() {
    execute(async () => {
      const payload = {
        orderId: data.orderId,
        requestId: data.requestId,
        primaryId: primary,
        lines,
        notes,
      };
      const serialized = JSON.stringify(payload);
      if (intent.current?.payload !== serialized)
        intent.current = { payload: serialized, key: crypto.randomUUID() };
      const result = await emitOrderFromWorkspace({
        ...payload,
        key: intent.current.key,
      });
      router.push(`/administracion/fabricacion/${result.manufacturingOrderId}`);
    });
  }
  function decide(decision: "approved" | "returned" | "rejected") {
    execute(async () => {
      const result = await decideOrderRequest(
        data.requestId!,
        decision,
        reason,
      );
      router.push(
        result.order_id
          ? `/administracion/pedidos/${result.order_id}`
          : "/administracion/solicitudes",
      );
    });
  }
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link
        href="/administracion/pedidos"
        className="inline-flex items-center gap-2 text-sm text-stone-600"
      >
        <ArrowLeft size={16} /> Volver a pedidos
      </Link>
      <header className="bg-white border rounded-2xl p-6 space-y-3">
        <div className="flex flex-wrap justify-between gap-3">
          <h1 className="text-2xl font-bold">
            {data.requestId
              ? `Solicitud · Presupuesto #${data.budgetNumber}`
              : `Pedido #${data.orderNumber}`}
          </h1>
          <span className="rounded-full bg-sky-50 text-sky-800 px-3 py-1 text-sm">
            {closed
              ? (
                  {
                    delivered: "Entregado",
                    cancelled: "Cancelado",
                    rejected: "Rechazada",
                    returned: "Devuelta al vendedor",
                  } as Record<string, string>
                )[data.status] || "Cerrado"
              : data.requestId
                ? "Pendiente de aceptación"
                : data.documents.length
                  ? "OF emitida"
                  : "Aceptado · en preparación"}
          </span>
        </div>
        <p>
          <strong>{data.clientName}</strong> · Asesor: {data.sellerName}
        </p>
        {data.clientContact && (
          <p className="text-sm break-words">{data.clientContact}</p>
        )}
        {data.acceptedAt && (
          <p className="text-xs text-stone-500">
            Aceptado:{" "}
            {new Date(data.acceptedAt).toLocaleString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
            })}
            {data.acceptedBy ? ` · ${data.acceptedBy}` : ""}
          </p>
        )}
        <p className="text-sm text-stone-500">
          Presupuesto #{data.budgetNumber} ·{" "}
          {data.requestId
            ? "Neto del presupuesto completo"
            : "Importe del pedido"}
          : {formatCurrencyARS(data.total)}
        </p>
        {data.requestId && (
          <p className="text-xs text-stone-500">
            Si la solicitud es parcial, el importe definitivo se asigna al
            aceptarla según las cantidades solicitadas.
          </p>
        )}
        {data.notes && (
          <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
        )}
        <details className="text-sm border-t pt-3">
          <summary className="cursor-pointer font-medium">
            Ver detalle comercial de lo vendido
          </summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Artículo</th>
                  <th className="p-2">Cantidad vendida</th>
                  <th className="p-2">Precio unitario</th>
                </tr>
              </thead>
              <tbody>
                {(data.allLines || data.lines).map((line) => (
                  <tr key={line.id} className="border-b">
                    <td className="p-2">
                      {line.product_name} {line.variant_name}
                    </td>
                    <td className="p-2">{line.quantity}</td>
                    <td className="p-2 whitespace-nowrap">
                      {line.unit_price === undefined
                        ? "—"
                        : formatCurrencyARS(line.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        {!data.requestId && !closed && !data.documents.length && (
          <p className="text-sm text-sky-800">
            El pedido ya está aceptado. Completá su preparación aquí y emití la
            orden para enviarlo a planta.
          </p>
        )}
      </header>
      {error && (
        <p
          role="alert"
          className="border border-red-300 bg-red-50 text-red-800 p-4 rounded-xl"
        >
          {error}
        </p>
      )}
      {data.documents.length > 0 && (
        <section className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl space-y-3">
          <h2 className="font-bold flex gap-2 items-center">
            <CheckCircle2 size={18} /> Órdenes de fabricación emitidas
          </h2>
          {data.documents.map((doc) => (
            <Link
              key={doc.id}
              className="flex items-center gap-2 underline"
              href={`/administracion/fabricacion/${doc.id}`}
            >
              <Printer size={16} /> Abrir / reimprimir {doc.order_number}
            </Link>
          ))}
          <p className="text-xs">
            Reimprimir conserva la misma orden, sus materiales y su numeración.
          </p>
        </section>
      )}
      {!closed && lines.length > 0 && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            emit();
          }}
          className="space-y-5"
        >
          <section className="bg-white border rounded-2xl p-5 space-y-5">
            <div>
              <h2 className="text-lg font-bold">
                Producto y adicionales del pedido
              </h2>
              <p className="text-sm text-stone-500">
                Todo se incluirá en la misma orden. Confirmá qué se fabrica y
                con qué materiales.
              </p>
            </div>
            {lines.map((line) => {
              const source = data.lines.find((i) => i.id === line.id)!;
              const recipes = matchingRecipes(
                data.recipes,
                line.productId,
                line.variantId,
              );
              const options = data.options.filter(
                (o) => !o.product_id || o.product_id === line.productId,
              );
              return (
                <fieldset
                  key={line.id}
                  disabled={pending}
                  className="border rounded-xl p-4 space-y-3"
                >
                  <legend className="font-semibold px-2">
                    {source.product_name}
                    {source.variant_name ? ` · ${source.variant_name}` : ""}
                  </legend>
                  {source.factory_notes && (
                    <p className="text-sm bg-amber-50 p-3 rounded">
                      Indicaciones del vendedor: {source.factory_notes}
                    </p>
                  )}
                  {lines.length > 1 && (
                    <label className="flex gap-2 items-center text-sm">
                      <input
                        type="radio"
                        name="primary"
                        checked={primary === line.id}
                        onChange={() => {
                          setPrimary(line.id);
                          setConfirmed(false);
                        }}
                        required
                      />{" "}
                      Es el producto principal; los demás son adicionales
                    </label>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="text-sm">
                      Producto de fabricación
                      <select
                        aria-label={`Producto técnico: ${source.product_name}`}
                        className={field}
                        value={line.productId}
                        disabled={Boolean(source.product_id)}
                        required
                        onChange={(e) => {
                          const available = matchingRecipes(
                            data.recipes,
                            e.target.value,
                            null,
                          );
                          update(line.id, {
                            productId: e.target.value,
                            variantId: null,
                            bomId:
                              available.sort((a, b) => b.version - a.version)[0]
                                ?.id || "",
                          });
                        }}
                      >
                        <option value="">
                          Elegir producto real del catálogo
                        </option>
                        {data.products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      Variante
                      <select
                        aria-label={`Variante: ${source.product_name}`}
                        className={field}
                        value={line.variantId || ""}
                        disabled={!line.productId || Boolean(source.product_id)}
                        onChange={(e) => {
                          const variantId = e.target.value || null;
                          const available = matchingRecipes(
                            data.recipes,
                            line.productId,
                            variantId,
                          );
                          update(line.id, {
                            variantId,
                            bomId:
                              available.sort((a, b) => b.version - a.version)[0]
                                ?.id || "",
                          });
                        }}
                      >
                        <option value="">Base del producto</option>
                        {data.variants
                          .filter((v) => v.product_id === line.productId)
                          .map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  {line.productId && (
                    <div className="space-y-2">
                      <p
                        className={`rounded-lg p-3 text-sm ${recipes.length ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}
                      >
                        {recipes.length
                          ? "Materiales listos. Calculamos automáticamente lo necesario para esta cantidad."
                          : "Faltan los materiales para fabricar este producto. Completalos aquí para continuar."}
                      </p>
                      <button
                        type="button"
                        disabled={pending}
                        className="underline text-sm"
                        onClick={() =>
                          execute(async () => {
                            setEditor(
                              await getOrderMaterialsEditor(
                                line.productId,
                                line.variantId,
                              ),
                            );
                          })
                        }
                      >
                        {recipes.length
                          ? "Ver / editar materiales"
                          : "Completar materiales"}
                      </button>
                    </div>
                  )}
                  <label className="block text-sm">
                    Cantidad a fabricar (pendiente: {source.quantity})
                    <input
                      aria-label={`Cantidad: ${source.product_name}`}
                      type="number"
                      min={1}
                      max={source.quantity}
                      required
                      className={field}
                      value={line.quantity}
                      onChange={(e) =>
                        update(line.id, { quantity: Number(e.target.value) })
                      }
                    />
                  </label>
                  {options.map((option) => (
                    <label key={option.code} className="block text-sm">
                      {option.name}
                      {option.is_required ? " *" : ""}
                      <select
                        className={field}
                        required={option.is_required}
                        value={String(line.configuration[option.code] || "")}
                        onChange={(e) => {
                          const configuration = { ...line.configuration };
                          if (e.target.value)
                            configuration[option.code] = e.target.value;
                          else delete configuration[option.code];
                          update(line.id, { configuration });
                        }}
                      >
                        <option value="">Sin selección</option>
                        {option.allowed_values.map((value) => (
                          <option key={value.value} value={value.value}>
                            {value.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  {Object.entries(line.configuration)
                    .filter(([key]) => !options.some((o) => o.code === key))
                    .map(([key, value]) => (
                      <p key={key} className="text-sm text-amber-900">
                        Configuración recibida: {key}: {String(value)}. Definí
                        esta opción en el producto antes de emitir.
                      </p>
                    ))}
                </fieldset>
              );
            })}
          </section>
          <section className="bg-white border p-5 rounded-2xl space-y-4">
            <label className="block text-sm font-medium">
              Observaciones técnicas para fábrica
              <textarea
                className={field}
                rows={3}
                maxLength={350}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Solo indicaciones de fabricación; no incluir precios ni condiciones comerciales."
              />
            </label>
            {missing.length > 0 && (
              <div
                role="status"
                className="p-4 bg-amber-50 text-amber-900 rounded-xl"
              >
                <p className="font-semibold flex gap-2 items-center">
                  <AlertTriangle size={16} /> Antes de emitir falta:
                </p>
                <ul className="list-disc pl-5 text-sm">
                  {missing.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
            <label className="flex gap-3 items-start text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1"
              />{" "}
              Revisé producto, adicionales, cantidades y configuración. Confirmo
              su fabricación conjunta.
            </label>
            <button
              type="submit"
              disabled={
                pending ||
                editor !== null ||
                !confirmed ||
                !primary ||
                missing.length > 0
              }
              className="inline-flex gap-2 items-center rounded-lg bg-emerald-700 text-white font-semibold px-5 py-3 disabled:opacity-40"
            >
              <Factory size={18} />
              {pending
                ? "Procesando…"
                : data.requestId
                  ? "Confirmar pedido y emitir OF"
                  : "Emitir orden de fabricación"}
            </button>
            <p className="text-xs text-stone-500">
              Se abrirá la orden A4 para imprimir, con componentes y firmas por
              etapa, sin importes.
            </p>
          </section>
        </form>
      )}
      {editor && (
        <section
          id="order-materials-editor"
          tabIndex={-1}
          role="region"
          aria-label="Materiales de fabricación"
          className="border-2 border-cyan-700 rounded-2xl p-4 space-y-4"
        >
          <header className="flex flex-wrap justify-between gap-3">
            <h2 className="font-bold">Materiales de fabricación</h2>
            <button
              type="button"
              className="underline text-sm"
              onClick={() => {
                if (
                  window.confirm(
                    "¿Cerrar el editor? Los cambios sin guardar se perderán.",
                  )
                )
                  setEditor(null);
              }}
            >
              Cerrar editor
            </button>
          </header>
          <p className="text-sm text-stone-600">
            Guardalos una vez para este producto o presentación. También se
            usarán en próximos pedidos.
          </p>
          <ProductManufacturingClient
            key={`${editor.productId}:${editor.variantId}`}
            {...editor}
            embedded
            onSaved={refreshMaterials}
          />
        </section>
      )}
      {data.requestId && !closed && (
        <section className="border rounded-2xl bg-white p-5 space-y-3">
          <h2 className="font-semibold">
            Resolver la solicitud sin enviarla todavía a fábrica
          </h2>
          <label className="block text-sm">
            Motivo / observaciones
            <textarea
              className={field}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={pending}
              onClick={() => decide("approved")}
              className="border rounded-lg px-4 py-2"
            >
              Aceptar y dejar en preparación
            </button>
            <button
              disabled={pending || reason.trim().length < 3}
              onClick={() => decide("returned")}
              className="border rounded-lg px-4 py-2"
            >
              Devolver al vendedor
            </button>
            <button
              disabled={pending || reason.trim().length < 3}
              onClick={() => decide("rejected")}
              className="border rounded-lg px-4 py-2 text-red-700"
            >
              Rechazar solicitud
            </button>
          </div>
        </section>
      )}
      {closed && (
        <p className="p-4 bg-stone-100 rounded-xl">
          Este registro está cerrado. No admite nuevas órdenes de fabricación.
        </p>
      )}
      {closed && (data.allLines || data.lines).length > 0 && (
        <section className="border rounded-xl bg-white p-5">
          <h2 className="font-semibold mb-3">Productos del pedido</h2>
          <ul className="space-y-2">
            {(data.allLines || data.lines).map((line) => (
              <li key={line.id}>
                {line.product_name} {line.variant_name} · {line.quantity}{" "}
                unidades
              </li>
            ))}
          </ul>
        </section>
      )}
      {data.orderId && !closed && (
        <section className="flex flex-wrap gap-3 border-t pt-4">
          {data.status === "processing" &&
            (data.documents.length > 0 || data.approval === "legacy") && (
              <button
                disabled={pending}
                className="bg-emerald-700 text-white px-4 py-2 rounded-lg"
                onClick={() =>
                  execute(async () => {
                    await updateOrderStatus(data.orderId!, "delivered");
                    router.refresh();
                  })
                }
              >
                Marcar como entregado
              </button>
            )}
          <button
            disabled={pending}
            className="text-red-700 border px-4 py-2 rounded-lg"
            onClick={() => {
              const reason = window.prompt("Motivo de cancelación del pedido:");
              if (reason !== null)
                execute(async () => {
                  await cancelOrder(data.orderId!, reason);
                  router.refresh();
                });
            }}
          >
            Cancelar pedido
          </button>
        </section>
      )}
      {!closed && !lines.length && !data.documents.length && (
        <p role="status">No hay cantidades pendientes de fabricación.</p>
      )}
    </div>
  );
}
