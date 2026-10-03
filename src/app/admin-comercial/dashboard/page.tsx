import { requireCommercialUser, getDashboardAggregations } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const ctx = await requireCommercialUser();

  let clients: any[] = [];
  let budgets: any[] = [];
  let orders: any[] = [];
  let loadError: string | null = null;

  try {
    const agg = await getDashboardAggregations();
    clients = agg.clients;
    budgets = agg.budgets;
    orders = agg.orders;
  } catch (err: any) {
    console.error("Error cargando agregaciones del dashboard:", err);
    loadError = err.message || "Error al conectar con la base de datos comercial de Supabase.";
  }

  return (
    <CommercialShell>
      <DashboardClient
        initialClients={clients}
        initialBudgets={budgets}
        initialOrders={orders}
        profileName={ctx.profileName || (ctx.isAdmin ? "Administrador Five Saint" : "Vendedor")}
        isAdmin={ctx.isAdmin}
        loadError={loadError}
      />
    </CommercialShell>
  );
}
