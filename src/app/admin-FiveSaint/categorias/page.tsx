import { requireAdmin } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminCategoriesTable } from "@/components/admin/AdminCategoriesTable";
import { getAdminCategories } from "@/lib/supabase/admin-categories";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { FolderPlus } from "lucide-react";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getAdminCategories();

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Categorías</h1>
            <p className="text-stone-500">Gestioná las líneas principales del catálogo</p>
          </div>
          <Button variant="primary" asChild>
            <Link href="/admin-FiveSaint/categorias/nueva" className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              Nueva Categoría
            </Link>
          </Button>
        </div>

        <AdminCategoriesTable categories={categories} />
      </div>
    </AdminShell>
  );
}
