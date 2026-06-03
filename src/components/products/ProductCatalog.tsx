"use client";

import * as React from "react";
import { Product, ProductCategory } from "@/types/product";
import { Container } from "@/components/ui/Container";
import ProductCategoryFilter from "./ProductCategoryFilter";
import ProductCard from "./ProductCard";
import { ShieldAlert } from "lucide-react";

interface ProductCatalogProps {
  products: Product[];
  categories: ProductCategory[];
}

/**
 * Catálogo Interactivo (ProductCatalog - Sprint 4/8).
 * Orquesta la lógica del filtro de categorías, cuenta los elementos encontrados,
 * y los renderiza en una rejilla responsiva.
 */
export function ProductCatalog({ products, categories }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  // Filtra los productos de acuerdo con la categoría seleccionada (usando slug)
  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === "all") {
      return products;
    }
    return products.filter((p) => p.categorySlug === selectedCategory || p.categoryId === selectedCategory);
  }, [selectedCategory, products]);

  return (
    <section className="py-12 sm:py-16 bg-stone-50/30">
      <Container className="flex flex-col gap-8">
        
        {/* Filtro de Categorías Pills */}
        <ProductCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Contador Dinámico de Productos Encontrados */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? "artículo" : "artículos"}
          </span>
        </div>

        {/* Estado Vacío / Sin Resultados */}
        {filteredProducts.length === 0 ? (
          <div className="w-full py-20 text-center flex flex-col items-center justify-center gap-4 bg-white border border-stone-200/50 rounded-sm">
            <div className="rounded-full bg-accent-soft p-4 text-accent-deep">
              <ShieldAlert className="h-8 w-8" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-medium text-stone-800">
              Todavía no hay productos disponibles.
            </h3>
            <p className="text-sm font-light text-stone-500 max-w-sm leading-relaxed">
              Actualmente no disponemos de artículos en esta categoría. Por favor, consulta a nuestro equipo técnico para fabricaciones especiales.
            </p>
          </div>
        ) : (
          /* Grilla Responsiva de Tarjetas de Producto */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
      </Container>
    </section>
  );
}
export default ProductCatalog;
