import { requireCommercialUser, getClients, getSellers } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { ClientsPageClient } from "./ClientsPageClient";

export default async function ClientsPage() {
  const ctx = await requireCommercialUser();
  const clients = await getClients();
  
  // Cargar lista de vendedores solo si el usuario es administrador
  const sellers = ctx.isAdmin ? await getSellers() : [];

  return (
    <CommercialShell>
      <ClientsPageClient 
        initialClients={clients} 
        sellers={sellers} 
        isAdmin={ctx.isAdmin} 
      />
    </CommercialShell>
  );
}
