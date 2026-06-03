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
                className="bg-stone-50/50 border-stone-200/40 p-6 flex flex-col gap-4 items-start hover:bg-stone-50 transition-colors duration-200"
              >
                {/* Contenedor del Icono con Acento */}
                <div className="rounded-sm bg-accent-soft text-accent-deep p-3 shrink-0">
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
