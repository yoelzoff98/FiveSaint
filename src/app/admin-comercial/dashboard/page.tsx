import { requireCommercialUser, getClients, getBudgets, getOrders } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const ctx = await requireCommercialUser();

  // Cargar datos del usuario conectado (filtrado automáticamente por la lib)
  const [clients, budgets, orders] = await Promise.all([
    getClients().catch(() => []),
    getBudgets().catch(() => []),
    getOrders().catch(() => [])
  ]);

  return (
    <CommercialShell>
      <DashboardClient
        initialClients={(clients as any) || []}
        initialBudgets={(budgets as any) || []}
        initialOrders={(orders as any) || []}
        profileName={ctx.profileName || (ctx.isAdmin ? "Administrador Five Saint" : "Vendedor")}
        isAdmin={ctx.isAdmin}
      />
    </CommercialShell>
  );
}
