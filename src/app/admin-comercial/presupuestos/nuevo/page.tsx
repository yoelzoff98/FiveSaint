import { requireCommercialUser, getClients } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { NewBudgetClient } from "./NewBudgetClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function NewBudgetPage({ searchParams }: PageProps) {
  await requireCommercialUser();
  const clients = await getClients();
  const { clientId } = await searchParams;

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
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Crear Presupuesto</h1>
          <p className="text-stone-500 text-sm">Armá una nueva cotización interactiva seleccionando productos del catálogo.</p>
        </div>

        <NewBudgetClient clients={clients} initialClientId={clientId} />
      </div>
    </CommercialShell>
  );
}
