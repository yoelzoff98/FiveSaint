import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Card } from "@/components/ui/Card";
import { Quote } from "lucide-react";

/**
 * Sección de Historia Corporativa (AboutStorySection - Sprint 6).
 * Estructura en dos columnas: el desarrollo y narración de la marca a la izquierda,
 * y una tarjeta de cita institucional de alto impacto visual con diseño premium a la derecha.
 */
export function AboutStorySection() {
  return (
    <section className="py-20 lg:py-28 bg-white border-b border-stone-200/50">
      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Columna Izquierda: Redacción Histórica */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left items-start">
          <SectionTitle
            eyebrow="Historia"
            title="Más de dos décadas acompañando proyectos de baño y bienestar"
          />
          
          <div className="flex flex-col gap-5 text-base font-light text-stone-600 leading-relaxed max-w-2xl">
            <p>
              Desde 1995, Five Saint trabaja en el desarrollo y fabricación de productos orientados al confort, el diseño y la funcionalidad. A lo largo de los años, la empresa incorporó nuevas líneas y soluciones para responder a distintas necesidades residenciales, comerciales y hoteleras.
            </p>
            <p>
              Hoy la marca reúne una amplia variedad de productos, incluyendo bañeras, hidromasajes, spas, platos de ducha, columnas, saunas y duchas escocesas, con una mirada puesta en la calidad, la innovación y el asesoramiento personalizado.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta con Cita Destacada */}
        <div className="lg:col-span-5 w-full flex items-center justify-center">
          <Card className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-stone-100 border border-white/10 shadow-2xl shadow-stone-300/60 p-8 sm:p-10 relative overflow-hidden w-full max-w-sm rounded-3xl transform hover:-translate-y-1 transition-transform duration-500">
            {/* Elemento decorativo de agua al fondo de la card */}
            <div className="absolute inset-0 bg-[radial-gradient(15rem_15rem_at_bottom_right,theme(colors.accent-deep/20%),transparent)]" aria-hidden="true" />
            
            <div className="relative z-10 flex flex-col gap-6 items-start text-left">
              <div className="rounded-full bg-stone-800 text-accent-soft p-3.5 shrink-0">
                <Quote className="h-6 w-6 transform rotate-180" aria-hidden="true" />
              </div>
              
              <blockquote className="text-lg sm:text-xl font-light leading-relaxed text-stone-250">
                “Diseñamos soluciones pensadas para transformar espacios cotidianos en experiencias de bienestar.”
              </blockquote>
              
              <div className="flex flex-col gap-0.5 mt-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-soft">
                  Filosofía Five Saint
                </span>
                <span className="text-[9px] text-stone-400 uppercase tracking-widest font-semibold mt-0.5">
                  Premium Wellness Craft
                </span>
              </div>
            </div>
          </Card>
        </div>

      </Container>
    </section>
  );
}
export default AboutStorySection;
