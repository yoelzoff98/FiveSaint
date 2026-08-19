import Link from "next/link";
import { getFeaturedProducts } from "@/lib/supabase/products";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, Waves } from "lucide-react";

/**
 * Sección de Productos Destacados.
 * Renderiza los productos insignias de la base de datos real en tarjetas elegantes.
 */
export async function FeaturedProductsSection() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <section className="py-20 lg:py-28 bg-stone-50/20 border-b border-stone-200/50">
      <Container className="flex flex-col gap-12">
        
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
            className="uppercase tracking-wider font-semibold group cursor-pointer shrink-0 md:mb-2"
            asChild
          >
            <Link href="/productos" className="flex items-center gap-2">
              Ver catálogo completo
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Grilla de Productos Destacados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
          {featuredProducts.map((product) => {
            const isBanera = product.categorySlug === 'baneras' || product.categorySlug === 'bañeras' || product.categoryName?.toLowerCase().includes('bañera') || product.categoryName?.toLowerCase().includes('banera');

            return (
              <Card
                key={product.id}
                hoverable
                className="flex flex-col justify-between h-full bg-white p-0 overflow-hidden"
                padding="none"
              >
                {/* Contenedor del Visual del Producto */}
                <div className={`relative w-full h-48 flex items-center justify-center border-b border-stone-100 overflow-hidden ${
                  isBanera
                    ? 'bg-gradient-to-br from-[#71717a] via-[#8d8d97] to-[#52525b]'
                    : 'bg-gradient-to-br from-stone-50 via-white to-accent-soft/20 group-hover:from-accent-soft/10 transition-colors'
                }`}>
                  {product.image?.url ? (
                    <Image
                      src={product.image.url}
                      alt={product.image.alt || product.name}
                      fill
                      className={`transition-transform duration-500 group-hover:scale-110 ${
                        isBanera ? 'object-contain p-1 drop-shadow-[0_20px_25px_rgba(0,0,0,0.55)]' : 'object-cover'
                      }`}
                    />
                  ) : (
                    <Waves className="h-10 w-10 text-accent-deep/30 opacity-70 group-hover:scale-110 group-hover:text-accent-deep/50 transition-all duration-300" />
                  )}
                  
                  <div className="absolute top-4 left-4 flex gap-2 z-10">
                    <Badge variant="outline" className="text-[8px] uppercase tracking-widest font-bold bg-white/80 backdrop-blur-sm">
                      {product.categoryName}
                    </Badge>
                    {product.badge && (
                      <Badge variant="primary" className="text-[8px] uppercase tracking-widest font-bold shadow-sm">
                        {product.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Marca de agua elegante */}
                  <span className="absolute bottom-3 right-3 text-[9px] uppercase tracking-widest font-bold text-stone-300 z-10 drop-shadow-sm">
                    Five Saint
                  </span>
                </div>

                {/* Contenido Informativo del Producto */}
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-lg font-medium text-stone-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-xs font-light text-stone-600 leading-relaxed min-h-[48px] line-clamp-3">
                      {product.shortDescription || product.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-deep">
                      Garantía Escrita
                    </span>
                    <Link
                      href={product.href}
                      className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-stone-850 hover:text-accent-deep hover:underline transition-colors"
                    >
                      Ver detalles
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

      </Container>
    </section>
  );
}

export default FeaturedProductsSection;
