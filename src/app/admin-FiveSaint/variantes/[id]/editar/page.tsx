import { requireAdmin } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminVariantForm } from "@/components/admin/AdminVariantForm";
import { getAdminVariantById } from "@/lib/supabase/admin-variants";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface RouteParams {
  id: string;
}

type Params = Promise<RouteParams>;

export default async function EditVariantPage(props: { params: Params }) {
  await requireAdmin();
  const { id } = await props.params;

  const variant = await getAdminVariantById(id);

  if (!variant) {
    notFound();
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href={`/admin-FiveSaint/productos/${variant.productId}/editar`} className="p-2 text-stone-400 hover:text-stone-900 transition-colors bg-white rounded-full border border-stone-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Editar Variante: {variant.name}</h1>
            <p className="text-stone-500 text-sm">Modificá las características de esta versión del producto.</p>
          </div>
        </div>

        <AdminVariantForm productId={variant.productId} initialData={variant} mode="edit" />
      </div>
    </AdminShell>
  );
}
