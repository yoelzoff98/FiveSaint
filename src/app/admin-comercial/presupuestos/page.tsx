import { requireCommercialUser, getPaginatedBudgets } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { BudgetsListClient } from "./BudgetsListClient";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BudgetsPageProps {
  searchParams?: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const ctx = await requireCommercialUser();
  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const search = params.search || "";
  const status = params.status || "all";

  const paginatedResult = await getPaginatedBudgets({
    page,
    pageSize: 20,
    search,
    status
  });

  return (
    <CommercialShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Presupuestos</h1>
            <p className="text-stone-500 text-sm">Gestioná las cotizaciones enviadas a tus clientes.</p>
          </div>
          <Button asChild className="flex items-center gap-2 cursor-pointer">
            <Link href="/admin-comercial/presupuestos/nuevo">
              <Plus className="w-4 h-4" />
              Nuevo Presupuesto
            </Link>
          </Button>
        </div>

        <BudgetsListClient
          initialBudgets={paginatedResult.data}
          totalCount={paginatedResult.total}
          serverPage={paginatedResult.page}
          serverPageSize={paginatedResult.pageSize}
          serverTotalPages={paginatedResult.totalPages}
          initialSearch={search}
          initialStatus={status}
          isAdmin={ctx.isAdmin}
        />
      </div>
    </CommercialShell>
  );
}
