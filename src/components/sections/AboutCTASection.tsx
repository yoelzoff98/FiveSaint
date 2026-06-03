import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, Compass } from "lucide-react";

/**
 * Sección de Llamado a la Acción Institucional Final (AboutCTASection - Sprint 6).
 * Presenta un banner comercial con fondo oscuro profundo y botones de redirección duales
 * para cerrar la página /nosotros con fuerza orientada a la conversión.
 */
export function AboutCTASection() {
  return (
    <section className="py-20 lg:py-32 bg-stone-950 text-white relative overflow-hidden">
      {/* Detalle visual sutil de gradiente acuático */}
      <div className="absolute inset-0 bg-[radial-gradient(40rem_30rem_at_bottom_right,theme(colors.accent-deep/15%),transparent)]" aria-hidden="true" />
      
      <Container className="relative z-10 flex flex-col items-center text-center gap-6">
        
        {/* Eyebrow de Asesoramiento */}
        <Badge variant="primary" className="mb-2 bg-accent-deep text-white hover:bg-accent-deep border-none uppercase tracking-widest text-[9px] font-bold px-3 py-1">
          Hablemos de tu proyecto
        </Badge>
        
        {/* Título Principal */}
        <h2 className="text-3xl font-light tracking-tight sm:text-4xl lg:text-5xl max-w-3xl leading-tight text-white">
          Encontrá la <span className="font-semibold text-accent-soft">solución adecuada</span> para tu espacio
        </h2>
        
        {/* Descripción de soporte */}
        <p className="max-w-xl text-sm sm:text-base font-light text-stone-400 leading-relaxed">
          Nuestro equipo puede orientarte sobre productos, líneas disponibles, planos técnicos y alternativas adecuadas para proyectos residenciales, comerciales u hoteleros.
        </p>

        {/* Botonera de Conversión Dual */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto uppercase tracking-wider font-semibold group cursor-pointer bg-white text-stone-950 hover:bg-stone-100 shrink-0"
            asChild
          >
            <Link href="/contacto" className="flex items-center justify-center gap-2">
              Solicitar asesoramiento
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto uppercase tracking-wider font-semibold cursor-pointer text-stone-300 hover:text-white hover:bg-stone-900 border border-stone-800"
            asChild
          >
            <Link href="/productos">Ver catálogo</Link>
          </Button>
        </div>

        {/* Soporte adicional */}
        <div className="mt-8 flex items-center gap-2 text-stone-500 text-xs font-light">
          <Compass className="h-4 w-4 text-accent-soft shrink-0" />
          <span>Atención y asesoría industrial personalizada de alcance nacional</span>
        </div>

      </Container>
    </section>
  );
}
export default AboutCTASection;
