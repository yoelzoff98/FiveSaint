export interface Client {
  id: string;
  name: string;
  category: string;
  description: string;
}

/**
 * Listado estático de tipologías de clientes y proyectos que confían en Five Saint (Sprint 3).
 * Sirve como sección institucional de validación social comercial.
 */
export const clients: Client[] = [
  {
    id: "hoteles",
    name: "Cadenas Hoteleras",
    category: "Hotelería",
    description: "Equipamiento de Spas y bañeras exclusivas para suites presidenciales y áreas de recreación."
  },
  {
    id: "complejos-turisticos",
    name: "Complejos Turísticos",
    category: "Turismo & Relax",
    description: "Instalación de minipiscinas y saunas secas a medida en cabañas y centros turísticos de relax."
  },
  {
    id: "desarrollos-inmobiliarios",
    name: "Desarrollos Inmobiliarios",
    category: "Arquitectura & Constructores",
    description: "Provisión de platos de ducha Slim y bañeras en torres residenciales premium de primera línea."
  },
  {
    id: "spas-urbanos",
    name: "Spas Urbanos",
    category: "Salud & Bienestar",
    description: "Sistemas avanzados de hidromasaje y duchas escocesas de alta presión para centros urbanos de estética."
  },
  {
    id: "proyectos-residenciales",
    name: "Proyectos Residenciales",
    category: "Hogares Premium",
    description: "Soluciones de relax personalizadas integrando tecnología avanzada en baños particulares."
  },
  {
    id: "obras-comerciales",
    name: "Obras Comerciales",
    category: "Corporativo & Gimnasios",
    description: "Diseño e instalación de vestuarios, cabinas de calor seco y saunas comerciales de alto tráfico."
  }
];
export default clients;
