import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getClientById, getSellers, getBudgets, getOrders, getClientNotes } from "@/lib/supabase/comercial";
import { getClientAssignmentHistory } from "@/lib/supabase/manufacturing";
import { ClientAdminDetailClient } from "./ClientAdminDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AdminClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminClientDetailPage({ params }: AdminClientDetailPageProps) {
  await requireAdministrationUser();
  const resolvedParams = await params;
  const clientId = resolvedParams.id;

  const [client, history, sellers, allBudgets, allOrders, notes] = await Promise.all([
    getClientById(clientId),
    getClientAssignmentHistory(clientId),
    getSellers(),
    getBudgets(),
    getOrders(),
    getClientNotes(clientId)
  ]);

  // Filtrar presupuestos y pedidos que correspondan a este cliente
  const clientBudgets = allBudgets.filter((b: any) => b.client_id === clientId);
  const clientOrders = allOrders.filter((o: any) => o.client_id === clientId);

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/administracion/clientes"
            className="p-2 rounded-lg hover:bg-stone-200/60 text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Ficha del Cliente: {client.name}
            </h1>
            <p className="text-xs text-stone-500">
              Supervisión administrativa, historial de reasignaciones y operaciones comerciales vinculadas.
            </p>
          </div>
        </div>

        <ClientAdminDetailClient
          initialClient={client}
          history={history}
          sellers={sellers}
          budgets={clientBudgets}
          orders={clientOrders}
          initialNotes={notes}
        />
      </div>
    </AdministrationShell>
  );
}
