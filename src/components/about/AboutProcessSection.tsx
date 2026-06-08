import { aboutProcessSteps } from "@/data/about-process";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Card } from "@/components/ui/Card";

/**
 * Sección de Flujo de Trabajo y Procesos (AboutProcessSection - Sprint 6).
 * Renderiza una cuadrícula de pasos (steps) secuenciales numerados,
 * describiendo con sobriedad la asistencia técnica desde el relevamiento hasta la fabricación nacional.
 */
export function AboutProcessSection() {
  return (
    <section className="py-20 lg:py-28 bg-stone-50/30 border-b border-stone-200/50">
      <Container className="flex flex-col gap-12">
        
        {/* Título y Copete */}
        <SectionTitle
          eyebrow="Nuestra Metodología"
          title="Cómo Trabajamos"
          description="Estructuramos un proceso claro para garantizar que cada bañera, sauna o hidromasaje se integre perfectamente en tu espacio."
          align="center"
        />

        {/* Listado de Pasos Secuenciales / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {aboutProcessSteps.map((step, idx) => (
            <Card
              key={idx}
              className="bg-white border border-stone-100/50 shadow-lg shadow-stone-200/40 flex flex-col gap-4 relative overflow-hidden group rounded-3xl hover:-translate-y-1 hover:shadow-xl hover:border-accent-soft/30 transition-all duration-300 p-8"
            >
              {/* Número del paso en gran tamaño difuso de fondo */}
              <div 
                className="absolute -right-2 -bottom-4 text-8xl font-black text-stone-50 group-hover:text-accent-soft/30 transition-colors select-none"
                aria-hidden="true"
              >
                {step.stepNumber}
              </div>

              <div className="flex flex-col text-left gap-2 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-deep">
                  Paso {step.stepNumber}
                </span>
                
                <h3 className="text-lg font-semibold text-stone-900 leading-tight">
                  {step.title}
                </h3>
                
                <p className="text-xs sm:text-sm font-light text-stone-500 leading-relaxed mt-2">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

      </Container>
    </section>
  );
}
export default AboutProcessSection;
