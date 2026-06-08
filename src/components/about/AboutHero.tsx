import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { siteConfig } from "@/config/site";
import { ArrowRight, Settings } from "lucide-react";

/**
 * Portada Institucional (AboutHero - Sprint 6).
 * Apila en desktop una columna de trayectoria con llamados de redirección a la izquierda,
 * y una ilustración vectorial representativa de la precisión de fabricación nacional a la derecha.
 */
export function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-stone-50 via-white to-stone-100 py-16 sm:py-24 border-b border-stone-200/50">
      {/* Gradiente acuático difuso de fondo */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_40rem_at_top_right,theme(colors.accent-soft/15%),transparent)]" />
      
      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* Columna Izquierda: Información de Trayectoria y Botonera */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left items-start">
          <Badge variant="primary" className="uppercase tracking-widest text-[9px] font-bold px-3 py-1">
            Nuestra empresa
          </Badge>
          
          <h1 className="text-3.5xl font-light tracking-tight text-stone-900 sm:text-5xl lg:text-6xl leading-tight max-w-2xl">
            Trayectoria, diseño y <span className="font-semibold text-accent-deep">fabricación nacional</span> desde {siteConfig.foundedYear}
          </h1>
          
          <p className="text-base sm:text-lg font-light text-stone-500 leading-relaxed max-w-xl">
            {siteConfig.description}
          </p>

          {/* Botones de Navegación CTA */}
          <div className="mt-4 flex flex-wrap gap-4 w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto uppercase tracking-wider font-semibold group cursor-pointer"
              asChild
            >
              <Link href="/productos" className="flex items-center justify-center gap-2">
                Ver productos
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto uppercase tracking-wider font-semibold cursor-pointer"
              asChild
            >
              <Link href="/contacto">Contactar</Link>
            </Button>
          </div>

          {/* Micro-datos rápidos al pie */}
          <div className="mt-8 pt-8 border-t border-stone-100 flex flex-wrap gap-6 sm:gap-12 text-stone-650 text-xs font-medium uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent-deep" />
              <span>Desde {siteConfig.foundedYear}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent-deep" />
              <span>Fabricación Nacional</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent-deep" />
              <span>Soluciones para bienestar</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Placeholder Visual Premium de Fábrica */}
        <div className="lg:col-span-5 relative w-full h-[320px] sm:h-[400px] lg:h-[460px] rounded-[2rem] overflow-hidden border-[6px] border-white/80 shadow-2xl shadow-stone-300/40 bg-gradient-to-br from-stone-100 via-white to-accent-soft/20 flex items-center justify-center group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-soft/30 via-transparent to-transparent -z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative flex flex-col items-center justify-center text-center p-8 gap-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-xl transform group-hover:scale-105 transition-all duration-500">
            <div className="rounded-full bg-white p-6 shadow-sm relative group-hover:shadow-md transition-shadow">
              <Settings className="h-10 w-10 text-accent-deep animate-spin-slow" aria-hidden="true" />
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-500">
                Planta de Producción Nacional
              </span>
              <span className="text-[9px] uppercase tracking-widest font-bold text-accent-deep bg-white px-3 py-1.5 rounded-lg shadow-sm border border-accent-soft/20">
                Tecnología e Ingeniería de Relax
              </span>
            </div>
          </div>

          {/* Sello de Marca de Agua */}
          <span className="absolute bottom-4 right-4 text-[9px] uppercase tracking-widest font-semibold text-stone-300">
            Precision Design
          </span>
        </div>

      </Container>
    </section>
  );
}
export default AboutHero;
