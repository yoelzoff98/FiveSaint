import type { AccountingSourceSnapshot } from "@/lib/accounting";
import { accountingMoney } from "@/lib/accounting";
export function AccountingSourceDocument({
  title,
  id,
  snapshot,
}: {
  title: string;
  id: string;
  snapshot: AccountingSourceSnapshot | null;
}) {
  return (
    <section id={id} className="border rounded-xl bg-white p-5 space-y-4">
      <h2 className="text-xl font-bold">
        {title}
        {snapshot
          ? ` #${snapshot.document.order_number ?? snapshot.document.budget_number}`
          : ""}
      </h2>
      {!snapshot ? (
        <p className="text-stone-500">
          Este comprobante no tiene un {title.toLowerCase()} de origen
          vinculado. No se deducen relaciones automáticamente.
        </p>
      ) : (
        <>
          <p className="text-sm text-stone-500">
            Copia conservada al emitir el comprobante · Fecha del documento:{" "}
            {snapshot.document.created_at.slice(0, 10)} · Estado al emitir:{" "}
            {snapshot.document.status}
          </p>
          {snapshot.document.client_snapshot && (
            <div>
              <h3 className="font-semibold">Cliente del presupuesto</h3>
              {[
                snapshot.document.client_snapshot.name,
                snapshot.document.client_snapshot.company_name,
                snapshot.document.client_snapshot.email,
                snapshot.document.client_snapshot.phone,
                snapshot.document.client_snapshot.address,
              ]
                .filter(Boolean)
                .map((value, index) => (
                  <p key={index}>{value}</p>
                ))}
            </div>
          )}
          {snapshot.document.seller_snapshot && (
            <p>
              Asesor:{" "}
              {snapshot.document.seller_snapshot.full_name ??
                snapshot.document.seller_snapshot.name}{" "}
              {snapshot.document.seller_snapshot.phone}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  {[
                    "Producto / Adicional",
                    "Cantidad",
                    "Precio unitario",
                    "Total",
                  ].map((h) => (
                    <th className="p-2 border-b" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshot.items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-2 border-b">
                      {item.product_name}
                      {item.variant_name && (
                        <p className="text-stone-500">{item.variant_name}</p>
                      )}
                      {item.factory_notes && <p>{item.factory_notes}</p>}
                      {item.configuration &&
                        Object.keys(item.configuration).length > 0 && (
                          <details>
                            <summary>Configuración del producto</summary>
                            <pre className="whitespace-pre-wrap break-words">
                              {JSON.stringify(item.configuration, null, 2)}
                            </pre>
                          </details>
                        )}
                    </td>
                    <td className="p-2 border-b">{item.quantity}</td>
                    <td className="p-2 border-b whitespace-nowrap">
                      {accountingMoney(item.unit_price, snapshot.currency)}
                    </td>
                    <td className="p-2 border-b whitespace-nowrap">
                      {accountingMoney(item.total_price, snapshot.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!!snapshot.document.discounts?.length && (
            <p>
              Descuentos del documento:{" "}
              {snapshot.document.discounts.join("% · ")}%
            </p>
          )}
          {snapshot.document.subtotal_amount != null && (
            <p>
              Subtotal:{" "}
              {accountingMoney(
                snapshot.document.subtotal_amount,
                snapshot.currency,
              )}
            </p>
          )}
          {snapshot.document.tax_amount != null && (
            <p>
              Impuestos:{" "}
              {accountingMoney(snapshot.document.tax_amount, snapshot.currency)}
            </p>
          )}
          <p className="font-bold">
            Total del documento:{" "}
            {accountingMoney(snapshot.document.total_amount, snapshot.currency)}
          </p>
          {snapshot.document.public_notes && (
            <p className="whitespace-pre-wrap">
              Condiciones del presupuesto: {snapshot.document.public_notes}
            </p>
          )}
          {snapshot.document.notes && (
            <p className="whitespace-pre-wrap">
              Observaciones: {snapshot.document.notes}
            </p>
          )}
        </>
      )}
    </section>
  );
}
