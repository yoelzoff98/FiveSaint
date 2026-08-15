import { requireCommercialUser, getDistributors } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { DistributorsPageClient } from "./DistributorsPageClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Gestión de Distribuidores | Five Saint",
  description: "Sección de administración y lista de precios para distribuidores de Five Saint.",
};

export default async function DistributorsPage() {
  const ctx = await requireCommercialUser();

  // Solo el administrador puede ingresar a esta sección
  if (!ctx.isAdmin) {
    redirect("/admin-comercial/dashboard");
  }

  const distributors = await getDistributors();

  return (
    <CommercialShell>
      <DistributorsPageClient initialDistributors={distributors} />
    </CommercialShell>
  );
}
