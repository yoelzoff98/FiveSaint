import { supabase } from './client';
import { 
  SupabaseProductCategoryRow, 
  SupabaseProductWithRelations, 
  SupabaseProductImageRow,
  SupabaseProductFileRow,
  SupabaseProductVariantRow
} from './types';
import { Product, ProductCategory, ProductImage, ProductFile, ProductVariant } from '@/types/product';

/**
 * Mapea una fila de categoría de Supabase a la interfaz ProductCategory
 */
function mapCategoryRowToProductCategory(row: SupabaseProductCategoryRow): ProductCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    href: `/productos?categoria=${row.slug}`, // Opcional, pero mantenemos una convención
    sortOrder: row.sort_order,
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt,
  };
}

/**
 * Mapea una fila de variante de Supabase a la interfaz ProductVariant
 */
function mapVariantRowToProductVariant(row: SupabaseProductVariantRow): ProductVariant {
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

/**
 * Mapea una fila de producto de Supabase (con relaciones) a la interfaz Product
 */
function mapProductRowToProduct(row: SupabaseProductWithRelations): Product {
  const images: ProductImage[] = (row.product_images || [])
    .map(img => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      sortOrder: img.sort_order,
      isCover: img.is_cover,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const files: ProductFile[] = (row.product_files || [])
    .filter(f => f.is_active)
    .map(file => ({
      id: file.id,
      name: file.name,
      fileUrl: file.file_url,
      fileType: file.file_type,
      sortOrder: file.sort_order,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const variants: ProductVariant[] = (row.product_variants || [])
    .filter(v => v.is_active)
    .map(mapVariantRowToProductVariant)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  let coverImage = images.find(img => img.isCover) || null;
  if (!coverImage && images.length > 0) {
    coverImage = images[0];
  }

  const categoryName = row.product_categories?.name || 'Categoría Desconocida';
  const categorySlug = row.product_categories?.slug || 'unknown';

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
    categoryName,
    categorySlug,
    shortDescription: row.short_description || '',
    description: row.description || '',
    features: row.features || [],
    applications: row.applications || [],
    technicalNotes: row.technical_notes || [],
    href: `/productos/${row.slug}`,
    badge: row.badge,
    isFeatured: row.is_featured,
    image: coverImage,
    images,
    files,
    variants,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

/**
 * Obtiene todas las categorías activas
 */
export async function getProductCategories(): Promise<ProductCategory[]> {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map(mapCategoryRowToProductCategory);
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return [];
  }
}

/**
 * Obtiene todos los productos activos con sus relaciones
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (*),
        product_images (*),
        product_files (*),
        product_variants (*)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return (data as SupabaseProductWithRelations[]).map(mapProductRowToProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Obtiene productos destacados
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (*),
        product_images (*),
        product_files (*),
        product_variants (*)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return (data as SupabaseProductWithRelations[]).map(mapProductRowToProduct);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

/**
 * Obtiene un producto por su slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (*),
        product_images (*),
        product_files (*),
        product_variants (*)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }
    if (!data) return null;

    return mapProductRowToProduct(data as SupabaseProductWithRelations);
  } catch (error) {
    console.error(`Error fetching product by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Obtiene productos por el slug de la categoría
 */
export async function getProductsByCategorySlug(categorySlug: string): Promise<Product[]> {
  try {
    const { data: categoryData, error: categoryError } = await supabase
      .from('product_categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .single();
      
    if (categoryError || !categoryData) {
      return [];
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (*),
        product_images (*),
        product_files (*),
        product_variants (*)
      `)
      .eq('category_id', categoryData.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return (data as SupabaseProductWithRelations[]).map(mapProductRowToProduct);
  } catch (error) {
    console.error(`Error fetching products by category slug ${categorySlug}:`, error);
    return [];
  }
}

/**
 * Obtiene productos relacionados a uno dado
 */
export async function getRelatedProducts(product: Product, limit: number = 3): Promise<Product[]> {
  try {
    // Primero, buscar en la misma categoría, excluyendo el actual
    let { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (*),
        product_images (*),
        product_files (*),
        product_variants (*)
      `)
      .eq('category_id', product.categoryId)
      .eq('is_active', true)
      .neq('id', product.id)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) throw error;
    
    let results = data as SupabaseProductWithRelations[];

    // Si no hay suficientes, completar con otros activos
    if (results.length < limit) {
      const { data: moreData, error: moreError } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (*),
          product_images (*),
          product_files (*),
          product_variants (*)
        `)
        .eq('is_active', true)
        .neq('id', product.id)
        // Opcional: no traer los que ya están en results (aunque en la práctica es raro que pase con neq category y limit bajo)
        .neq('category_id', product.categoryId)
        .order('sort_order', { ascending: true })
        .limit(limit - results.length);
        
      if (!moreError && moreData) {
        results = [...results, ...(moreData as SupabaseProductWithRelations[])];
      }
    }

    return results.map(mapProductRowToProduct);
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}
