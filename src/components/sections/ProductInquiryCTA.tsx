import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, Compass } from "lucide-react";

/**
 * Sección de Cierre del Catálogo (ProductInquiryCTA - Sprint 4).
 * Presenta un banner final en tono oscuro profundo, proveyendo accesos directos
 * a la cotización y la historia corporativa para captar el interés comercial.
 */
export function ProductInquiryCTA() {
  return (
    <section className="py-20 lg:py-28 bg-stone-950 text-white relative overflow-hidden">
      {/* Elemento decorativo visual acuático */}
      <div className="absolute inset-0 bg-[radial-gradient(40rem_30rem_at_bottom_left,theme(colors.accent-deep/15%),transparent)]" />
      
      <Container className="relative z-10 flex flex-col items-center text-center gap-6">
        
        {/* Eyebrow de Asesoramiento */}
        <Badge variant="primary" className="mb-2 bg-accent-deep text-white hover:bg-accent-deep border-none uppercase tracking-widest text-[9px] font-bold px-3 py-1">
          Asesoramiento
        </Badge>
        
        {/* Título Principal */}
        <h2 className="text-3xl font-light tracking-tight sm:text-4xl lg:text-5xl max-w-3xl leading-tight text-white">
          ¿No sabés qué producto se adapta <span className="font-semibold text-accent-soft">mejor a tu proyecto</span>?
        </h2>
        
        {/* Descripción de soporte */}
        <p className="max-w-xl text-sm sm:text-base font-light text-stone-400 leading-relaxed">
          Nuestro equipo puede orientarte sobre líneas disponibles, aplicaciones, planos de instalación, medidas y alternativas según el espacio de baño o área de relax.
        </p>

        {/* Acciones del CTA */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto uppercase tracking-wider font-semibold group cursor-pointer bg-white text-stone-950 hover:bg-stone-100 shrink-0"
            asChild
          >
            <Link href="/contacto" className="flex items-center justify-center gap-2">
              Solicitar asesoramiento
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto uppercase tracking-wider font-semibold cursor-pointer text-stone-300 hover:text-white hover:bg-stone-900 border border-stone-800"
            asChild
          >
            <Link href="/nosotros">Conocer la empresa</Link>
          </Button>
        </div>

        {/* Soporte adicional */}
        <div className="mt-8 flex items-center gap-2 text-stone-500 text-xs font-light">
          <Compass className="h-4 w-4 text-accent-soft shrink-0" />
          <span>Trayectoria y calidad asegurada desde {new Date().getFullYear() - 31} en Argentina</span>
        </div>

      </Container>
    </section>
  );
}
export default ProductInquiryCTA;
