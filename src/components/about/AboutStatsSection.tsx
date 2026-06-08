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
    <section className="py-20 lg:py-24 bg-stone-900 border-y border-stone-800 relative overflow-hidden">
      {/* Luz tenue de fondo para darle profundidad al oscuro */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-deep/10 via-stone-900 to-stone-900 -z-10" />
      
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center relative z-10">
          {metrics.map((metric, idx) => (
            <Card
              key={idx}
              className="bg-stone-800/30 border border-white/5 backdrop-blur-sm shadow-xl flex flex-col justify-center items-center py-10 gap-3 rounded-2xl hover:bg-stone-800/50 hover:-translate-y-1 transition-all duration-300"
              padding="none"
            >
              <span className="text-4xl sm:text-5xl font-light text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-br from-white to-stone-400">
                {metric.value}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-accent-soft mt-1 max-w-[150px] leading-tight">
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
