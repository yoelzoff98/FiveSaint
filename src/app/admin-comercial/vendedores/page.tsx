import { requireCommercialUser, getSellers } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { SellersPageClient } from "./SellersPageClient";
import { redirect } from "next/navigation";

export default async function SellersPage() {
  const ctx = await requireCommercialUser();
  
  // Bloquear acceso a vendedores (solo admins)
  if (!ctx.isAdmin) {
    redirect("/admin-comercial/dashboard");
  }

  const sellers = await getSellers();

  return (
    <CommercialShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Vendedores y Accesos</h1>
          <p className="text-stone-500 text-sm">Administrá las cuentas de vendedores y controlá sus accesos al portal comercial.</p>
        </div>

        <SellersPageClient initialSellers={sellers} />
      </div>
    </CommercialShell>
  );
}
