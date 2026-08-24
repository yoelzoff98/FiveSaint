import { requireCommercialUser, getOrders, getBudgets } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { OrdersListClient } from "./OrdersListClient";

export default async function OrdersPage() {
  const ctx = await requireCommercialUser();
  const orders = await getOrders();
  const budgets = await getBudgets();

  return (
    <CommercialShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Ventas</h1>
          <p className="text-stone-500 text-sm">Gestioná las órdenes de fábrica y las ventas concretadas por distribuidores.</p>
        </div>

        <OrdersListClient initialOrders={orders} initialBudgets={budgets} isAdmin={ctx.isAdmin} />
      </div>
    </CommercialShell>
  );
}
