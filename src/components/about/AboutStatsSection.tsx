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
      value: "+25",
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
    <section className="py-16 bg-stone-50 border-b border-stone-200/50">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
          {metrics.map((metric, idx) => (
            <Card
              key={idx}
              className="bg-white border-stone-200 shadow-xs flex flex-col justify-center items-center py-8 gap-2"
              padding="none"
            >
              <span className="text-3.5xl sm:text-5xl font-light text-stone-900 tracking-tight leading-none">
                {metric.value}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-stone-400 mt-1 max-w-[150px] leading-tight">
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
