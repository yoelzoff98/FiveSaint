import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getClients } from "@/lib/supabase/comercial";
import { NewBudgetClient } from "@/app/admin-comercial/presupuestos/nuevo/NewBudgetClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdministrationNewBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const ctx = await requireAdministrationUser();
  const clients = await getClients();
  const resolvedSearchParams = await searchParams;

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/administracion/presupuestos"
            className="p-2 rounded-lg hover:bg-stone-200/60 text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Nuevo Presupuesto Administrativo
            </h1>
            <p className="text-xs text-stone-500">
              Cotización oficial emitida desde Administración para clientes asignados.
            </p>
          </div>
        </div>

        <NewBudgetClient
          clients={clients}
          initialClientId={resolvedSearchParams.clientId}
          userId={ctx.user?.id}
          redirectBase="/administracion/presupuestos"
        />
      </div>
    </AdministrationShell>
  );
}
