import { requireAdmin } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { AdminImageUploader } from "@/components/admin/AdminImageUploader";
import { getAdminCategories } from "@/lib/supabase/admin-products";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getAdminCategories();

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Crear Producto</h1>
          <p className="text-stone-500">Agregá un nuevo producto al catálogo público</p>
        </div>

        <AdminProductForm categories={categories} mode="create" />
        
        <AdminImageUploader productId="" existingImages={[]} />
      </div>
    </AdminShell>
  );
}
