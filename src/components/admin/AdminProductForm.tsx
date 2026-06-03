"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminProductInput } from "@/lib/supabase/admin-products";
import { createProductAction, updateProductAction } from "@/app/admin-FiveSaint/productos/actions";
import { Button } from "@/components/ui/Button";

interface AdminProductFormProps {
  categories: { id: string; name: string }[];
  initialData?: any; // Datos del producto si es edición
  mode: "create" | "edit";
  onSuccessRedirect?: "list" | "edit";
}

export function AdminProductForm({ categories, initialData, mode, onSuccessRedirect = "list" }: AdminProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse arrays a string con saltos de línea para el textarea inicial
  const arrayToString = (arr: string[]) => (arr ? arr.join("\n") : "");

  const [formData, setFormData] = useState({
    categoryId: initialData?.categoryId || (categories.length > 0 ? categories[0].id : ""),
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    shortDescription: initialData?.shortDescription || "",
    description: initialData?.description || "",
    features: arrayToString(initialData?.features || []),
    applications: arrayToString(initialData?.applications || []),
    technicalNotes: arrayToString(initialData?.technicalNotes || []),
    badge: initialData?.badge || "",
    isFeatured: initialData?.isFeatured || false,
    isActive: initialData?.isActive ?? true,
    sortOrder: initialData?.sortOrder || 0,
    seoTitle: initialData?.seoTitle || "",
    seoDescription: initialData?.seoDescription || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    // Convertir textareas a array eliminando líneas vacías
    const stringToArray = (str: string) => str.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);

    const input: AdminProductInput = {
      categoryId: formData.categoryId,
      name: formData.name,
      slug: formData.slug,
      shortDescription: formData.shortDescription,
      description: formData.description,
      features: stringToArray(formData.features),
      applications: stringToArray(formData.applications),
      technicalNotes: stringToArray(formData.technicalNotes),
      badge: formData.badge || null,
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      sortOrder: Number(formData.sortOrder),
      seoTitle: formData.seoTitle || null,
      seoDescription: formData.seoDescription || null,
    };

    let result;
    if (mode === "create") {
      result = await createProductAction(input);
    } else {
      result = await updateProductAction(initialData.id, input);
    }

    if (!result.success) {
      setError(result.error);
      setLoading(false);
    } else {
      if (mode === "create") {
        router.push(`/admin-FiveSaint/productos/${result.data.id}/editar?created=1`);
      } else {
        if (onSuccessRedirect === "list") {
          router.push("/admin-FiveSaint/productos");
        } else {
          // Si editamos y no queremos volver a la lista, simplemente refrescamos para ver los cambios
          alert("Producto guardado correctamente.");
          setLoading(false);
        }
      }
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
            <label className="text-sm font-semibold text-stone-700">Nombre del Producto *</label>
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
            <label className="text-sm font-semibold text-stone-700">Categoría *</label>
            <select required name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep">
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Descripción Corta</label>
            <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} rows={2} className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Descripción Completa</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Badge (Etiqueta opcional)</label>
            <input type="text" name="badge" value={formData.badge} onChange={handleChange} placeholder="Ej: Nuevo, Destacado" className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>
        </div>

        {/* Columna 2 */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Características (1 por línea)</label>
            <textarea name="features" value={formData.features} onChange={handleChange} rows={4} placeholder="Escribí una característica por línea..." className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Aplicaciones (1 por línea)</label>
            <textarea name="applications" value={formData.applications} onChange={handleChange} rows={3} placeholder="Hogar&#10;Hotelería&#10;Spa" className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-stone-700">Notas Técnicas (1 por línea)</label>
            <textarea name="technicalNotes" value={formData.technicalNotes} onChange={handleChange} rows={3} placeholder="Voltaje: 220V&#10;Capacidad: 250 Lts" className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-accent-deep" />
          </div>

          <div className="flex gap-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-800 cursor-pointer">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-4 h-4 text-accent-deep rounded border-stone-300" />
              Activo Público
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-stone-800 cursor-pointer">
              <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="w-4 h-4 text-accent-deep rounded border-stone-300" />
              Destacado (Home)
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
        <Button variant="outline" type="button" onClick={() => router.push("/admin-FiveSaint/productos")}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Producto"}
        </Button>
      </div>
    </form>
  );
}
