import Link from "next/link";
import { getFeaturedProducts } from "@/lib/supabase/products";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import { FeaturedProductsCarousel } from "./FeaturedProductsCarousel";

/**
 * Sección de Productos Destacados.
 * Renderiza los productos insignia de la base de datos real en un carrusel dinámico.
 */
export async function FeaturedProductsSection() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <section className="py-20 lg:py-28 bg-stone-50/20 border-b border-stone-200/50">
      <Container className="flex flex-col gap-10">
        
        {/* Título de Sección con Descripción */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <SectionTitle
            eyebrow="Selección Exclusiva"
            title="Productos destacados"
            description="Una selección de líneas pensadas para proyectos residenciales, comerciales y de bienestar."
            align="left"
            className="max-w-2xl"
          />
          <Button
            variant="outline"
            size="md"
            className="uppercase tracking-wider font-semibold group cursor-pointer shrink-0 md:mb-2 rounded-xl"
            asChild
          >
            <Link href="/productos" className="flex items-center gap-2">
              Ver catálogo completo
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Carrusel Interactivo de Productos Destacados */}
        <FeaturedProductsCarousel products={featuredProducts} />

      </Container>
    </section>
  );
}

export default FeaturedProductsSection;
