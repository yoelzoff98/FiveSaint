import { requireAdmin } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";
import { getAdminProducts } from "@/lib/supabase/admin-products";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { PlusSquare } from "lucide-react";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getAdminProducts();

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Productos</h1>
            <p className="text-stone-500">Gestioná el catálogo de Five Saint</p>
          </div>
          <Button variant="primary" asChild>
            <Link href="/admin-FiveSaint/productos/nuevo" className="flex items-center gap-2">
              <PlusSquare className="w-4 h-4" />
              Nuevo Producto
            </Link>
          </Button>
        </div>

        <AdminProductsTable products={products} />
      </div>
    </AdminShell>
  );
}
