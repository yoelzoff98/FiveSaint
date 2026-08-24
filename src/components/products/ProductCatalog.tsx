"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Product, ProductCategory } from "@/types/product";
import { Container } from "@/components/ui/Container";
import ProductCategoryFilter from "./ProductCategoryFilter";
import ProductCard from "./ProductCard";
import { ShieldAlert } from "lucide-react";

import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("categoria");
  
  const [selectedCategory, setSelectedCategory] = React.useState(categoryParam || "all");

  React.useEffect(() => {
    if (categoryParam) {
      if (categoryParam === "ducha-escocesa" || categoryParam === "duchas-escocesas") {
        router.push("/productos/ducha-escocesa");
      } else {
        setSelectedCategory(categoryParam);
      }
    }
  }, [categoryParam, router]);

  const handleCategoryChange = (slug: string) => {
    if (slug === "ducha-escocesa" || slug === "duchas-escocesas") {
      router.push("/productos/ducha-escocesa");
    } else {
      setSelectedCategory(slug);
    }
  };

  // Filtra los productos de acuerdo con la categoría seleccionada (usando slug)
  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === "all") {
      return products;
    }
    return products.filter((p) => p.categorySlug === selectedCategory || p.categoryId === selectedCategory);
  }, [selectedCategory, products]);

  return (
    <section className="pt-6 pb-16 sm:pt-10 sm:pb-24 bg-gradient-to-b from-stone-50/80 to-white">
      <Container className="flex flex-col gap-8">
        
        {/* Filtro de Categorías Pills */}
        <ProductCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Contador Dinámico de Productos Encontrados */}
        <div className="flex items-center gap-4 w-full">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-accent-deep/80 bg-accent-soft/30 px-4 py-2 rounded-full border border-accent-soft/50 shadow-sm">
            Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? "artículo" : "artículos"}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-stone-200/80 to-transparent"></div>
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
