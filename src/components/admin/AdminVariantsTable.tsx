"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminProductVariant } from "@/types/admin";
import { deactivateVariantAction } from "@/app/admin-FiveSaint/variantes/actions";
import { Edit, Star, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminVariantsTableProps {
  variants: AdminProductVariant[];
}

export function AdminVariantsTable({ variants }: AdminVariantsTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDeactivate = async (id: string) => {
    if (!confirm("¿Estás seguro de que querés desactivar esta variante? No se mostrará más al público.")) return;
    
    setLoadingId(id);
    const result = await deactivateVariantAction(id);
    if (!result.success) {
      alert(result.error);
    }
    setLoadingId(null);
  };

  if (variants.length === 0) {
    return (
      <div className="bg-stone-50 border border-stone-200 border-dashed rounded-xl p-8 text-center">
        <p className="text-stone-500">Este producto todavía no tiene variantes cargadas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-600">
          <thead className="bg-stone-50 text-stone-900 border-b border-stone-200">
            <tr>
              <th className="px-6 py-4 font-semibold w-16 text-center">Orden</th>
              <th className="px-6 py-4 font-semibold">Variante</th>
              <th className="px-6 py-4 font-semibold hidden md:table-cell">Medida / Capacidad</th>
              <th className="px-6 py-4 font-semibold text-center">Predet.</th>
              <th className="px-6 py-4 font-semibold text-center">Estado</th>
              <th className="px-6 py-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {variants.map((variant) => (
              <tr key={variant.id} className={`hover:bg-stone-50 transition-colors ${!variant.isActive ? "opacity-60 bg-stone-50" : ""}`}>
                <td className="px-6 py-4 text-center font-medium text-stone-500">{variant.sortOrder}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-stone-900">{variant.name}</div>
                  <div className="text-xs text-stone-400 font-mono mt-0.5">{variant.slug}</div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell text-sm">
                  <div className="flex flex-col gap-1">
                    {variant.sizeLabel ? <span>📏 {variant.sizeLabel}</span> : null}
                    {variant.capacityLabel ? <span>👥 {variant.capacityLabel}</span> : null}
                    {!variant.sizeLabel && !variant.capacityLabel && <span className="text-stone-400 italic">No especificado</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {variant.isDefault ? (
                    <span className="inline-flex items-center justify-center bg-amber-100 text-amber-600 p-1 rounded-full" title="Variante Predeterminada">
                      <Star className="w-4 h-4 fill-amber-500" />
                    </span>
                  ) : (
                    <span className="text-stone-300">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {variant.isActive ? (
                    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <Check className="w-3 h-3" />
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <X className="w-3 h-3" />
                      Inactiva
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild className="h-8 px-3 text-xs bg-white">
                      <Link href={`/admin-FiveSaint/variantes/${variant.id}/editar`}>
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Editar
                      </Link>
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeactivate(variant.id)}
                      disabled={loadingId === variant.id || !variant.isActive}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Desactivar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
