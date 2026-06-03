import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

/**
 * Portada Hero para la Página de Contacto (ContactHero - Sprint 7).
 * Presenta una estética premium, limpia y espaciosa con un gradiente sutil en tonos aqua y alabastro.
 */
export function ContactHero() {
  const quickFacts = [
    "Asesoramiento personalizado",
    "Líneas para baño y bienestar",
    "Proyectos residenciales y comerciales"
  ];

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24 border-b border-stone-200/50">
      {/* Gradiente sutil acuático al fondo */}
      <div 
        className="absolute inset-0 -z-10 bg-[radial-gradient(50rem_40rem_at_top_right,theme(colors.accent-soft/25%),transparent)]" 
        aria-hidden="true" 
      />
      
      <Container className="flex flex-col items-start gap-6 text-left relative z-10 max-w-4xl">
        {/* Eyebrow */}
        <Badge variant="primary" className="uppercase tracking-widest text-[9px] font-bold px-3 py-1">
          Contacto
        </Badge>
        
        {/* Título Principal */}
        <h1 className="text-4xl font-light tracking-tight text-stone-900 sm:text-5xl lg:text-6xl leading-tight max-w-2xl">
          Hablemos de <span className="font-semibold text-accent-deep">tu proyecto</span>
        </h1>
        
        {/* Descripción de Soporte */}
        <p className="text-base sm:text-lg font-light text-stone-500 leading-relaxed max-w-2xl">
          Nuestro equipo puede orientarte sobre productos, líneas disponibles, especificaciones técnicas y alternativas a la medida para equipar tus espacios de baño y relax.
        </p>

        {/* Bloque de datos rápidos al pie */}
        <div className="mt-6 pt-6 border-t border-stone-100 flex flex-wrap gap-4 sm:gap-8 text-stone-600 text-xs font-semibold uppercase tracking-wider">
          {quickFacts.map((fact, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-accent-deep shrink-0" />
              <span>{fact}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default ContactHero;
