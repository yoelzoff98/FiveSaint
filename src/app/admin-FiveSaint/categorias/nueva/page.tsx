import { requireAdmin } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminCategoryForm } from "@/components/admin/AdminCategoryForm";

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Crear Categoría</h1>
          <p className="text-stone-500">Agregá una nueva línea de productos al catálogo público</p>
        </div>

        <AdminCategoryForm mode="create" />
      </div>
    </AdminShell>
  );
}
