"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminProductVariant, AdminVariantInput } from "@/types/admin";
import { createVariantAction, updateVariantAction } from "@/app/admin-FiveSaint/variantes/actions";
import { Button } from "@/components/ui/Button";

interface AdminVariantFormProps {
  productId: string;
  initialData?: AdminProductVariant;
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AdminVariantForm({ productId, initialData, mode, onSuccess, onCancel }: AdminVariantFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const arrayToString = (arr: string[]) => (arr ? arr.join("\n") : "");

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    sizeLabel: initialData?.sizeLabel || "",
    capacityLabel: initialData?.capacityLabel || "",
    features: arrayToString(initialData?.features || []),
    equipment: arrayToString(initialData?.equipment || []),
    technicalNotes: arrayToString(initialData?.technicalNotes || []),
    planFileUrl: initialData?.planFileUrl || "",
    planFileName: initialData?.planFileName || "",
    isActive: initialData?.isActive ?? true,
    isDefault: initialData?.isDefault || false,
    sortOrder: initialData?.sortOrder || 0,
    seoTitle: initialData?.seoTitle || "",
    seoDescription: initialData?.seoDescription || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleGenerateSlug = () => {
    if (!formData.name) return;
    const slug = formData.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const stringToArray = (str: string) => str.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);

    const input: AdminVariantInput = {
      productId,
      name: formData.name,
      slug: formData.slug,
      shortDescription: formData.shortDescription || null,
      description: formData.description || null,
      sizeLabel: formData.sizeLabel || null,
      capacityLabel: formData.capacityLabel || null,
      features: stringToArray(formData.features),
      equipment: stringToArray(formData.equipment),
      technicalNotes: stringToArray(formData.technicalNotes),
      planFileUrl: formData.planFileUrl || null,
      planFileName: formData.planFileName || null,
      isActive: formData.isActive,
      isDefault: formData.isDefault,
      sortOrder: Number(formData.sortOrder),
      seoTitle: formData.seoTitle || null,
      seoDescription: formData.seoDescription || null,
    };

    let result;
    if (mode === "create") {
      result = await createVariantAction(input);
    } else {
      if (!initialData) return;
      result = await updateVariantAction(initialData.id, input);
    }

    if (!result.success) {
      setError(result.error);
      setLoading(false);
    } else {
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirección por defecto al producto padre
        router.push(`/admin-FiveSaint/productos/${productId}/editar`);
        router.refresh();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Nombre de la Variante *</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Basic, Confort, 150x80" className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700 flex justify-between">
              <span>Slug (URL) *</span>
              <button type="button" onClick={handleGenerateSlug} className="text-accent-deep hover:underline text-xs">Generar desde nombre</button>
            </label>
            <input required type="text" name="slug" value={formData.slug} onChange={handleChange} pattern="^[a-z0-9-]+$" title="Solo letras minúsculas, números y guiones" className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-700">Etiqueta de Medida</label>
              <input type="text" name="sizeLabel" value={formData.sizeLabel} onChange={handleChange} placeholder="Ej: 150x80x42 cm" className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-700">Etiqueta de Capacidad</label>
              <input type="text" name="capacityLabel" value={formData.capacityLabel} onChange={handleChange} placeholder="Ej: 2 personas" className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Descripción Corta</label>
            <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} rows={2} className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Descripción Completa</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-700">URL del Plano (PDF)</label>
              <input type="url" name="planFileUrl" value={formData.planFileUrl} onChange={handleChange} placeholder="https://..." className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-700">Nombre del Plano</label>
              <input type="text" name="planFileName" value={formData.planFileName} onChange={handleChange} placeholder="Ej: Plano Técnico Confort" className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Características (1 por línea)</label>
            <textarea name="features" value={formData.features} onChange={handleChange} rows={3} placeholder="Piso antideslizante&#10;Acrílico reforzado..." className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Equipamiento Incluido (1 por línea)</label>
            <textarea name="equipment" value={formData.equipment} onChange={handleChange} rows={3} placeholder="4 jets dirigibles&#10;Bomba 1HP..." className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Notas Técnicas (1 por línea)</label>
            <textarea name="technicalNotes" value={formData.technicalNotes} onChange={handleChange} rows={3} placeholder="Voltaje: 220V..." className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-800 cursor-pointer">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-4 h-4 text-accent-deep rounded border-stone-300" />
              Variante Activa
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-stone-800 cursor-pointer">
              <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} className="w-4 h-4 text-amber-500 rounded border-stone-300" />
              Predeterminada (Destaca por sobre las demás)
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Orden de visualización</label>
            <input required type="number" name="sortOrder" value={formData.sortOrder} onChange={handleChange} min="0" className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-stone-500 uppercase">SEO Title</label>
              <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="w-full px-4 py-2 border border-stone-300 rounded-md text-sm" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-stone-500 uppercase">SEO Description</label>
              <input type="text" name="seoDescription" value={formData.seoDescription} onChange={handleChange} className="w-full px-4 py-2 border border-stone-300 rounded-md text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-stone-100">
        <Button variant="outline" type="button" onClick={onCancel ? onCancel : () => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? "Guardando..." : mode === "create" ? "Crear Variante" : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
