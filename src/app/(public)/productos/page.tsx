import type { Metadata } from "next";
import ProductCatalogHeader from "@/components/products/ProductCatalogHeader";
import ProductCatalog from "@/components/products/ProductCatalog";
import ProductInquiryCTA from "@/components/sections/ProductInquiryCTA";
import { getProductCategories } from "@/lib/supabase/products";
import { getPublicCatalogProducts as getProducts } from "@/lib/supabase/public-catalog-products";
import { withSaunaCategory } from "@/config/sauna-public-catalog";

// Metadatos SEO enriquecidos para la página de catálogo
export const metadata: Metadata = {
  title: "Productos | Five Saint",
  description:
    "Catálogo oficial de bañeras, hidromasajes, spas, platos de ducha, columnas, saunas y duchas escocesas Five Saint. Diseño y confort premium.",
  keywords: [
    "catálogo",
    "bañeras",
    "hidromasajes",
    "spas",
    "platos de ducha",
    "columnas",
    "saunas",
    "duchas escocesas",
    "productos Five Saint",
  ],
};

export const revalidate = 3600;

/**
 * Página del Catálogo General (ProductsPage - Sprint 8).
 * Compone secuencialmente los tres bloques fundamentales del catálogo:
 * cabecera descriptiva, cuadrícula interactiva con filtros, y banner comercial de cierre.
 */

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const category =
    typeof params.categoria === "string" ? params.categoria : "all";
  const [products, categories] = await Promise.all([
    getProducts(),
    getProductCategories(),
  ]);

  return (
    <>
      {/* 1. Cabecera del Catálogo */}
      <ProductCatalogHeader />

      {/* 2. Catálogo Interactivo con Rejilla y Filtros */}
      <ProductCatalog
        key={`${category}:${query}`}
        products={products}
        categories={withSaunaCategory(categories).filter(
          (c) =>
            c.slug === "sauna" ||
            products.some((p) => p.categorySlug === c.slug),
        )}
        initialQuery={query}
        initialCategory={category}
      />

      {/* 3. Banner CTA de Asesoramiento Final */}
      <ProductInquiryCTA />
    </>
  );
}
