import Link from "next/link";
import { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, MessageSquare, ChevronRight, Waves, ShieldCheck, MapPin } from "lucide-react";

interface ProductDetailHeroProps {
  product: Product;
}

/**
 * Cabecera Detallada de Producto (ProductDetailHero - Sprint 5).
 * Renderiza migas de pan (breadcrumbs) con accesibilidad ARIA, títulos, descripciones,
 * botones duales de contacto y un placeholder visual decorativo en gradiente a la derecha.
 */
export function ProductDetailHero({ product }: ProductDetailHeroProps) {
  return (
    <section className="relative overflow-hidden bg-white py-12 sm:py-16 border-b border-stone-200/50">
      {/* Fondo difuso sutil */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_30rem_at_top_right,theme(colors.accent-soft/20%),transparent)]" />
      
      <Container className="flex flex-col gap-8">
        
        {/* 1. Breadcrumbs accesibles */}
        <nav aria-label="Breadcrumb" className="w-full">
          <ol className="flex items-center gap-1.5 text-xs text-stone-500 font-light uppercase tracking-wider">
            <li>
              <Link href="/" className="hover:text-stone-900 transition-colors">
                Inicio
              </Link>
            </li>
            <ChevronRight className="h-3 w-3 text-stone-300" aria-hidden="true" />
            <li>
              <Link href="/productos" className="hover:text-stone-900 transition-colors">
                Productos
              </Link>
            </li>
            <ChevronRight className="h-3 w-3 text-stone-300" aria-hidden="true" />
            <li className="text-stone-850 font-normal truncate" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* 2. Cuerpo en Dos Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Columna Izquierda: Información de Ficha */}
          <div className="lg:col-span-7 flex flex-col gap-5 text-left items-start">
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[8.5px] uppercase tracking-widest font-bold bg-white/95">
                {product.categoryName}
              </Badge>
              {product.badge && (
                <Badge variant="primary" className="text-[8.5px] uppercase tracking-widest font-bold">
                  {product.badge}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-light tracking-tight text-stone-900 sm:text-4xl lg:text-5xl leading-tight">
              {product.name}
            </h1>
            
            <p className="text-base sm:text-lg font-light text-stone-500 leading-relaxed max-w-xl">
              {product.shortDescription}
            </p>

            {/* CTAs principales */}
            <div className="mt-4 flex flex-wrap gap-4 w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto uppercase tracking-wider font-semibold group cursor-pointer"
                asChild
              >
                <Link
                  href={`/contacto?ref=${product.slug}`}
                  className="flex items-center justify-center gap-2"
                >
                  Consultar por este producto
                  <MessageSquare className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto uppercase tracking-wider font-semibold cursor-pointer group"
                asChild
              >
                <Link href="/productos" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                  Volver al catálogo
                </Link>
              </Button>
            </div>

            {/* Detalles rápidos e insignias */}
            <div className="mt-8 pt-8 border-t border-stone-100 flex flex-wrap gap-4 sm:gap-6 w-full text-stone-600">
              <div className="flex items-center gap-3 bg-stone-50/80 p-3.5 pr-6 rounded-2xl border border-stone-100/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-accent-deep" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-stone-400">Garantía</span>
                  <span className="text-xs font-semibold text-stone-900">Escrita de Fábrica</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-stone-50/80 p-3.5 pr-6 rounded-2xl border border-stone-100/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <MapPin className="h-5 w-5 text-accent-deep" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-stone-400">Origen</span>
                  <span className="text-xs font-semibold text-stone-900">100% Argentina</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-stone-50/80 p-3.5 pr-6 rounded-2xl border border-stone-100/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <Waves className="h-5 w-5 text-accent-deep" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-stone-400">Soporte</span>
                  <span className="text-xs font-semibold text-stone-900">Asesoramiento Disponible</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Imagen Real o Placeholder Visual Elevado en Gradiente */}
          <div className="lg:col-span-5 relative w-full h-[320px] sm:h-[400px] lg:h-[460px] rounded-[2rem] overflow-hidden border-[6px] border-white/80 shadow-2xl shadow-stone-300/40 bg-gradient-to-br from-stone-50 via-white to-accent-soft/20 flex items-center justify-center group transform transition-transform duration-500 hover:scale-[1.01]">
            {product.image ? (
              <img
                src={product.image.url}
                alt={product.image.alt || product.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0)_100%)] from-accent-soft/30 to-transparent -z-10 animate-pulse-slow" />
                
                {/* Animación central vectorial minimalista */}
                <div className="relative flex flex-col items-center justify-center text-center p-6 gap-3 z-10">
                  <div className="rounded-full bg-white/80 p-6 border border-stone-200/50 shadow-sm relative group">
                    <Waves className="h-12 w-12 text-accent-deep opacity-70 group-hover:scale-105 transition-all duration-300" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 mt-2">
                    Five Saint Premium Bath
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-accent-deep bg-accent-soft/50 px-2 py-0.5 rounded-xs">
                    Acrílico Sanitario Reforzado
                  </span>
                </div>

                {/* Sello inferior derecho */}
                <span className="absolute bottom-4 right-4 text-[9px] uppercase tracking-widest font-semibold text-stone-400 z-10">
                  Wellness Design
                </span>
              </>
            )}
          </div>

        </div>
      </Container>
    </section>
  );
}
export default ProductDetailHero;
