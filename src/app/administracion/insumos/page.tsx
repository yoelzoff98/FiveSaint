import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getSupplies } from "@/lib/supabase/manufacturing";
import { SuppliesClient } from "./SuppliesClient";

export default async function AdministrationSuppliesPage() {
  await requireAdministrationUser();
  const supplies = await getSupplies({ isActive: 'all' });

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Catálogo Técnico de Insumos
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Mantenimiento de insumos y materias primas para composiciones de fabricación. Soporte de unidades de medida (enteras y decimales).
          </p>
        </div>

        <SuppliesClient initialSupplies={supplies} />
      </div>
    </AdministrationShell>
  );
}
