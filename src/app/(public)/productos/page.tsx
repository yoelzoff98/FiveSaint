import type { Metadata } from "next";
import ProductCatalogHeader from "@/components/products/ProductCatalogHeader";
import ProductCatalog from "@/components/products/ProductCatalog";
import ProductInquiryCTA from "@/components/sections/ProductInquiryCTA";
import { getProducts, getProductCategories } from "@/lib/supabase/products";

// Metadatos SEO enriquecidos para la página de catálogo
export const metadata: Metadata = {
  title: "Productos | Five Saint",
  description: "Catálogo oficial de bañeras, hidromasajes, spas, platos de ducha, columnas, saunas y duchas escocesas Five Saint. Diseño y confort premium.",
  keywords: [
    "catálogo",
    "bañeras",
    "hidromasajes",
    "spas",
    "platos de ducha",
    "columnas",
    "saunas",
    "duchas escocesas",
    "productos Five Saint"
  ]
};

export const revalidate = 3600;

/**
 * Página del Catálogo General (ProductsPage - Sprint 8).
 * Compone secuencialmente los tres bloques fundamentales del catálogo:
 * cabecera descriptiva, cuadrícula interactiva con filtros, y banner comercial de cierre.
 */
import { Suspense } from "react";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getProductCategories(),
  ]);

  return (
    <>
      {/* 1. Cabecera del Catálogo */}
      <ProductCatalogHeader />

      {/* 2. Catálogo Interactivo con Rejilla y Filtros */}
      <Suspense fallback={<div className="py-20 text-center">Cargando catálogo...</div>}>
        <ProductCatalog products={products} categories={categories} />
      </Suspense>

      {/* 3. Banner CTA de Asesoramiento Final */}
      <ProductInquiryCTA />
    </>
  );
}
