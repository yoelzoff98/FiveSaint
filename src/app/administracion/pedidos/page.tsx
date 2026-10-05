import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getPaginatedOrders, getPaginatedBudgets } from "@/lib/supabase/comercial";
import { OrdersListClient } from "@/app/admin-comercial/pedidos/OrdersListClient";

interface AdministrationOrdersPageProps {
  searchParams?: Promise<{
    page?: string;
    search?: string;
    status?: string;
    saleChannel?: string;
  }>;
}

export default async function AdministrationOrdersPage({ searchParams }: AdministrationOrdersPageProps) {
  await requireAdministrationUser();
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const status = params.status || "all";
  const search = params.search || "";
  const saleChannel = params.saleChannel || "all";

  const [paginatedOrders, paginatedDistributorBudgets] = await Promise.all([
    getPaginatedOrders({
      page,
      pageSize: 20,
      status,
      search,
      saleChannel
    }),
    getPaginatedBudgets({
      page: 1,
      pageSize: 50,
      status: "distributor_sale"
    })
  ]);

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Gestión y Control de Pedidos
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Supervisá el estado de fabricación de pedidos a fábrica y ventas de distribuidores en tiempo real.
          </p>
        </div>

        <OrdersListClient
          initialOrders={paginatedOrders.data}
          totalOrdersCount={paginatedOrders.total}
          serverPage={paginatedOrders.page}
          serverPageSize={paginatedOrders.pageSize}
          serverTotalPages={paginatedOrders.totalPages}
          initialBudgets={paginatedDistributorBudgets.data}
          initialStatus={status}
          initialSaleChannel={saleChannel}
          isAdmin={true}
          ordersBasePath="/administracion/pedidos"
          budgetsBasePath="/administracion/presupuestos"
        />
      </div>
    </AdministrationShell>
  );
}
