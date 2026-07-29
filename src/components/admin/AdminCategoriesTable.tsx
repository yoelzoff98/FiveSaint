"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Eye, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface TableCategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
}

export function AdminCategoriesTable({ categories }: { categories: TableCategory[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseás eliminar permanentemente la categoría "${name}"?`)) {
      return;
    }

    setLoading(id);
    const supabase = createSupabaseBrowserClient();
    
    const { error } = await supabase
      .from("product_categories")
      .delete()
      .eq("id", id);
      
    if (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        alert("No se puede eliminar la categoría porque tiene productos asociados. Primero debes cambiar la categoría de esos productos o eliminarlos.");
      } else {
        alert("Error al eliminar: " + error.message);
      }
    } else {
      router.refresh();
    }
    setLoading(null);
  };

  if (categories.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border border-stone-200">
        <p className="text-stone-500">No hay categorías disponibles.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500 font-semibold">
              <th className="p-4">Orden</th>
              <th className="p-4">Nombre / Slug</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {categories.map(c => (
              <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                <td className="p-4 text-stone-500 text-sm">{c.sortOrder}</td>
                <td className="p-4 text-stone-900 font-medium">
                  {c.name}
                  <div className="text-xs text-stone-400 font-normal">{c.slug}</div>
                </td>
                <td className="p-4 text-center">
                  {c.isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-stone-300 mx-auto" />
                  )}
                </td>
                <td className="p-4 flex items-center justify-end gap-2">
                  <Link
                    href={`/productos?categoria=${c.slug}`}
                    target="_blank"
                    className="p-2 text-stone-400 hover:text-accent-deep transition-colors"
                    title="Ver en catálogo"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/admin-FiveSaint/categorias/${c.id}/editar`}
                    className="p-2 text-stone-400 hover:text-accent-deep transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    disabled={loading === c.id}
                    className={`p-2 transition-colors text-stone-400 hover:text-red-600`}
                    title="Eliminar permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
