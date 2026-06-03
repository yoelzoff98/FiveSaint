import { requireAdmin } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDashboardCards, DashboardStats } from "@/components/admin/AdminDashboardCards";
import { getAdminProducts, getAdminCategories } from "@/lib/supabase/admin-products";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { PlusSquare, Package } from "lucide-react";

export default async function DashboardPage() {
  await requireAdmin();

  // Cargar datos en paralelo
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getAdminCategories()
  ]);

  const stats: DashboardStats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.isActive).length,
    featuredProducts: products.filter(p => p.isFeatured).length,
    activeCategories: categories.length,
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Hola, Administrador</h1>
          <p className="text-stone-500">Resumen del catálogo de Five Saint</p>
        </div>

        <AdminDashboardCards stats={stats} />

        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-stone-800 mb-4">Accesos Rápidos</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" asChild>
              <Link href="/admin-FiveSaint/productos/nuevo" className="flex items-center gap-2">
                <PlusSquare className="w-4 h-4" />
                Crear Producto
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin-FiveSaint/productos" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Gestionar Catálogo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
