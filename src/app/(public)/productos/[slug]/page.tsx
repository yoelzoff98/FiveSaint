import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/supabase/products";
import { Container } from "@/components/ui/Container";
import ProductDetailHero from "@/components/products/ProductDetailHero";
import ProductDetailContent from "@/components/products/ProductDetailContent";
import ProductDetailSidebar from "@/components/products/ProductDetailSidebar";
import RelatedProducts from "@/components/products/RelatedProducts";
import ProductInquiryCTA from "@/components/sections/ProductInquiryCTA";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductVariantsSection } from "@/components/products/ProductVariantsSection";

interface RouteParams {
  slug: string;
}

type Params = Promise<RouteParams>;

export const revalidate = 3600;

/**
 * Genera de forma estática (SSG) todas las rutas del catálogo al momento de la compilación.
 * 
 * @returns Listado de slugs pre-renderizados.
 */
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

/**
 * Genera los metadatos de SEO de forma dinámica basados en el producto actual.
 */
export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Producto no encontrado | Five Saint",
    };
  }

  return {
    title: product.seoTitle || `${product.name} | Five Saint`,
    description: product.seoDescription || product.shortDescription || product.description,
    openGraph: {
      title: product.seoTitle || `${product.name} | Five Saint`,
      description: product.seoDescription || product.shortDescription || product.description,
      type: "article",
    },
  };
}

/**
 * Vista Dinámica de Ficha de Producto (ProductDetailPage - Sprint 5/8).
 * Resuelve y recupera el producto por slug, gestiona redirección 404 (notFound) si no existe,
 * y compone las secciones modulares responsivas de detalle y catálogo relacionado.
 */
export default async function ProductDetailPage(props: { params: Params }) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  // Gatilla la pantalla de error 404 por defecto de Next.js si el producto no existe
  if (!product) {
    notFound();
  }

  // Obtenemos los relacionados en el servidor
  const relatedProducts = await getRelatedProducts(product, 3);

  return (
    <article className="w-full flex flex-col bg-white">
      {/* 1. Hero del Producto con Miga de Pan */}
      <ProductDetailHero product={product} />

      {/* 2. Cuerpo Central del Detalle en Grid de Dos Columnas */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            
            {/* Columna Ancha: Descripción y Viñetas Técnicas */}
            <div className="lg:col-span-8 w-full">
              <ProductDetailContent product={product} />
            </div>

            {/* Columna Estrecha: Tarjeta Sticky de Cotización */}
            <div className="lg:col-span-4 w-full">
              <ProductDetailSidebar product={product} />
            </div>
            
          </div>
        </Container>
      </section>

      {/* 2.5 Variantes del Producto (Opcional) */}
      <ProductVariantsSection variants={product.variants || []} />

      {/* 2.75 Galería de Imágenes (Si hay más de 1) */}
      <ProductImageGallery images={product.images || []} productName={product.name} />

      {/* 3. Productos Relacionados sugeridos */}
      <RelatedProducts products={relatedProducts} />

      {/* 4. Banner CTA de Asesoramiento al Cierre */}
      <ProductInquiryCTA />
    </article>
  );
}
