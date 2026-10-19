import Link from "next/link";
import { FileCheck2, CalendarDays, ShieldCheck } from "lucide-react";
import { requireAccountingUser } from "@/lib/supabase/accounting";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { accountingPeriod, fiscalDocumentLabels } from "@/lib/accounting";
import { AccountingShell } from "@/components/contable/AccountingShell";
export async function AccountingDocuments({
  searchParams,
  section = "resumen",
}: {
  searchParams: Promise<{ period?: string; page?: string }>;
  section?: "resumen" | "comprobantes" | "presupuestos" | "pedidos" | "notas";
}) {
  const ctx = await requireAccountingUser();
  const params = await searchParams;
  let period;
  try {
    period = accountingPeriod(params.period);
  } catch {
    period = accountingPeriod();
  }
  const page = Math.min(
    10000,
    Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  );
  const db = await createSupabaseServerClient();
  let query = db
    .from("fiscal_documents")
    .select(
      "id,voucher_type,point_of_sale,voucher_number,issued_on,recipient_name,recipient_document,currency,net_amount,tax_amount,total_amount,authorization_code,source_order_id,source_budget_id,order_number:source_order_snapshot->document->>order_number,budget_number:source_budget_snapshot->document->>budget_number",
      { count: "exact" },
    )
    .gte("issued_on", period.start)
    .lt("issued_on", period.end)
    .order("issued_on", { ascending: false })
    .order("id", { ascending: false })
    .range((page - 1) * 25, page * 25 - 1);
  if (section === "notas")
    query = query.in("voucher_type", [2, 3, 7, 8, 12, 13]);
  if (section === "pedidos") query = query.not("source_order_id", "is", null);
  if (section === "presupuestos")
    query = query.not("source_budget_id", "is", null);
  const { data, error, count } = await query;
  const title = {
    resumen: "Resumen contable",
    comprobantes: "Facturas y comprobantes",
    presupuestos: "Presupuestos vinculados",
    pedidos: "Pedidos vinculados",
    notas: "Notas de crédito y débito",
  }[section];

  return (
    <AccountingShell context={ctx}>
      <div>
        <header className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm mb-6">
          <p className="text-xs text-accent-deep font-bold uppercase tracking-wider">
            Portal Contable
          </p>
          <h1 className="text-2xl font-bold text-stone-900 mt-2">{title}</h1>
          <p className="text-sm text-stone-500 mt-2">
            {section === "presupuestos" || section === "pedidos"
              ? "Documentos de origen vinculados a cada comprobante emitido. Una operación puede aparecer en más de un comprobante."
              : "Consultá los comprobantes emitidos y recorré toda la documentación de cada operación."}
          </p>
        </header>
        {section === "resumen" && !error && (
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            {[
              {
                icon: FileCheck2,
                label: "Comprobantes del período",
                value: String(count ?? 0),
                detail: "Facturas y notas registradas",
              },
              {
                icon: CalendarDays,
                label: "Período seleccionado",
                value: new Intl.DateTimeFormat("es-AR", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(`${period.start}T12:00:00Z`)),
                detail: "Consultá cualquier mes desde el filtro",
              },
              {
                icon: ShieldCheck,
                label: "Tipo de acceso",
                value: "Consulta contable",
                detail: "Documentación original protegida",
              },
            ].map((card) => (
              <section
                key={card.label}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                    {card.label}
                  </h2>
                  <card.icon className="w-5 h-5 text-accent-deep shrink-0" />
                </div>
                <p className="text-xl font-bold text-stone-900 mt-3 capitalize">
                  {card.value}
                </p>
                <p className="text-xs text-stone-400 mt-2">{card.detail}</p>
              </section>
            ))}
          </div>
        )}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-6 bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <form className="flex flex-wrap gap-3 items-end">
            <label>
              Período
              <input
                aria-label="Período"
                type="month"
                name="period"
                defaultValue={period.month}
                className="block mt-1.5 border border-stone-300 rounded-lg p-2.5 bg-stone-50 text-sm"
              />
            </label>
            <button className="border border-stone-200 rounded-lg px-4 py-2.5 bg-white text-sm font-semibold text-stone-700 hover:bg-stone-50">
              Consultar / Actualizar
            </button>
          </form>
          {!error && (
            <a
              className="bg-accent-deep text-white rounded-lg px-4 py-2.5 text-sm font-semibold"
              href={`/contable/exportar?period=${period.month}`}
            >
              Exportar CSV
            </a>
          )}
        </div>
        {error ? (
          <p
            role="alert"
            className="border border-amber-300 bg-amber-50 p-5 rounded"
          >
            No se pudo consultar el registro fiscal. Verificá que la migración
            del Portal Contable esté aplicada.
          </p>
        ) : (
          <>
            <p className="mb-3 text-stone-600">
              {count ?? 0} comprobantes en el período. Cada moneda se informa
              por separado.
            </p>
            <div className="overflow-x-auto border border-stone-200 rounded-xl bg-white shadow-sm">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500">
                  <tr>
                    {[
                      "Fecha",
                      "Comprobante",
                      "Número",
                      "Destinatario",
                      "Documento",
                      "Moneda",
                      "Neto",
                      "Impuestos",
                      "Total",
                      "Autorización",
                      "Presupuesto / Pedido",
                      "Documentación",
                    ].map((h) => (
                      <th className="p-3" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.map((d) => (
                    <tr className="border-t" key={d.id}>
                      <td className="p-3">{d.issued_on}</td>
                      <td className="p-3">
                        {fiscalDocumentLabels[d.voucher_type] ??
                          `Tipo ${d.voucher_type}`}
                      </td>
                      <td className="p-3">
                        {String(d.point_of_sale).padStart(5, "0")}-
                        {String(d.voucher_number).padStart(8, "0")}
                      </td>
                      <td className="p-3">{d.recipient_name}</td>
                      <td className="p-3">{d.recipient_document}</td>
                      <td className="p-3">{d.currency}</td>
                      {[d.net_amount, d.tax_amount, d.total_amount].map(
                        (amount, i) => (
                          <td className="p-3 text-right" key={i}>
                            {Number(amount).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        ),
                      )}
                      <td className="p-3">{d.authorization_code}</td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {d.source_budget_id && (
                            <Link
                              prefetch={false}
                              className="block text-accent-deep font-medium"
                              href={`/contable/comprobantes/${d.id}#presupuesto`}
                            >
                              Presupuesto #{d.budget_number ?? "—"}
                            </Link>
                          )}
                          {d.source_order_id && (
                            <Link
                              prefetch={false}
                              className="block text-accent-deep font-medium"
                              href={`/contable/comprobantes/${d.id}#pedido`}
                            >
                              Pedido #{d.order_number ?? "—"}
                            </Link>
                          )}
                          {!d.source_budget_id && !d.source_order_id && (
                            <span className="text-stone-400">
                              Sin origen vinculado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Link
                          prefetch={false}
                          className="text-teal-700 underline"
                          href={`/contable/comprobantes/${d.id}`}
                        >
                          Ver circuito completo
                        </Link>
                        <div className="flex gap-3 text-xs mt-1">
                          {d.source_budget_id && (
                            <Link
                              prefetch={false}
                              href={`/contable/comprobantes/${d.id}#presupuesto`}
                            >
                              Presupuesto
                            </Link>
                          )}
                          {d.source_order_id && (
                            <Link
                              prefetch={false}
                              href={`/contable/comprobantes/${d.id}#pedido`}
                            >
                              Pedido
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data?.length && (
                <p className="p-10 text-center text-stone-500">
                  No hay comprobantes fiscales registrados en este período. La
                  conexión con ARCA está pendiente.
                </p>
              )}
            </div>
            <nav aria-label="Paginación" className="flex gap-4 mt-5">
              {page > 1 && (
                <Link href={`?period=${period.month}&page=${page - 1}`}>
                  Anterior
                </Link>
              )}
              <span>Página {page}</span>
              {page * 25 < (count ?? 0) && (
                <Link href={`?period=${period.month}&page=${page + 1}`}>
                  Siguiente
                </Link>
              )}
            </nav>
          </>
        )}
        <p className="text-xs text-stone-500 mt-8">
          Los comprobantes autorizados aparecen automáticamente. Las
          correcciones se registran mediante comprobantes asociados, conservando
          el original.
        </p>
      </div>
    </AccountingShell>
  );
}
