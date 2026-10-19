import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getPaginatedClientsAdmin } from "@/lib/supabase/manufacturing";
import { getSellers } from "@/lib/supabase/comercial";
import { ClientsAdminClient } from "./ClientsAdminClient";

interface AdminClientsPageProps {
  searchParams?: Promise<{
    page?: string;
    search?: string;
    status?: string;
    sellerId?: string;
    category?: string;
  }>;
}

export default async function AdministrationClientsPage({ searchParams }: AdminClientsPageProps) {
  const ctx = await requireAdministrationUser();
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const search = params.search || "";
  const status = params.status || "all";
  const sellerId = params.sellerId || "all";
  const category = params.category || "all";

  const [paginatedClients, sellers] = await Promise.all([
    getPaginatedClientsAdmin({
      page,
      pageSize: 20,
      search,
      status,
      sellerId,
      category
    }),
    getSellers()
  ]);

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Gestión Centralizada de Clientes
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Consulta y supervisión de clientes de todos los vendedores. Creación con detección de duplicados y reasignación auditada de cartera.
          </p>
        </div>

        <ClientsAdminClient
          key={`${page}:${search}:${status}:${sellerId}:${category}`}
          initialClients={paginatedClients.data}
          totalCount={paginatedClients.total}
          serverPage={paginatedClients.page}
          serverPageSize={paginatedClients.pageSize}
          serverTotalPages={paginatedClients.totalPages}
          sellers={sellers}
          initialSearch={search}
          initialStatus={status}
          initialSellerId={sellerId}
          initialCategory={category}
          isAdmin={ctx.isAdmin}
        />
      </div>
    </AdministrationShell>
  );
}
