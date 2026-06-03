export interface AboutValue {
  title: string;
  description: string;
  iconName: "Sparkles" | "Calendar" | "Layers" | "ShieldCheck";
}

/**
 * Listado estático de valores y diferenciales de Five Saint (Sprint 6).
 * Sirve como fuente de datos desacoplada para la sección AboutValuesSection.
 */
export const aboutValues: AboutValue[] = [
  {
    title: "Diseño funcional",
    description: "Cada línea busca equilibrar estética, comodidad y facilidad de integración en distintos espacios.",
    iconName: "Sparkles"
  },
  {
    title: "Calidad productiva",
    description: "Trabajamos con foco en terminaciones, resistencia y confiabilidad de uso.",
    iconName: "Calendar"
  },
  {
    title: "Innovación aplicada",
    description: "Incorporamos soluciones pensadas para mejorar la experiencia de baño, relax y bienestar.",
    iconName: "Layers"
  },
  {
    title: "Asesoramiento personalizado",
    description: "Acompañamos la elección del producto más adecuado según cada proyecto.",
    iconName: "ShieldCheck"
  }
];
export default aboutValues;
