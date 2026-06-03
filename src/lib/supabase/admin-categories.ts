import { createSupabaseServerClient } from "./server";
import { requireAdmin } from "./admin";

export interface AdminCategoryInput {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  coverImageUrl: string;
  coverImageAlt: string;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export async function getAdminCategories() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("product_categories")
    .select(`
      id, name, slug, short_description, description, cover_image_url, cover_image_alt, sort_order, is_active, seo_title, seo_description
    `)
    .order("sort_order", { ascending: true });

  if (error) throw new Error("Error obteniendo categorías.");
  
  return data.map((item: { 
    id: string; name: string; slug: string; short_description: string | null; description: string | null; cover_image_url: string | null; cover_image_alt: string | null; sort_order: number; is_active: boolean; seo_title: string | null; seo_description: string | null;
  }) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    shortDescription: item.short_description || "",
    description: item.description || "",
    coverImageUrl: item.cover_image_url || "",
    coverImageAlt: item.cover_image_alt || "",
    sortOrder: item.sort_order,
    isActive: item.is_active,
    seoTitle: item.seo_title || "",
    seoDescription: item.seo_description || ""
  }));
}

export async function getAdminCategoryById(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    shortDescription: data.short_description || "",
    description: data.description || "",
    coverImageUrl: data.cover_image_url || "",
    coverImageAlt: data.cover_image_alt || "",
    sortOrder: data.sort_order,
    isActive: data.is_active,
    seoTitle: data.seo_title || "",
    seoDescription: data.seo_description || ""
  };
}

export async function createAdminCategory(input: AdminCategoryInput) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("product_categories")
    .insert([{
      name: input.name,
      slug: input.slug,
      short_description: input.shortDescription || null,
      description: input.description || null,
      cover_image_url: input.coverImageUrl || null,
      cover_image_alt: input.coverImageAlt || null,
      sort_order: input.sortOrder,
      is_active: input.isActive,
      seo_title: input.seoTitle || null,
      seo_description: input.seoDescription || null,
    }])
    .select()
    .single();

  if (error) {
    console.error("Create Category Error:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function updateAdminCategory(id: string, input: AdminCategoryInput) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("product_categories")
    .update({
      name: input.name,
      slug: input.slug,
      short_description: input.shortDescription || null,
      description: input.description || null,
      cover_image_url: input.coverImageUrl || null,
      cover_image_alt: input.coverImageAlt || null,
      sort_order: input.sortOrder,
      is_active: input.isActive,
      seo_title: input.seoTitle || null,
      seo_description: input.seoDescription || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update Category Error:", error);
    throw new Error(error.message);
  }
  return data;
}

export async function deactivateCategory(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("product_categories")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Deactivate Category Error:", error);
    throw new Error(error.message);
  }
  return true;
}
