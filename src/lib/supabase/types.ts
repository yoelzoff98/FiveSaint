/**
 * Tipos de TypeScript manuales para las tablas de Supabase necesarias.
 */

export interface SupabaseProductCategoryRow {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseProductImageRow {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface SupabaseProductFileRow {
  id: string;
  product_id: string;
  name: string;
  file_url: string;
  file_type: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface SupabaseProductRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  features: string[] | null;
  applications: string[] | null;
  technical_notes: string[] | null;
  badge: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseProductVariantRow {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  size_label: string | null;
  capacity_label: string | null;
  features: string[] | null;
  equipment: string[] | null;
  technical_notes: string[] | null;
  plan_file_url: string | null;
  plan_file_name: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseProductWithRelations extends SupabaseProductRow {
  product_categories: SupabaseProductCategoryRow | null;
  product_images?: SupabaseProductImageRow[];
  product_files?: SupabaseProductFileRow[];
  product_variants?: SupabaseProductVariantRow[];
}
