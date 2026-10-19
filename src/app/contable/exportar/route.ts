import { accountingContext } from "@/lib/supabase/accounting";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { accountingPeriod, csvCell } from "@/lib/accounting";
export async function GET(request: Request) {
  if (!(await accountingContext()))
    return new Response("Acceso denegado", { status: 403 });
  let period;
  try {
    period = accountingPeriod(
      new URL(request.url).searchParams.get("period") ?? undefined,
    );
  } catch {
    return new Response("Período inválido", { status: 400 });
  }
  const db = await createSupabaseServerClient();
  // Bounded export: never silently truncate or load the entire ledger.
  const { data, error, count } = await db
    .from("fiscal_documents")
    .select(
      "issued_on,voucher_type,point_of_sale,voucher_number,recipient_name,recipient_document,currency,net_amount,tax_amount,total_amount,authorization_code",
      { count: "exact" },
    )
    .gte("issued_on", period.start)
    .lt("issued_on", period.end)
    .order("issued_on")
    .order("id")
    .limit(1001);
  if (error) return new Response("No se pudo exportar", { status: 503 });
  if ((count ?? 0) > 1000)
    return new Response(
      "El período supera 1000 comprobantes. Solicitá una exportación por lotes.",
      { status: 422 },
    );
  const keys = [
    "issued_on",
    "voucher_type",
    "point_of_sale",
    "voucher_number",
    "recipient_name",
    "recipient_document",
    "currency",
    "net_amount",
    "tax_amount",
    "total_amount",
    "authorization_code",
  ] as const;
  const rows = [
    "Fecha;Tipo;Punto de venta;Número;Destinatario;Documento;Moneda;Neto;Impuestos;Total;Autorización",
    ...data.map((row) => keys.map((key) => csvCell(row[key])).join(";")),
  ];
  return new Response("\uFEFF" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="comprobantes-${period.month}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
