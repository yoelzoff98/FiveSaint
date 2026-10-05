import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getPaginatedBudgets } from "@/lib/supabase/comercial";
import { BudgetsListClient } from "@/app/admin-comercial/presupuestos/BudgetsListClient";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdministrationBudgetsPageProps {
  searchParams?: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdministrationBudgetsPage({ searchParams }: AdministrationBudgetsPageProps) {
  const ctx = await requireAdministrationUser();
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
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Presupuestos Emitidos</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Control general de cotizaciones, descarga de comprobantes oficiales y conversión a pedidos.
            </p>
          </div>
          <Button asChild className="bg-accent-deep hover:bg-accent-hover text-white shadow-xs font-semibold text-xs">
            <Link href="/administracion/presupuestos/nuevo" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Nuevo Presupuesto</span>
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
          isAdmin={true}
          basePath="/administracion/presupuestos"
        />
      </div>
    </AdministrationShell>
  );
}
