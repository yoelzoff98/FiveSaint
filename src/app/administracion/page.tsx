import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getPaginatedOrders, getPaginatedBudgets } from "@/lib/supabase/comercial";
import { formatCurrencyARS } from "@/lib/commercial-calculations";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  FilePlus,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  Receipt,
  Users
} from "lucide-react";

export default async function AdministrationDashboardPage() {
  const ctx = await requireAdministrationUser();

  // Cargar datos paginados livianos en paralelo
  const [ordersRes, pendingOrdersRes, processingOrdersRes, budgetsRes] = await Promise.all([
    getPaginatedOrders({ page: 1, pageSize: 6 }),
    getPaginatedOrders({ page: 1, pageSize: 1, status: "pending" }),
    getPaginatedOrders({ page: 1, pageSize: 1, status: "processing" }),
    getPaginatedBudgets({ page: 1, pageSize: 6 }),
  ]);

  const recentOrders = ordersRes.data || [];
  const pendingCount = pendingOrdersRes.total || 0;
  const processingCount = processingOrdersRes.total || 0;
  const totalOrdersCount = ordersRes.total || 0;
  const totalBudgetsCount = budgetsRes.total || 0;

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                Panel de Administración
              </h1>
              <Badge variant="outline" className="text-accent-deep border-accent-deep/30 bg-sky-50 font-bold text-xs">
                {ctx.isAdmin ? "Rol: ADMIN Central" : "Rol: Administración"}
              </Badge>
            </div>
            <p className="text-sm text-stone-500">
              Bienvenido, <strong className="text-stone-850 font-semibold">{ctx.profileName}</strong>. Gestión de presupuestos, órdenes de fábrica y entrega.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button variant="primary" asChild className="bg-accent-deep hover:bg-accent-hover text-white shadow-xs">
              <Link href="/administracion/presupuestos/nuevo" className="flex items-center gap-2">
                <FilePlus className="w-4 h-4" />
                <span>Nuevo Presupuesto</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-stone-300 hover:bg-stone-50">
              <Link href="/administracion/pedidos" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Ver Pedidos</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Tarjetas de Métricas Operativas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-amber-200/70 bg-amber-50/40 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Pendientes de Fábrica
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-900">{pendingCount}</div>
            <p className="text-xs text-amber-700/80 mt-1">Pedidos aguardando inicio de producción</p>
          </Card>

          <Card className="p-5 border-sky-200/70 bg-sky-50/40 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                En Producción
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-sky-900">{processingCount}</div>
            <p className="text-xs text-sky-700/80 mt-1">En fabricación en planta</p>
          </Card>

          <Card className="p-5 border-emerald-200/70 bg-emerald-50/40 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Total de Pedidos
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-900">{totalOrdersCount}</div>
            <p className="text-xs text-emerald-700/80 mt-1">Órdenes registradas históricas y activas</p>
          </Card>

          <Card className="p-5 border-stone-200 bg-white rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Presupuestos
              </span>
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-stone-900">{totalBudgetsCount}</div>
            <p className="text-xs text-stone-500 mt-1">Cotizaciones emitidas en el sistema</p>
          </Card>
        </div>

        {/* Accesos de Flujo Administrativo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-accent-deep/10 text-accent-deep flex items-center justify-center mb-4">
                <FilePlus className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Emisión de Presupuestos</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Creá cotizaciones para cualquier cliente conservando su vendedor asignado. Descuentos, alícuotas e ítems oficiales unificados.
              </p>
            </div>
            <Button variant="outline" asChild className="mt-6 w-full justify-between">
              <Link href="/administracion/presupuestos/nuevo">
                <span>Crear Presupuesto</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Control de Producción</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Supervisá y avanzá los estados de los pedidos: de pendiente a fabricación y entrega final. Cancelaciones con reposición de saldos.
              </p>
            </div>
            <Button variant="outline" asChild className="mt-6 w-full justify-between">
              <Link href="/administracion/pedidos">
                <span>Gestionar Pedidos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">Facturación</h3>
                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-800 bg-amber-50 font-mono">
                  Próximamente
                </Badge>
              </div>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Módulo preparado para conciliación fiscal y facturación electrónica. Sin emisión de comprobantes en este sprint.
              </p>
            </div>
            <Button variant="outline" asChild className="mt-6 w-full justify-between">
              <Link href="/administracion/facturacion">
                <span>Ver Módulo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabla de Pedidos Recientes */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-stone-200/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Últimos Pedidos</h2>
              <p className="text-xs text-stone-500">Monitoreo en tiempo real de pedidos recibidos</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/administracion/pedidos" className="flex items-center gap-1.5 text-xs font-semibold">
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3">N° Pedido</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Canal</th>
                  <th className="px-5 py-3">Asesor Asignado</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-center">Estado</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-stone-400">
                      No hay pedidos registrados en el sistema.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const statusConfig: Record<string, { label: string; color: string }> = {
                      pending: { label: "Pendiente", color: "bg-amber-50 text-amber-800 border-amber-200" },
                      processing: { label: "En Producción", color: "bg-sky-50 text-sky-800 border-sky-200" },
                      delivered: { label: "Entregado", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                      cancelled: { label: "Cancelado", color: "bg-red-50 text-red-800 border-red-200" },
                      completed: { label: "Completado", color: "bg-stone-100 text-stone-700 border-stone-200" },
                    };
                    const badge = statusConfig[order.status] || { label: order.status, color: "bg-stone-50 text-stone-600" };

                    return (
                      <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-bold font-mono text-stone-900">
                          #{order.order_number}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-stone-850 block">{order.clients?.name || "Cliente"}</span>
                          {order.clients?.company_name && (
                            <span className="text-[10px] text-stone-400">{order.clients.company_name}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            order.sale_channel === "distributor" ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {order.sale_channel === "distributor" ? "Distribuidor" : "Directo Fábrica"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-stone-600">
                          {order.sellers?.full_name || "Sin asignar"}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-stone-900">
                          {formatCurrencyARS(order.total_amount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2.5">
                            <Link href={`/administracion/pedidos/${order.id}`}>
                              Detalle
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección Superadmin (Gestión del Rol Administración) */}
        {ctx.isAdmin && (
          <div className="bg-stone-900 text-stone-200 p-6 rounded-2xl border border-stone-800 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-gold" />
                  <h3 className="text-base font-bold text-white">Administración de Usuarios</h3>
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  Como ADMIN Central, podés crear cuentas de personal administrativo o asignar el rol a usuarios existentes.
                </p>
              </div>
              <Button variant="primary" asChild className="bg-accent-gold hover:bg-accent-gold-hover text-stone-900 font-bold text-xs">
                <Link href="/administracion/usuarios">
                  Gestionar Usuarios Administración
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdministrationShell>
  );
}
