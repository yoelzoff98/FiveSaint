import { createSupabaseServerClient } from "./server";
import { requireAdmin } from "./admin";
import { AdminProductVariant, AdminVariantInput } from "@/types/admin";
import { SupabaseProductVariantRow } from "./types";

function mapVariantRowToAdmin(row: SupabaseProductVariantRow): AdminProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    description: row.description,
    sizeLabel: row.size_label,
    capacityLabel: row.capacity_label,
    features: row.features || [],
    equipment: row.equipment || [],
    technicalNotes: row.technical_notes || [],
    planFileUrl: row.plan_file_url,
    planFileName: row.plan_file_name,
    isActive: row.is_active,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

export async function getAdminProductVariants(productId: string): Promise<AdminProductVariant[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    // No filtramos por is_active en admin para que puedan ver las inactivas
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching admin product variants:", error);
    throw new Error(error.message);
  }

  return (data as SupabaseProductVariantRow[]).map(mapVariantRowToAdmin);
}

export async function getAdminVariantById(id: string): Promise<AdminProductVariant | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw new Error(error.message);
  }

  return mapVariantRowToAdmin(data as SupabaseProductVariantRow);
}

async function handleDefaultVariant(productId: string, variantIdToKeep: string | null = null) {
  const supabase = await createSupabaseServerClient();
  // Set all other variants of this product to is_default = false
  const query = supabase
    .from("product_variants")
    .update({ is_default: false })
    .eq("product_id", productId);
    
  if (variantIdToKeep) {
    await query.neq("id", variantIdToKeep);
  } else {
    await query;
  }
}

export async function createAdminVariant(input: AdminVariantInput): Promise<AdminProductVariant> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  if (input.isDefault) {
    await handleDefaultVariant(input.productId);
  }

  const { data, error } = await supabase
    .from("product_variants")
    .insert([{
      product_id: input.productId,
      name: input.name,
      slug: input.slug,
      short_description: input.shortDescription,
      description: input.description,
      size_label: input.sizeLabel,
      capacity_label: input.capacityLabel,
      features: input.features,
      equipment: input.equipment,
      technical_notes: input.technicalNotes,
      plan_file_url: input.planFileUrl,
      plan_file_name: input.planFileName,
      is_active: input.isActive,
      is_default: input.isDefault,
      sort_order: input.sortOrder,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
    }])
    .select()
    .single();

  if (error) {
    console.error("Create Variant Error:", error);
    throw new Error(error.message);
  }
  
  return mapVariantRowToAdmin(data as SupabaseProductVariantRow);
}

export async function updateAdminVariant(id: string, input: AdminVariantInput): Promise<AdminProductVariant> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  if (input.isDefault) {
    await handleDefaultVariant(input.productId, id);
  }

  const { data, error } = await supabase
    .from("product_variants")
    .update({
      product_id: input.productId,
      name: input.name,
      slug: input.slug,
      short_description: input.shortDescription,
      description: input.description,
      size_label: input.sizeLabel,
      capacity_label: input.capacityLabel,
      features: input.features,
      equipment: input.equipment,
      technical_notes: input.technicalNotes,
      plan_file_url: input.planFileUrl,
      plan_file_name: input.planFileName,
      is_active: input.isActive,
      is_default: input.isDefault,
      sort_order: input.sortOrder,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update Variant Error:", error);
    throw new Error(error.message);
  }

  return mapVariantRowToAdmin(data as SupabaseProductVariantRow);
}

export async function deactivateAdminVariant(id: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("product_variants")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Deactivate Variant Error:", error);
    throw new Error(error.message);
  }
  return true;
}
