import { requireCommercialUser, getDistributorById } from "@/lib/supabase/comercial";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import Link from "next/link";
import { 
  Building2, 
  ArrowLeft, 
  Percent, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  ShoppingBag, 
  Calendar 
} from "lucide-react";
import { DistributorDiscountEditor } from "./DistributorDiscountEditor";

interface DistributorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DistributorDetailPage({ params }: DistributorDetailPageProps) {
  const ctx = await requireCommercialUser();
  const resolvedParams = await params;
  const distributorId = resolvedParams.id;

  // Solo admin o el propio distribuidor pueden ver esta vista
  if (!ctx.isAdmin && !(ctx.isDistributor && ctx.distributorId === distributorId)) {
    return (
      <CommercialShell>
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
          No tenés permisos para visualizar esta sección.
        </div>
      </CommercialShell>
    );
  }

  const distributor = await getDistributorById(distributorId);
  const supabase = await createSupabaseServerClient();

  // Obtener Presupuestos del distribuidor
  const { data: budgets } = await supabase
    .from("budgets")
    .select("*, clients(name)")
    .eq("distributor_id", distributorId)
    .order("created_at", { ascending: false });

  // Obtener Pedidos a fábrica del distribuidor
  const { data: orders } = await supabase
    .from("orders")
    .select("*, clients(name)")
    .eq("distributor_id", distributorId)
    .order("created_at", { ascending: false });

  const formattedDiscount = Number(distributor.discount_percentage || 0);

  return (
    <CommercialShell>
      <div className="flex flex-col gap-6">
        {/* Nav Regreso */}
        <div>
          {ctx.isAdmin ? (
            <Link 
              href="/admin-comercial/distribuidores"
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al listado de Distribuidores
            </Link>
          ) : (
            <Link 
              href="/admin-comercial/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Link>
          )}

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent-deep/10 text-accent-deep flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">{distributor.company_name}</h1>
                  <p className="text-stone-500 text-sm">Contacto: {distributor.contact_name}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-4 pt-4 border-t border-stone-150">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span>{distributor.email}</span>
                </div>
                {distributor.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{distributor.phone}</span>
                  </div>
                )}
                {distributor.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{distributor.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Registrado: {new Date(distributor.created_at).toLocaleDateString("es-AR")}</span>
                </div>
              </div>
            </div>

            {/* Badge Porcentaje de Descuento (editable si es admin) */}
            <DistributorDiscountEditor 
              distributorId={distributor.id} 
              initialDiscount={formattedDiscount} 
              isAdmin={ctx.isAdmin} 
            />
          </div>
        </div>

        {/* Tablas de Presupuestos y Pedidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Presupuestos Enviados */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-stone-150 pb-3">
              <h2 className="font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-deep" />
                Presupuestos Realizados ({budgets?.length || 0})
              </h2>
            </div>

            <div className="flex-1 overflow-x-auto">
              {!budgets || budgets.length === 0 ? (
                <p className="text-xs text-stone-500 py-8 text-center">No hay presupuestos registrados aún para este distribuidor.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                      <th className="py-2">N°</th>
                      <th className="py-2">Cliente</th>
                      <th className="py-2">Estado</th>
                      <th className="py-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {budgets.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 font-bold text-stone-900">#{b.budget_number}</td>
                        <td className="py-2.5 text-stone-700">{b.clients?.name || "Sin cliente"}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-stone-100 text-stone-700">
                            {b.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-stone-900">
                          ${Number(b.total_amount).toLocaleString("es-AR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pedidos a Fábrica */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-stone-150 pb-3">
              <h2 className="font-bold text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-accent-deep" />
                Pedidos a Fábrica ({orders?.length || 0})
              </h2>
            </div>

            <div className="flex-1 overflow-x-auto">
              {!orders || orders.length === 0 ? (
                <p className="text-xs text-stone-500 py-8 text-center">No hay pedidos a fábrica registrados aún para este distribuidor.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                      <th className="py-2">N° Pedido</th>
                      <th className="py-2">Cliente</th>
                      <th className="py-2">Estado</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 font-bold text-stone-900">#{o.order_number}</td>
                        <td className="py-2.5 text-stone-700">{o.clients?.name || "Pedido directo"}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-stone-900">
                          ${Number(o.total_amount).toLocaleString("es-AR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </CommercialShell>
  );
}
