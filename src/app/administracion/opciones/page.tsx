import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getConfigurableOptions, getSupplies } from "@/lib/supabase/manufacturing";
import { getAdminProducts } from "@/lib/supabase/admin-products";
import { OptionsClient } from "./OptionsClient";

export default async function AdministrationOptionsPage() {
  await requireAdministrationUser();

  const [options, products, supplies] = await Promise.all([
    getConfigurableOptions(),
    getAdminProducts(),
    getSupplies({ isActive: true })
  ]);

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Opciones Configurables y Reglas de Insumos
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Definición de variantes técnicas para vendedores (jets, posición de motor, accesorios). Distinción estricta entre opciones de solo montaje y opciones que modifican materiales.
          </p>
        </div>

        <OptionsClient
          initialOptions={options}
          products={products}
          supplies={supplies}
        />
      </div>
    </AdministrationShell>
  );
}
