import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Card } from "@/components/ui/Card";
import { Sparkles, Calendar, Layers, ShieldCheck } from "lucide-react";

/**
 * Sección de Beneficios / Diferenciales (Sprint 3).
 * Rediseñada con fondos degradados de agua y tarjetas interactivas "group"
 * con transiciones de color de iconos y sombras suaves de elevación.
 */
export function BenefitsSection() {
  const benefits = [
    {
      title: "Diseño funcional",
      description: "Productos pensados para integrarse a distintos estilos de baño y espacios de bienestar.",
      icon: Sparkles
    },
    {
      title: "Experiencia industrial",
      description: "Trayectoria desde 1995 en fabricación y desarrollo de soluciones para el sector.",
      icon: Calendar
    },
    {
      title: "Variedad de líneas",
      description: "Bañeras, hidromasajes, spas, platos, columnas, saunas y duchas escocesas.",
      icon: Layers
    },
    {
      title: "Asesoramiento",
      description: "Acompañamiento técnico para elegir la solución adecuada según cada proyecto.",
      icon: ShieldCheck
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#087d9f] bg-gradient-to-br from-[#055f79] to-[#087d9f] border-b border-stone-800/10 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#00cbf2]/10 blur-3xl" />
      </div>

      <Container className="flex flex-col gap-12 relative z-10">
        
        {/* Título de la Sección */}
        <SectionTitle
          eyebrow="Valores Corporativos"
          title="Por qué elegir Five Saint"
          description="Nuestra trayectoria y compromiso con la ingeniería del confort nos avalan como líderes del relax sanitario."
          align="center"
          light={true}
        />

        {/* Cuadrícula de Diferenciales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={idx}
                hoverable
                padding="lg"
                className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl flex flex-col gap-5 items-start rounded-2xl group hover:bg-white/15 hover:border-white/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20 transition-all duration-500"
              >
                {/* Contenedor del Icono */}
                <div className="rounded-xl bg-white/20 text-white p-3.5 shrink-0 group-hover:bg-white group-hover:text-[#087d9f] group-hover:shadow-lg group-hover:scale-110 transition-all duration-500">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                
                <h3 className="text-xl font-bold text-white leading-tight">
                  {benefit.title}
                </h3>
                
                <p className="text-base font-light text-stone-200 leading-relaxed">
                  {benefit.description}
                </p>
              </Card>
            );
          })}
        </div>

      </Container>
    </section>
  );
}

export default BenefitsSection;
