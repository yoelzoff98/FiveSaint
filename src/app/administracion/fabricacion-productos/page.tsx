import { requireAdministrationUser } from "@/lib/supabase/administration";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import {
  getProductCompositions,
  getProductCompositionById,
  getSupplies,
  getConfigurableOptions,
} from "@/lib/supabase/manufacturing";
import { ProductManufacturingClient } from "./ProductManufacturingClient";
import { CatalogBindingForm } from "../composiciones/CatalogBindingForm";

export default async function ProductManufacturingPage({
  searchParams,
}: {
  searchParams: Promise<{
    product?: string;
    variant?: string;
    recipe?: string;
  }>;
}) {
  await requireAdministrationUser();
  const params = await searchParams;
  const db = createSupabaseAdminClient();
  // Administración comparte el catálogo: no requiere los permisos del editor de catálogo del superadmin.
  const [productResult, variantResult, compositions, supplies] =
    await Promise.all([
      db.from("products").select("id,name,is_active").order("name"),
      db
        .from("product_variants")
        .select("id,product_id,name,is_active")
        .order("name"),
      getProductCompositions(),
      getSupplies({ isActive: "all" }),
    ]);
  if (productResult.error || variantResult.error)
    throw new Error("No se pudo cargar el catálogo de productos.");
  const products = productResult.data || [];
  const variants = variantResult.data || [];
  const product = products.find((p) => p.id === params.product);
  const variant = variants.find(
    (v) => v.id === params.variant && v.product_id === product?.id,
  );
  const matching = compositions.filter(
    (c) =>
      c.product_id === product?.id &&
      (c.variant_id || null) === (variant?.id || null),
  );
  const current = params.recipe
    ? compositions.find(
        (c) =>
          c.id === params.recipe &&
          c.product_id === product?.id &&
          c.status !== "retired",
      )
    : matching.find((c) => c.status === "published") ||
      matching.find(
        (c) =>
          c.status === "draft" &&
          !c.technical_notes?.includes("Excel composiciones "),
      );
  const [recipe, options, bindings] = product
    ? await Promise.all([
        current ? getProductCompositionById(current.id) : Promise.resolve(null),
        getConfigurableOptions({ productId: product.id }),
        db
          .from("catalog_manufacturing_bindings")
          .select("catalog_key,product_id,variant_id")
          .eq("product_id", product.id),
      ])
    : [null, [], null];
  if (bindings?.error)
    throw new Error(
      "No se pudieron cargar los artículos de venta del producto.",
    );
  return (
    <AdministrationShell>
      <div className="max-w-6xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Fabricación de productos</h1>
          <p className="text-sm text-stone-500 mt-1">
            Elegí un producto y detallá qué lleva y cómo se fabrica.
          </p>
        </div>
        <ProductManufacturingClient
          key={`${product?.id}:${variant?.id}:${recipe?.id}`}
          products={products}
          variants={variants}
          compositions={compositions}
          supplies={supplies}
          productId={product?.id || ""}
          variantId={variant?.id || ""}
          recipe={recipe}
          options={options}
        />
        {product && (
          <details className="border rounded-xl bg-white p-4 text-sm">
            <summary className="cursor-pointer text-stone-500">
              Relación con artículos de venta (configuración avanzada)
            </summary>
            <CatalogBindingForm
              products={[product]}
              variants={variants.filter((v) => v.product_id === product.id)}
              bindings={bindings?.data || []}
              fixedProductId={product.id}
            />
          </details>
        )}
      </div>
    </AdministrationShell>
  );
}
