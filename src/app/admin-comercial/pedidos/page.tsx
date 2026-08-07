import { requireCommercialUser, getOrders } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { OrdersListClient } from "./OrdersListClient";

export default async function OrdersPage() {
  const ctx = await requireCommercialUser();
  const orders = await getOrders();

  return (
    <CommercialShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Pedidos de Fábrica</h1>
          <p className="text-stone-500 text-sm">Realizá el seguimiento de producción y entrega de tus pedidos confirmados.</p>
        </div>

        <OrdersListClient initialOrders={orders} isAdmin={ctx.isAdmin} />
      </div>
    </CommercialShell>
  );
}
