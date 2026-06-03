import { requireAdmin } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { AdminImageUploader } from "@/components/admin/AdminImageUploader";
import { AdminVariantsManager } from "@/components/admin/AdminVariantsManager";
import { getAdminProductById, getAdminCategories } from "@/lib/supabase/admin-products";
import { getAdminProductVariants } from "@/lib/supabase/admin-variants";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface RouteParams {
  id: string;
}

type Params = Promise<RouteParams>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function EditProductPage(props: { params: Params, searchParams: SearchParams }) {
  await requireAdmin();
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const isCreated = searchParams.created === "1";

  const [product, categories, variants] = await Promise.all([
    getAdminProductById(id),
    getAdminCategories(),
    getAdminProductVariants(id)
  ]);

  if (!product) {
    notFound();
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/admin-FiveSaint/productos" className="p-2 text-stone-400 hover:text-stone-900 transition-colors bg-white rounded-full border border-stone-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Editar: {product.name}</h1>
            <p className="text-stone-500 text-sm">Modificá la información o gestioná la galería de imágenes.</p>
          </div>
        </div>

        {isCreated && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl shadow-sm font-medium">
            ✅ Producto creado correctamente. Ahora podés cargar imágenes para este producto.
          </div>
        )}

        <AdminProductForm categories={categories} initialData={product} mode="edit" onSuccessRedirect="edit" />
        
        <AdminImageUploader productId={product.id} existingImages={product.images || []} />
        
        <AdminVariantsManager productId={product.id} initialVariants={variants} />
      </div>
    </AdminShell>
  );
}
