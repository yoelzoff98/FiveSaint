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
    <div className="w-full py-2 my-2 sm:my-4">
      <div 
        className="flex flex-wrap items-center justify-start gap-2 sm:justify-center bg-stone-100/80 p-2 rounded-3xl sm:rounded-full border border-stone-200/60 shadow-inner"
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
                "px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer",
                isActive
                  ? "bg-white text-accent-deep shadow-md border border-white"
                  : "bg-transparent text-stone-500 border border-transparent hover:text-stone-900 hover:bg-white/60 hover:shadow-sm"
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
