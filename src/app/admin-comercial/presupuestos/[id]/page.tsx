import { requireCommercialUser, getBudgetById } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { BudgetDetailClient } from "./BudgetDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BudgetDetailPage({ params }: PageProps) {
  await requireCommercialUser();
  const { id } = await params;
  const budget = await getBudgetById(id);

  return (
    <CommercialShell>
      <div className="flex flex-col gap-6">
        <div>
          <Button variant="ghost" asChild className="mb-4 -ml-4 cursor-pointer">
            <Link href="/admin-comercial/presupuestos" className="flex items-center gap-2 text-stone-500 hover:text-stone-900">
              <ArrowLeft className="w-4 h-4" />
              Volver a Presupuestos
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Detalle de Presupuesto</h1>
          <p className="text-stone-500 text-sm">Gestioná e interactuá con esta cotización.</p>
        </div>

        <BudgetDetailClient initialBudget={budget} />
      </div>
    </CommercialShell>
  );
}
