import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

/**
 * Métrica y Estadísticas Institucionales (AboutStatsSection - Sprint 6).
 * Muestra 4 cifras clave de la trayectoria de Five Saint utilizando tarjetas minimalistas
 * sobre un fondo neutro diferenciado para estructurar la lectura de la marca.
 */
export function AboutStatsSection() {
  const metrics = [
    {
      value: "1995",
      label: "Inicio de trayectoria"
    },
    {
      value: "+30",
      label: "Años de experiencia"
    },
    {
      value: "+200",
      label: "Artículos disponibles"
    },
    {
      value: "7",
      label: "Líneas principales"
    }
  ];

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-[#f0f9fb] via-[#f7fbfd] to-[#edf6f9] border-y border-stone-200/70 relative overflow-hidden">
      {/* Sutil halo decorativo en tono turquesa marca */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#087d9f]/8 via-transparent to-transparent -z-10" />
      
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 text-center relative z-10">
          {metrics.map((metric, idx) => (
            <Card
              key={idx}
              className="bg-white border border-stone-200/80 shadow-md shadow-stone-200/40 flex flex-col justify-center items-center py-8 sm:py-10 px-4 gap-2 rounded-2xl hover:shadow-xl hover:border-[#087d9f]/40 hover:-translate-y-1 transition-all duration-300"
              padding="none"
            >
              <span className="text-3.5xl sm:text-5xl font-extrabold text-[#087d9f] tracking-tight leading-none">
                {metric.value}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-stone-600 mt-1 max-w-[150px] leading-snug">
                {metric.label}
              </span>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
export default AboutStatsSection;
