import { requireCommercialUser, getPaginatedOrders, getPaginatedBudgets } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { OrdersListClient } from "./OrdersListClient";

interface OrdersPageProps {
  searchParams?: Promise<{
    page?: string;
    status?: string;
    saleChannel?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const ctx = await requireCommercialUser();
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const status = params.status || "all";
  const saleChannel = params.saleChannel || "all";

  const [ordersResult, budgetsResult] = await Promise.all([
    getPaginatedOrders({ page, pageSize: 20, status, saleChannel }),
    getPaginatedBudgets({ page: 1, pageSize: 50, status: "distributor_sale" })
  ]);

  return (
    <CommercialShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Ventas</h1>
          <p className="text-stone-500 text-sm">Gestioná las órdenes de fábrica y las ventas concretadas por distribuidores.</p>
        </div>

        <OrdersListClient
          initialOrders={ordersResult.data}
          totalOrdersCount={ordersResult.total}
          serverPage={ordersResult.page}
          serverPageSize={ordersResult.pageSize}
          serverTotalPages={ordersResult.totalPages}
          initialBudgets={budgetsResult.data}
          initialStatus={status}
          initialSaleChannel={saleChannel}
          isAdmin={ctx.isAdmin}
        />
      </div>
    </CommercialShell>
  );
}
