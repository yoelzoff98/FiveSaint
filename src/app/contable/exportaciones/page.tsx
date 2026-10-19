import { requireAccountingUser } from "@/lib/supabase/accounting";
import { accountingPeriod } from "@/lib/accounting";
import { AccountingShell } from "@/components/contable/AccountingShell";
import { Download, FileSpreadsheet } from "lucide-react";
export default async function Page() {
  const ctx = await requireAccountingUser();
  return (
    <AccountingShell context={ctx}>
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm mb-6">
        <p className="text-xs text-accent-deep font-bold uppercase tracking-wider">
          Portal Contable
        </p>
        <h1 className="text-2xl font-bold text-stone-900 mt-2">
          Exportaciones
        </h1>
        <p className="text-sm text-stone-500 mt-2">
          Descargá los comprobantes del período para trabajar con tu contador.
        </p>
      </div>
      <section className="bg-white border border-stone-200 rounded-2xl p-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-5">
          <span className="rounded-xl bg-accent-deep/10 text-accent-deep p-3">
            <FileSpreadsheet className="w-6 h-6" />
          </span>
          <div>
            <h2 className="font-semibold">Comprobantes fiscales en CSV</h2>
            <p className="text-sm text-stone-500">
              Facturas y notas con sus importes y autorizaciones.
            </p>
          </div>
        </div>
        <form
          action="/contable/exportar"
          className="flex flex-wrap gap-4 items-end"
        >
          <label className="text-sm font-medium text-stone-700">
            Período
            <input
              name="period"
              type="month"
              required
              defaultValue={accountingPeriod().month}
              className="block mt-1.5 border border-stone-300 rounded-lg bg-stone-50 p-2.5"
            />
          </label>
          <button className="inline-flex items-center gap-2 bg-accent-deep text-white rounded-lg px-4 py-2.5 text-sm font-semibold">
            <Download className="w-4 h-4" />
            Descargar CSV
          </button>
        </form>
        <p className="text-xs text-stone-500 mt-5">
          Hasta 1.000 comprobantes por exportación mensual. Los documentos
          originales se conservan.
        </p>
      </section>
    </AccountingShell>
  );
}
