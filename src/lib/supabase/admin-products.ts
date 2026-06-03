import { createSupabaseServerClient } from "./server";
import { requireAdmin } from "./admin";

export interface AdminProductInput {
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  features: string[];
  applications: string[];
  technicalNotes: string[];
  badge: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
}

export async function getAdminCategories() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });

  if (error) throw new Error("Error obteniendo categorías.");
  return data;
}

export async function getAdminProducts() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, badge, is_featured, is_active, sort_order, category_id,
      product_categories(name)
    `)
    .order("sort_order", { ascending: true });

  if (error) throw new Error("Error obteniendo productos.");
  
  return data.map((item: { 
    id: string; name: string; slug: string; badge: string | null; 
    is_featured: boolean; is_active: boolean; sort_order: number; 
    category_id: string; product_categories: { name: string } | { name: string }[] | null 
  }) => {
    // Manejar casos donde Supabase retorna array o un solo objeto para relaciones
    const categoryName = Array.isArray(item.product_categories) 
      ? item.product_categories[0]?.name 
      : item.product_categories?.name;
      
    return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    badge: item.badge,
    isFeatured: item.is_featured,
    isActive: item.is_active,
    sortOrder: item.sort_order,
    categoryId: item.category_id,
    categoryName: categoryName || "Sin categoría"
  };
});
}

export async function getAdminProductById(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_categories(name),
      product_images(*)
    `)
    .eq("id", id)
    .single();

  if (error) return null;
  
  const categoryName = Array.isArray(data.product_categories) 
    ? data.product_categories[0]?.name 
    : data.product_categories?.name;

  // Transformar de snake_case a camelCase para el form
  return {
    id: data.id,
    categoryId: data.category_id,
    categoryName: categoryName,
    name: data.name,
    slug: data.slug,
    shortDescription: data.short_description || "",
    description: data.description || "",
    features: data.features || [],
    applications: data.applications || [],
    technicalNotes: data.technical_notes || [],
    badge: data.badge || "",
    isFeatured: data.is_featured,
    isActive: data.is_active,
    sortOrder: data.sort_order,
    seoTitle: data.seo_title || "",
    seoDescription: data.seo_description || "",
    images: (data.product_images || []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
  };
}

export async function createAdminProduct(input: AdminProductInput) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .insert([{
      category_id: input.categoryId,
      name: input.name,
      slug: input.slug,
      short_description: input.shortDescription,
      description: input.description,
      features: input.features,
      applications: input.applications,
      technical_notes: input.technicalNotes,
      badge: input.badge,
      is_featured: input.isFeatured,
      is_active: input.isActive,
      sort_order: input.sortOrder,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
    }])
    .select()
    .single();

  if (error) {
    console.error("Create Product Error:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function updateAdminProduct(id: string, input: AdminProductInput) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      name: input.name,
      slug: input.slug,
      short_description: input.shortDescription,
      description: input.description,
      features: input.features,
      applications: input.applications,
      technical_notes: input.technicalNotes,
      badge: input.badge,
      is_featured: input.isFeatured,
      is_active: input.isActive,
      sort_order: input.sortOrder,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update Product Error:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteOrDeactivateProduct(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  // Soft delete recomendado por los requerimientos
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Deactivate Product Error:", error);
    throw new Error(error.message);
  }
  return true;
}
