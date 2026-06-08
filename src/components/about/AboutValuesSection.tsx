import { aboutValues } from "@/data/about-values";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Card } from "@/components/ui/Card";
import { Sparkles, Calendar, Layers, ShieldCheck } from "lucide-react";

// Mapeo dinámico de los nombres de los iconos de Lucide-React para mantener tipicidad
const iconMap = {
  Sparkles,
  Calendar,
  Layers,
  ShieldCheck
};

/**
 * Sección de Valores Institucionales (AboutValuesSection - Sprint 6).
 * Mapea los valores y diferenciales desde el módulo de datos estáticos en cards
 * minimalistas con iconos de acento wellness de forma responsiva.
 */
export function AboutValuesSection() {
  return (
    <section className="py-20 lg:py-28 bg-white border-b border-stone-200/50">
      <Container className="flex flex-col gap-12">
        
        {/* Título de la sección */}
        <SectionTitle
          eyebrow="Diferenciales"
          title="Nuestros Valores"
          description="Pilares de trabajo que guían el desarrollo y la fabricación de cada uno de nuestros artículos sanitarios."
          align="center"
        />

        {/* Grilla de Valores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {aboutValues.map((val) => {
            const IconComponent = iconMap[val.iconName];
            return (
              <Card
                key={val.title}
                className="bg-white shadow-sm border border-stone-100/80 p-6 flex flex-col gap-4 items-start hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl group relative overflow-hidden"
              >
                {/* Fondo sutil hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-soft/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Contenedor del Icono con Acento */}
                <div className="rounded-2xl bg-accent-soft/30 text-accent-deep p-3.5 shrink-0 group-hover:bg-accent-deep group-hover:text-white transition-colors duration-300 relative z-10 shadow-sm">
                  <IconComponent className="h-5 w-5" aria-hidden="true" />
                </div>
                
                <h3 className="text-lg font-semibold text-stone-900 leading-tight">
                  {val.title}
                </h3>
                
                <p className="text-xs sm:text-sm font-light text-stone-500 leading-relaxed text-left">
                  {val.description}
                </p>
              </Card>
            );
          })}
        </div>

      </Container>
    </section>
  );
}
export default AboutValuesSection;
