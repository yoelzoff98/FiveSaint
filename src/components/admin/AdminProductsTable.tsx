"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Eye, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface TableProduct {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export function AdminProductsTable({ products }: { products: TableProduct[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseás desactivar el producto "${name}"? Dejará de ser visible en la web.`)) {
      return;
    }

    setLoading(id);
    const supabase = createSupabaseBrowserClient();
    
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);
      
    if (error) {
      alert("Error al desactivar: " + error.message);
    } else {
      router.refresh();
    }
    setLoading(null);
  };

  if (products.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border border-stone-200">
        <p className="text-stone-500">No hay productos disponibles.</p>
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
              <th className="p-4">Nombre</th>
              <th className="p-4">Categoría</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-center">Destacado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                <td className="p-4 text-stone-500 text-sm">{p.sortOrder}</td>
                <td className="p-4 text-stone-900 font-medium">
                  {p.name}
                  <div className="text-xs text-stone-400 font-normal">{p.slug}</div>
                </td>
                <td className="p-4 text-stone-600 text-sm">
                  <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs">{p.categoryName}</span>
                </td>
                <td className="p-4 text-center">
                  {p.isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-stone-300 mx-auto" />
                  )}
                </td>
                <td className="p-4 text-center">
                  {p.isFeatured ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-500 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-stone-300 mx-auto" />
                  )}
                </td>
                <td className="p-4 flex items-center justify-end gap-2">
                  <Link
                    href={`/productos/${p.slug}`}
                    target="_blank"
                    className="p-2 text-stone-400 hover:text-accent-deep transition-colors"
                    title="Ver página pública"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/admin-FiveSaint/productos/${p.id}/editar`}
                    className="p-2 text-stone-400 hover:text-accent-deep transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeactivate(p.id, p.name)}
                    disabled={loading === p.id || !p.isActive}
                    className={`p-2 transition-colors ${
                      !p.isActive ? "text-stone-200 cursor-not-allowed" : "text-stone-400 hover:text-red-600"
                    }`}
                    title={p.isActive ? "Desactivar" : "Ya desactivado"}
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
