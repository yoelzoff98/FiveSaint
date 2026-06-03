import { products } from "@/data/products";
import { Product } from "@/types/product";

/**
 * Retorna todos los productos del catálogo (Sprint 5).
 * Devuelve un clon superficial para evitar la mutación del array original.
 * 
 * @returns Array de productos inmutable.
 */
export function getAllProducts(): Product[] {
  return [...products];
}

/**
 * Busca y retorna un producto del catálogo por su slug único.
 * 
 * @param slug - El identificador amigable del producto.
 * @returns El producto encontrado o undefined si no existe.
 */
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/**
 * Filtra y retorna los productos correspondientes a una categoría específica.
 * 
 * @param categoryId - El identificador único de la categoría.
 * @returns Array de productos filtrados.
 */
export function getProductsByCategory(categoryId: string): Product[] {
  return products.filter((p) => p.categoryId === categoryId);
}

/**
 * Calcula y retorna productos sugeridos/relacionados para un producto de referencia.
 * Prioriza productos de la misma categoría, excluyendo el producto actual.
 * Si no se alcanza el límite deseado con la misma categoría, se completa utilizando
 * otros productos del catálogo.
 * 
 * @param product - El producto de referencia para buscar relacionados.
 * @param limit - Límite máximo de productos a retornar (por defecto 3).
 * @returns Array de productos relacionados seleccionados.
 */
export function getRelatedProducts(product: Product, limit = 3): Product[] {
  // 1. Filtrar productos de la misma categoría, excluyendo el actual
  const sameCategoryRelated = products.filter(
    (p) => p.categoryId === product.categoryId && p.id !== product.id
  );

  // Si ya completamos el límite, los retornamos
  if (sameCategoryRelated.length >= limit) {
    return sameCategoryRelated.slice(0, limit);
  }

  // 2. Si faltan productos para alcanzar el límite, completamos con otras categorías (excluyendo el actual y los ya seleccionados)
  const remainingLimit = limit - sameCategoryRelated.length;
  const alreadySelectedIds = new Set([product.id, ...sameCategoryRelated.map((p) => p.id)]);
  
  const otherCategoryRelated = products.filter((p) => !alreadySelectedIds.has(p.id));

  return [...sameCategoryRelated, ...otherCategoryRelated.slice(0, remainingLimit)];
}
