"use client";
import { useState } from "react";
import Link from "next/link";
import { Factory, Clock, Printer } from "lucide-react";

type PendingItem = {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  manufacturing_issued_quantity?: number;
  configuration_status?: string;
  orders: {
    order_number: number;
    created_at: string;
    clients?: { name: string };
    sellers?: { full_name: string };
  };
};
type IssuedOrder = {
  id: string;
  order_id?: string;
  order_number: string;
  product_name: string;
  status: string;
  issued_at: string;
  orders?: { order_number: number };
};
interface Props {
  initialOrders: IssuedOrder[];
  totalCount: number;
  serverPage: number;
  serverTotalPages: number;
  pendingItems: PendingItem[];
  pendingError?: string | null;
  compositions?: unknown[];
  initialSearch?: string;
  initialStatus?: string;
  initialPendingView?: boolean;
}
const labels: Record<string, string> = {
  issued: "Emitida",
  in_production: "En planta",
  completed: "Fabricada",
  cancelled: "Superada / anulada",
};
export function ManufacturingClient({
  initialOrders,
  totalCount,
  serverPage,
  serverTotalPages,
  pendingItems,
  pendingError,
  initialSearch = "",
  initialStatus = "all",
  initialPendingView = false,
}: Props) {
  const [tab, setTab] = useState(initialPendingView ? "pending" : "issued");
  const groups = new Map<
    string,
    { order: PendingItem["orders"]; items: PendingItem[] }
  >();
  for (const item of pendingItems) {
    const group = groups.get(item.order_id) || {
      order: item.orders,
      items: [],
    };
    group.items.push(item);
    groups.set(item.order_id, group);
  }
  return (
    <div className="space-y-5">
      <nav className="flex gap-3 border-b" aria-label="Fabricación">
        <button
          onClick={() => setTab("pending")}
          aria-current={tab === "pending" ? "page" : undefined}
          className={`px-4 py-3 flex gap-2 items-center ${tab === "pending" ? "border-b-2 border-accent-deep font-bold text-accent-deep" : ""}`}
        >
          <Clock size={17} />
          Pedidos por preparar ({groups.size})
        </button>
        <button
          onClick={() => setTab("issued")}
          aria-current={tab === "issued" ? "page" : undefined}
          className={`px-4 py-3 flex gap-2 items-center ${tab === "issued" ? "border-b-2 border-accent-deep font-bold text-accent-deep" : ""}`}
        >
          <Factory size={17} />
          Órdenes emitidas ({totalCount})
        </button>
      </nav>
      {tab === "pending" ? (
        <>
          <p className="text-sm text-stone-500">
            Abrí el pedido para revisar producto y adicionales, completar su
            preparación y emitir una sola orden para planta.
          </p>
          {pendingError && (
            <p role="alert" className="text-red-800 bg-red-50 p-4 rounded">
              {pendingError}
            </p>
          )}
          <div className="bg-white border rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="p-4">Pedido</th>
                  <th className="p-4">Cliente / asesor</th>
                  <th className="p-4">Producto y adicionales</th>
                  <th className="p-4">Acción</th>
                </tr>
              </thead>
              <tbody>
                {[...groups].map(([id, group]) => (
                  <tr key={id} className="border-t">
                    <td className="p-4 font-semibold">
                      Pedido #{group.order.order_number}
                    </td>
                    <td className="p-4">
                      {group.order.clients?.name}
                      <span className="block text-xs text-stone-500">
                        {group.order.sellers?.full_name}
                      </span>
                    </td>
                    <td className="p-4">
                      {group.items.map((item) => (
                        <p key={item.id}>
                          {item.product_name} ×{" "}
                          {item.quantity -
                            (item.manufacturing_issued_quantity || 0)}
                        </p>
                      ))}
                    </td>
                    <td className="p-4">
                      <Link
                        className="inline-block rounded-lg bg-accent-deep text-white px-4 py-2"
                        href={`/administracion/pedidos/${id}`}
                      >
                        Preparar pedido
                      </Link>
                    </td>
                  </tr>
                ))}
                {!groups.size && !pendingError && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-stone-500">
                      No hay pedidos pendientes de preparación.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <form
            className="flex flex-wrap gap-3 bg-white border rounded-xl p-4"
            method="get"
          >
            <label className="flex-1 min-w-48 text-sm">
              Buscar OF
              <input
                className="block border rounded-lg p-2 w-full"
                name="search"
                defaultValue={initialSearch}
                placeholder="Número de OF o producto"
              />
            </label>
            <label className="text-sm">
              Estado
              <select
                name="status"
                defaultValue={initialStatus}
                className="block border rounded-lg p-2"
              >
                <option value="all">Todos</option>
                {Object.entries(labels).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <button className="border px-4 py-2 rounded-lg self-end">
              Buscar
            </button>
          </form>
          <div className="bg-white border rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="p-4">OF / pedido</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Documento</th>
                </tr>
              </thead>
              <tbody>
                {initialOrders.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="p-4 font-semibold">
                      {order.order_number}
                      {order.order_id && (
                        <Link
                          className="block underline text-xs font-normal"
                          href={`/administracion/pedidos/${order.order_id}`}
                        >
                          Pedido #{order.orders?.order_number}
                        </Link>
                      )}
                    </td>
                    <td className="p-4">{order.product_name}</td>
                    <td className="p-4">
                      {labels[order.status] || order.status}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/administracion/fabricacion/${order.id}`}
                        className="inline-flex gap-2 items-center underline"
                      >
                        <Printer size={16} />
                        Abrir / imprimir A4
                      </Link>
                    </td>
                  </tr>
                ))}
                {!initialOrders.length && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-stone-500">
                      No hay órdenes emitidas para esta búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <nav
            aria-label="Páginas de órdenes"
            className="flex justify-between text-sm"
          >
            {serverPage > 1 ? (
              <Link
                href={`?page=${serverPage - 1}&search=${encodeURIComponent(initialSearch)}&status=${initialStatus}`}
              >
                Anterior
              </Link>
            ) : (
              <span />
            )}
            <span>
              Página {serverPage} de {Math.max(1, serverTotalPages)}
            </span>
            {serverPage < serverTotalPages && (
              <Link
                href={`?page=${serverPage + 1}&search=${encodeURIComponent(initialSearch)}&status=${initialStatus}`}
              >
                Siguiente
              </Link>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
