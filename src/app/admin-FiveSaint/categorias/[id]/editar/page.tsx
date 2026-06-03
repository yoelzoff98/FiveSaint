import { requireAdmin } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminCategoryForm } from "@/components/admin/AdminCategoryForm";
import { getAdminCategoryById } from "@/lib/supabase/admin-categories";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface RouteParams {
  id: string;
}

type Params = Promise<RouteParams>;

export default async function EditCategoryPage(props: { params: Params }) {
  await requireAdmin();
  const { id } = await props.params;

  const category = await getAdminCategoryById(id);

  if (!category) {
    notFound();
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/admin-FiveSaint/categorias" className="p-2 text-stone-400 hover:text-stone-900 transition-colors bg-white rounded-full border border-stone-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Editar: {category.name}</h1>
            <p className="text-stone-500 text-sm">Modificá la información de la línea de productos.</p>
          </div>
        </div>

        <AdminCategoryForm initialData={category} mode="edit" />
      </div>
    </AdminShell>
  );
}
