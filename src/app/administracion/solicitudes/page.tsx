import Link from "next/link";
import { redirect } from "next/navigation";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getOrderRequests } from "@/lib/supabase/order-requests";
const labels: Record<string, string> = {
  pending: "Pendientes de aceptación",
  approved: "Aceptadas",
  returned: "Devueltas",
  rejected: "Rechazadas",
  all: "Todas",
};
export default async function OrderRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; requestId?: string }>;
}) {
  const params = await searchParams;
  if (params.requestId)
    redirect(
      `/administracion/solicitudes/${encodeURIComponent(params.requestId)}`,
    );
  const status =
    params.status && labels[params.status] ? params.status : "pending";
  const result = await getOrderRequests(status, Number(params.page) || 1);
  return (
    <AdministrationShell>
      <div className="space-y-5 max-w-5xl mx-auto">
        <header>
          <h1 className="text-2xl font-bold">Solicitudes de pedido</h1>
          <p className="text-stone-500 mt-2">
            Abrí una solicitud para revisar lo vendido, aceptarlo y preparar su
            orden de fabricación en la misma ficha.
          </p>
        </header>
        <nav className="flex flex-wrap gap-3">
          {Object.entries(labels).map(([value, label]) => (
            <Link
              key={value}
              className={`rounded-full border px-4 py-2 text-sm ${status === value ? "bg-accent-deep text-white" : "bg-white"}`}
              href={`?status=${value}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-stone-500">{result.total} solicitudes</p>
        {result.data.map((request) => (
          <article
            key={request.id}
            className="border rounded-xl bg-white p-5 flex flex-wrap gap-4 justify-between items-center"
          >
            <div>
              <h2 className="font-bold">
                Presupuesto #{request.budgets?.budget_number} ·{" "}
                {request.budgets?.clients?.name}
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Asesor: {request.submitted_by_name} ·{" "}
                {new Date(request.created_at).toLocaleDateString("es-AR", {
                  timeZone: "America/Argentina/Buenos_Aires",
                })}
              </p>
              {request.decision_reason && (
                <p className="text-sm mt-2">{request.decision_reason}</p>
              )}
            </div>
            <Link
              className="rounded-lg bg-emerald-700 text-white px-4 py-2 font-medium"
              href={
                request.order_id
                  ? `/administracion/pedidos/${request.order_id}`
                  : `/administracion/solicitudes/${request.id}`
              }
            >
              {request.order_id ? "Abrir pedido" : "Revisar solicitud"}
            </Link>
          </article>
        ))}
        {!result.data.length && (
          <p className="p-8 bg-white border rounded-xl text-center">
            No hay solicitudes en este estado.
          </p>
        )}
        <nav className="flex gap-4" aria-label="Páginas de solicitudes">
          {result.page > 1 && (
            <Link href={`?status=${status}&page=${result.page - 1}`}>
              Anterior
            </Link>
          )}
          {result.page * 20 < result.total && (
            <Link href={`?status=${status}&page=${result.page + 1}`}>
              Siguiente
            </Link>
          )}
        </nav>
      </div>
    </AdministrationShell>
  );
}
