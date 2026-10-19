import Link from "next/link";
import { AccountingShell } from "@/components/contable/AccountingShell";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAccountingUser } from "@/lib/supabase/accounting";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountingSourceDocument } from "@/components/contable/AccountingSourceDocument";
import {
  accountingMoney,
  fiscalDocumentLabels,
  type AccountingSourceSnapshot,
} from "@/lib/accounting";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireAccountingUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const db = await createSupabaseServerClient();
  const { data: doc, error } = await db
    .from("fiscal_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo consultar la documentación contable");
  if (!doc) notFound();
  const page = Math.max(
    1,
    Math.min(10000, Number.parseInt((await searchParams).page ?? "1", 10) || 1),
  );
  let related = db
    .from("fiscal_documents")
    .select(
      "id,voucher_type,point_of_sale,voucher_number,issued_on,currency,total_amount",
      { count: "exact" },
    )
    .eq("issuer_tax_id", doc.issuer_tax_id);
  if (doc.source_order_id)
    related = related.eq("source_order_id", doc.source_order_id);
  else if (doc.source_budget_id)
    related = related
      .eq("source_budget_id", doc.source_budget_id)
      .is("source_order_id", null);
  else {
    const root = doc.original_document_id ?? doc.id;
    related = related.or(`id.eq.${root},original_document_id.eq.${root}`);
  }
  const [documents, summary] = await Promise.all([
    related
      .order("issued_on")
      .order("id")
      .range((page - 1) * 25, page * 25 - 1),
    db.rpc("get_fiscal_billing_summary", { p_document_id: id }),
  ]);
  if (documents.error || summary.error)
    throw new Error("No se pudo consultar el circuito completo");
  const order = doc.source_order_snapshot as AccountingSourceSnapshot | null;
  const budget = doc.source_budget_snapshot as AccountingSourceSnapshot | null;
  const pending =
    summary.data?.pending_amount == null
      ? null
      : Number(summary.data.pending_amount);
  return (
    <AccountingShell context={ctx}>
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/contable">← Portal Contable</Link>
        <header>
          <h1 className="text-3xl font-bold">Documentación de la operación</h1>
          <p className="text-stone-500">
            Presupuesto → Pedido → Comprobantes fiscales
          </p>
          <nav className="flex gap-4 mt-3">
            <a href="#presupuesto">Presupuesto</a>
            <a href="#pedido">Pedido</a>
            <a href="#factura">Comprobante</a>
          </nav>
        </header>
        <section
          id="factura"
          className="border rounded-xl bg-white p-5 space-y-2"
        >
          <h2 className="text-xl font-bold">
            {fiscalDocumentLabels[doc.voucher_type] ??
              `Comprobante tipo ${doc.voucher_type}`}{" "}
            {String(doc.point_of_sale).padStart(5, "0")}-
            {String(doc.voucher_number).padStart(8, "0")}
          </h2>
          <p>
            Emisión: {doc.issued_on} · CUIT emisor: {doc.issuer_tax_id}
          </p>
          <p>
            {doc.recipient_name} · Documento: {doc.recipient_document}
          </p>
          <p>
            Autorización: {doc.authorization_code} · Vencimiento:{" "}
            {doc.authorization_expires_on}
          </p>
          <p>
            Neto: {accountingMoney(doc.net_amount, doc.currency)} · Impuestos:{" "}
            {accountingMoney(doc.tax_amount, doc.currency)}
          </p>
          <p className="font-bold">
            Total: {accountingMoney(doc.total_amount, doc.currency)}
          </p>
          {doc.original_document_id && (
            <Link
              className="text-teal-700 underline"
              href={`/contable/comprobantes/${doc.original_document_id}`}
            >
              Ver comprobante original
            </Link>
          )}
        </section>
        <AccountingSourceDocument
          id="presupuesto"
          title="Presupuesto"
          snapshot={budget}
        />
        <AccountingSourceDocument id="pedido" title="Pedido" snapshot={order} />
        <section className="border rounded-xl bg-white p-5 space-y-3">
          <h2 className="text-xl font-bold">Facturación de esta operación</h2>
          <p>
            Facturado neto de notas de crédito y débito (
            {summary.data?.document_count ?? 0} comprobantes en {doc.currency}):{" "}
            {summary.data?.supported_types
              ? accountingMoney(summary.data.net_invoiced, doc.currency)
              : "No calculable: existen tipos de comprobante sin clasificación"}
          </p>
          {pending !== null ? (
            <>
              <p className="font-semibold">
                {pending >= 0
                  ? "Pendiente de facturar"
                  : "Facturación superior al total de origen"}
                : {accountingMoney(Math.abs(pending), doc.currency)}
              </p>
              <p className="text-sm text-stone-500">
                Calculado contra el total del {order ? "pedido" : "presupuesto"}{" "}
                conservado al emitir. Incluye comprobantes de todos los meses en
                la misma moneda. No representa deuda ni saldo de cobranza.
              </p>
            </>
          ) : (
            <p>
              No se calcula el pendiente sin un origen de la misma moneda y
              tipos de comprobante reconocidos.
            </p>
          )}
          <h3 className="font-semibold">
            Comprobantes vinculados · Todos los períodos
          </h3>
          <ul className="divide-y">
            {documents.data?.map((item) => (
              <li
                className="py-3 flex flex-wrap justify-between gap-3"
                key={item.id}
              >
                <Link
                  prefetch={false}
                  className="text-teal-700 underline"
                  href={`/contable/comprobantes/${item.id}`}
                >
                  {fiscalDocumentLabels[item.voucher_type] ??
                    `Tipo ${item.voucher_type}`}{" "}
                  {String(item.point_of_sale).padStart(5, "0")}-
                  {String(item.voucher_number).padStart(8, "0")} ·{" "}
                  {item.issued_on}
                </Link>
                <span>{accountingMoney(item.total_amount, item.currency)}</span>
              </li>
            ))}
          </ul>
          <nav className="flex gap-4">
            {page > 1 && <Link href={`?page=${page - 1}`}>Anterior</Link>}
            <span>Página {page}</span>
            {page * 25 < (documents.count ?? 0) && (
              <Link href={`?page=${page + 1}`}>Siguiente</Link>
            )}
          </nav>
        </section>
        <section className="text-sm text-stone-500">
          Los cobros, PDFs y remitos se incorporarán cuando existan esos módulos
          e integraciones. No se deducen pagos a partir de la emisión de una
          factura.
        </section>
      </div>
    </AccountingShell>
  );
}
