import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getPaginatedOrders } from "@/lib/supabase/comercial";
import { formatCurrencyARS } from "@/lib/commercial-calculations";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Receipt, Info, Calendar, Building, CheckCircle2 } from "lucide-react";

export default async function AdministrationBillingPage() {
  await requireAdministrationUser();

  // Obtener pedidos entregados o completados listos para facturación futura
  const readyOrdersRes = await getPaginatedOrders({
    page: 1,
    pageSize: 30,
    status: "delivered"
  });

  const orders = readyOrdersRes.data || [];

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                Módulo de Facturación
              </h1>
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-mono text-[10px] font-bold">
                Próximamente
              </Badge>
            </div>
            <p className="text-xs text-stone-500">
              Estructura de navegación preparada para el circuito de conciliación y facturación electrónica.
            </p>
          </div>
        </div>

        {/* Alerta de resguardo y no emisión */}
        <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold block mb-0.5">Aviso de Reglas de Negocio (Sprint 1):</strong>
            En esta etapa no se emiten comprobantes fiscales ni se muta el estado de pedidos a facturados.
            A continuación se listan a modo informativo los pedidos entregados que ingresarán al circuito de facturación en el siguiente sprint.
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-stone-200 bg-white">
            <span className="text-[11px] font-bold uppercase text-stone-500 block mb-1">
              Pedidos Entregados Pendientes de Facturación
            </span>
            <div className="text-2xl font-black text-stone-900">{readyOrdersRes.total || 0}</div>
          </Card>
          <Card className="p-4 border-stone-200 bg-white">
            <span className="text-[11px] font-bold uppercase text-stone-500 block mb-1">
              Volumen Estimado a Liquidar
            </span>
            <div className="text-2xl font-black text-accent-deep">
              {formatCurrencyARS(orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0))}
            </div>
          </Card>
          <Card className="p-4 border-stone-200 bg-white">
            <span className="text-[11px] font-bold uppercase text-stone-500 block mb-1">
              Estado de Integración Fiscal
            </span>
            <div className="flex items-center gap-1.5 text-stone-700 font-semibold text-sm mt-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Navegación Lista (Sin Emisión)</span>
            </div>
          </Card>
        </div>

        {/* Tabla Informativa de Pedidos para Facturación */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-stone-200/80">
            <h2 className="text-base font-bold text-stone-900">Pedidos Listos para Facturar</h2>
            <p className="text-xs text-stone-500">Comprobantes pendientes de procesamiento fiscal</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3">N° Pedido</th>
                  <th className="px-5 py-3">Cliente / Razón Social</th>
                  <th className="px-5 py-3">Canal</th>
                  <th className="px-5 py-3">Fecha Entrega</th>
                  <th className="px-5 py-3 text-right">Importe Total</th>
                  <th className="px-5 py-3 text-center">Estado Fiscal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-stone-400">
                      No hay pedidos entregados pendientes de facturación en este momento.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono text-stone-900">
                        #{o.order_number}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-stone-850 block">{o.clients?.name}</span>
                        {o.clients?.company_name && (
                          <span className="text-[10px] text-stone-400">{o.clients.company_name}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {o.sale_channel === "distributor" ? "Distribuidor" : "Directo"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-stone-500">
                        {new Date(o.created_at).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-stone-900">
                        {formatCurrencyARS(o.total_amount)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Badge variant="outline" className="text-[10px] border-stone-200 text-stone-500 bg-stone-50">
                          Aguardando Sprint 2
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdministrationShell>
  );
}
