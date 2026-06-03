"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCategoryInput } from "@/lib/supabase/admin-categories";
import { createCategoryAction, updateCategoryAction } from "@/app/admin-FiveSaint/categorias/actions";
import { Button } from "@/components/ui/Button";

interface AdminCategoryFormProps {
  initialData?: any; // Datos de la categoría si es edición
  mode: "create" | "edit";
}

export function AdminCategoryForm({ initialData, mode }: AdminCategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    coverImageUrl: initialData?.coverImageUrl || "",
    coverImageAlt: initialData?.coverImageAlt || "",
    isActive: initialData?.isActive ?? true,
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

    const input: AdminCategoryInput = {
      name: formData.name,
      slug: formData.slug,
      shortDescription: formData.shortDescription,
      description: formData.description,
      coverImageUrl: formData.coverImageUrl,
      coverImageAlt: formData.coverImageAlt,
      isActive: formData.isActive,
      sortOrder: Number(formData.sortOrder),
      seoTitle: formData.seoTitle,
      seoDescription: formData.seoDescription,
    };

    let result;
    if (mode === "create") {
      result = await createCategoryAction(input);
    } else {
      result = await updateCategoryAction(initialData.id, input);
    }

    if (!result.success) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/admin-FiveSaint/categorias");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-stone-200">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna 1 */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Nombre de Categoría *</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700 flex justify-between">
              <span>Slug (URL) *</span>
              <button type="button" onClick={handleGenerateSlug} className="text-accent-deep hover:underline text-xs">Generar desde nombre</button>
            </label>
            <input required type="text" name="slug" value={formData.slug} onChange={handleChange} pattern="^[a-z0-9-]+$" title="Solo letras minúsculas, números y guiones" className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Descripción Corta</label>
            <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} rows={2} className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Descripción Completa</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>
        </div>

        {/* Columna 2 */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">URL Imagen Portada</label>
            <input type="text" name="coverImageUrl" value={formData.coverImageUrl} onChange={handleChange} placeholder="https://..." className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Texto Alt Imagen Portada</label>
            <input type="text" name="coverImageAlt" value={formData.coverImageAlt} onChange={handleChange} className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex gap-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-800 cursor-pointer">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-4 h-4 text-accent-deep rounded border-stone-300" />
              Activa en Público
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Orden de visualización</label>
            <input required type="number" name="sortOrder" value={formData.sortOrder} onChange={handleChange} min="0" className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="mt-10 flex justify-end gap-4 border-t border-stone-200 pt-6">
        <Button variant="outline" type="button" onClick={() => router.push("/admin-FiveSaint/categorias")}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Categoría"}
        </Button>
      </div>
    </form>
  );
}
