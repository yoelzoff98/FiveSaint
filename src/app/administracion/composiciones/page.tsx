import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getProductCompositions, getSupplies } from "@/lib/supabase/manufacturing";
import { getAdminProducts } from "@/lib/supabase/admin-products";
import { CompositionsClient } from "./CompositionsClient";
import { CatalogBindingForm } from "./CatalogBindingForm";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function AdministrationCompositionsPage() {
  await requireAdministrationUser();
  const db = createSupabaseAdminClient();
  const [variants, bindings] = await Promise.all([
    db.from("product_variants").select("id,product_id,name").eq("is_active", true),
    db.from("catalog_manufacturing_bindings").select("catalog_key,product_id,variant_id")
  ]);
  if (variants.error || bindings.error) throw new Error("No se pudieron cargar las vinculaciones técnicas.");

  const [compositions, products, supplies] = await Promise.all([
    getProductCompositions(),
    getAdminProducts(),
    getSupplies({ isActive: true })
  ]);

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Composiciones Técnicas Base (BOM Versionado)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Estructuras de materiales vinculadas a los productos del catálogo. Versionado inmutable: las órdenes emitidas conservan su trazabilidad exacta.
          </p>
        </div>

        <CatalogBindingForm products={products} variants={variants.data || []} bindings={bindings.data || []} />
        <CompositionsClient
          initialCompositions={compositions}
          products={products}
          supplies={supplies}
        />
      </div>
    </AdministrationShell>
  );
}
