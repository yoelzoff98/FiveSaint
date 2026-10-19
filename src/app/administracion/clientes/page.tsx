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
    assignment?: string;
    sort?: string;
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
  const assignment=["assigned","unassigned"].includes(params.assignment||"")?params.assignment!:"all";
  const sort=["name","updated"].includes(params.sort||"")?params.sort!:"newest";

  const [paginatedClients, sellers] = await Promise.all([
    getPaginatedClientsAdmin({
      page,
      pageSize: 20,
      search,
      status,
      sellerId,
      category,assignment,sort
    }),
    getSellers()
  ]);

  return (
    <AdministrationShell>
      <div className="w-full min-w-0">
        <ClientsAdminClient
          key={`${page}:${search}:${status}:${sellerId}:${category}:${assignment}:${sort}`}
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
          initialAssignment={assignment}
          initialSort={sort}
          isAdmin={ctx.isAdmin}
        />
      </div>
    </AdministrationShell>
  );
}
