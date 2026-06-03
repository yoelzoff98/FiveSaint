export interface AboutProcessStep {
  stepNumber: string;
  title: string;
  description: string;
}

/**
 * Listado estático de las etapas del proceso comercial e industrial de Five Saint (Sprint 6).
 * Sirve como fuente de datos desacoplada para la sección AboutProcessSection.
 */
export const aboutProcessSteps: AboutProcessStep[] = [
  {
    stepNumber: "01",
    title: "Relevamiento",
    description: "Escuchamos la necesidad del proyecto, el tipo de espacio y la línea buscada."
  },
  {
    stepNumber: "02",
    title: "Asesoramiento",
    description: "Orientamos sobre alternativas disponibles, usos, aplicaciones y posibilidades."
  },
  {
    stepNumber: "03",
    title: "Selección del producto",
    description: "Acompañamos la elección de la solución que mejor se adapta al espacio."
  },
  {
    stepNumber: "04",
    title: "Fabricación y entrega",
    description: "Avanzamos con el desarrollo del producto según la línea correspondiente y las condiciones acordadas."
  }
];
export default aboutProcessSteps;
