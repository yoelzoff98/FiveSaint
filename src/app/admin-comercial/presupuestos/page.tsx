import { requireCommercialUser, getBudgets } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { BudgetsListClient } from "./BudgetsListClient";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function BudgetsPage() {
  const ctx = await requireCommercialUser();
  const budgets = await getBudgets();

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

        <BudgetsListClient initialBudgets={budgets} isAdmin={ctx.isAdmin} />
      </div>
    </CommercialShell>
  );
}
