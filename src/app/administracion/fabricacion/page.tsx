import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import {
  getManufacturingOrders,
  getPendingOrderItemsForManufacturing,
  getProductCompositions
} from "@/lib/supabase/manufacturing";
import { ManufacturingClient } from "./ManufacturingClient";

interface AdminManufacturingPageProps {
  searchParams?: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdministrationManufacturingPage({ searchParams }: AdminManufacturingPageProps) {
  await requireAdministrationUser();
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const search = params.search || "";
  const status = params.status || "all";

  const [paginatedOrders, pendingItems, compositions] = await Promise.all([
    getManufacturingOrders({
      page,
      pageSize: 20,
      search,
      status
    }),
    getPendingOrderItemsForManufacturing(),
    getProductCompositions({ status: "published" })
  ]);

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Preparación y Emisión de Órdenes de Fabricación
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Generación de órdenes técnicas para planta desde pedidos comerciales vigentes. Verificación de configuración e impresión en formato estricto de hoja única A4.
          </p>
        </div>

        <ManufacturingClient
          initialOrders={paginatedOrders.data}
          totalCount={paginatedOrders.total}
          serverPage={paginatedOrders.page}
          serverTotalPages={paginatedOrders.totalPages}
          pendingItems={pendingItems}
          compositions={compositions}
          initialSearch={search}
          initialStatus={status}
        />
      </div>
    </AdministrationShell>
  );
}
