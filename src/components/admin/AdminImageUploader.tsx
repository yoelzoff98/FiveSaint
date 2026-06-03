"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/storage";
import { Trash2, Star, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminImageUploaderProps {
  productId: string;
  existingImages: any[];
}

export function AdminImageUploader({ productId, existingImages }: AdminImageUploaderProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!productId) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mt-8 text-center">
        <p className="text-stone-500 font-medium">Guardá el producto antes de cargar imágenes.</p>
      </div>
    );
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación básica
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5MB.");
      return;
    }

    setUploading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();

    try {
      // 1. Subir al Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${productId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      // 2. Obtener URL Pública
      const { data: publicUrlData } = supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      const isFirstImage = existingImages.length === 0;

      // 3. Insertar en tabla public.product_images
      const { error: dbError } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          url: publicUrlData.publicUrl,
          alt: file.name,
          sort_order: existingImages.length + 1,
          is_cover: isFirstImage, // Si es la primera, por defecto es cover
        });

      if (dbError) throw dbError;

      router.refresh(); // Refrescar para ver la imagen en la UI
    } catch (err: any) {
      console.error(err);
      setError("Error al subir imagen. ¿Están configuradas las Policies en Storage para usuarios autenticados? " + err.message);
    } finally {
      setUploading(false);
      // Limpiar input file
      e.target.value = '';
    }
  };

  const handleSetCover = async (imageId: string) => {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    
    // Primero, quitar cover a todos los del producto
    await supabase.from("product_images").update({ is_cover: false }).eq("product_id", productId);
    
    // Luego, poner cover al seleccionado
    const { error } = await supabase.from("product_images").update({ is_cover: true }).eq("id", imageId);
    
    if (error) setError(error.message);
    else router.refresh();
  };

  const handleDelete = async (imageId: string, url: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return;
    
    setDeletingId(imageId);
    setError(null);
    const supabase = createSupabaseBrowserClient();

    // Intentar deducir el filePath de la URL
    // Ejemplo URL: https://xyz.supabase.co/storage/v1/object/public/product-images/products/123/archivo.jpg
    // El path relativo al bucket sería lo que sigue después del nombre del bucket
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split(`/${PRODUCT_IMAGES_BUCKET}/`);
      if (parts.length > 1) {
        const relativePath = parts[1];
        await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([relativePath]);
      }
      
      // Borrar de base de datos
      await supabase.from("product_images").delete().eq("id", imageId);
      router.refresh();
    } catch (err: any) {
      setError("Error al eliminar imagen: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-stone-900 tracking-wide">Galería de Imágenes</h2>
          <p className="text-sm text-stone-500">Subí fotos del producto (Máx 5MB). La imagen principal se mostrará primero.</p>
        </div>
        
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button variant="primary" type="button" className="pointer-events-none" disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImagePlus className="w-4 h-4 mr-2" />}
            {uploading ? "Subiendo..." : "Subir Imagen"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 text-sm border border-red-200">
          {error}
        </div>
      )}

      {existingImages.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-stone-200 rounded-lg bg-stone-50">
          <p className="text-stone-500">Aún no hay imágenes para este producto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {existingImages.map((img) => (
            <div key={img.id} className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${img.is_cover ? 'border-amber-400' : 'border-stone-200'}`}>
              <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
              
              {/* Overlay de acciones */}
              <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <button
                    type="button"
                    title={img.is_cover ? "Ya es principal" : "Marcar como principal"}
                    onClick={() => handleSetCover(img.id)}
                    className={`p-1.5 rounded-full transition-colors ${img.is_cover ? 'bg-amber-400 text-white' : 'bg-white/20 text-white hover:bg-amber-400'}`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => handleDelete(img.id, img.url)}
                    disabled={deletingId === img.id}
                    className="p-1.5 rounded-full bg-white/20 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    {deletingId === img.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
                {img.is_cover && (
                  <span className="text-[10px] uppercase font-bold text-white tracking-widest text-center mb-1">
                    Principal
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
