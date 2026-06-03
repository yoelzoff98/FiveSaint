import { Card } from "@/components/ui/Card";
import { Package, CheckCircle, Star, FolderTree } from "lucide-react";

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  activeCategories: number;
}

export function AdminDashboardCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="flex items-center gap-4 p-6 bg-white border border-stone-200 shadow-sm" padding="none">
        <div className="p-3 bg-stone-100 text-stone-600 rounded-lg shrink-0">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Productos</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{stats.totalProducts}</p>
        </div>
      </Card>
      
      <Card className="flex items-center gap-4 p-6 bg-white border border-stone-200 shadow-sm" padding="none">
        <div className="p-3 bg-green-50 text-green-600 rounded-lg shrink-0">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Activos</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{stats.activeProducts}</p>
        </div>
      </Card>
      
      <Card className="flex items-center gap-4 p-6 bg-white border border-stone-200 shadow-sm" padding="none">
        <div className="p-3 bg-amber-50 text-amber-500 rounded-lg shrink-0">
          <Star className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Destacados</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{stats.featuredProducts}</p>
        </div>
      </Card>

      <Card className="flex items-center gap-4 p-6 bg-white border border-stone-200 shadow-sm" padding="none">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
          <FolderTree className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Categorías Activas</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{stats.activeCategories}</p>
        </div>
      </Card>
    </div>
  );
}
