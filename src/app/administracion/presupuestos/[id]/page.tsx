import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getBudgetById } from "@/lib/supabase/comercial";
import { BudgetDetailClient } from "@/app/admin-comercial/presupuestos/[id]/BudgetDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdministrationBudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdministrationUser();
  const resolvedParams = await params;
  const budget = await getBudgetById(resolvedParams.id);

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/administracion/presupuestos"
            className="p-2 rounded-lg hover:bg-stone-200/60 text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Presupuesto #{budget.budget_number}
            </h1>
            <p className="text-xs text-stone-500">
              Vista administrativa y control de emisión de comprobante
            </p>
          </div>
        </div>

        <BudgetDetailClient
          initialBudget={budget}
          ordersBasePath="/administracion/pedidos"
        />
      </div>
    </AdministrationShell>
  );
}
