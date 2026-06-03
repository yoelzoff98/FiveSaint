"use client";

import { ProductCategory } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductCategoryFilterProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onCategoryChange: (categorySlug: string) => void;
}

/**
 * Filtro de Categorías (ProductCategoryFilter - Sprint 4).
 * Renderiza una botonera responsive de píldoras ("pills") para filtrar productos.
 * Soporta scroll/envoltura horizontal para dispositivos móviles y transiciones suaves de color.
 */
export function ProductCategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: ProductCategoryFilterProps) {
  // Combinamos la opción "Todos" con el listado oficial de categorías
  const filterOptions = [{ slug: "all", name: "Todos" }, ...categories];

  return (
    <div className="w-full py-4 border-y border-stone-200/50 my-6">
      <div 
        className="flex flex-wrap items-center justify-start gap-2.5 sm:justify-center"
        role="tablist"
        aria-label="Filtrar catálogo de productos por categoría"
      >
        {filterOptions.map((opt) => {
          const isActive = selectedCategory === opt.slug;
          return (
            <button
              key={opt.slug}
              onClick={() => onCategoryChange(opt.slug)}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer border",
                isActive
                  ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                  : "bg-white text-stone-600 border-stone-200 hover:text-stone-950 hover:bg-stone-50 hover:border-stone-300"
              )}
            >
              {opt.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default ProductCategoryFilter;
