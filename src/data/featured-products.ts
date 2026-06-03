import { FeaturedProduct } from "@/types/product";

/**
 * Listado estático de productos destacados de Five Saint (Sprint 3).
 * Estos productos de alta gama representan lo mejor del catálogo de bienestar.
 */
export const featuredProducts: FeaturedProduct[] = [
  {
    id: "banera-classic",
    name: "Bañera Classic",
    category: "Bañeras",
    description: "Bañera anatómica de acrílico sanitario con curvaturas ergonómicas diseñadas para un descanso corporal superior.",
    href: "/productos/baneras/classic",
    badge: "Más vendida"
  },
  {
    id: "hidromasaje-premium",
    name: "Hidromasaje Premium",
    category: "Hidromasajes",
    description: "Sistema avanzado con 8 jets orientables de agua/aire, regulador de caudal de aire y encendido neumático seguro.",
    href: "/productos/hidromasajes/premium",
    badge: "Alta gama"
  },
  {
    id: "spa-familiar",
    name: "Spa Familiar",
    category: "Spas",
    description: "Minipiscina con climatizador digital, 16 jets de hidromasaje y sistema de cromoterapia LED integrada.",
    href: "/productos/spas/familiar",
    badge: "Exterior / Interior"
  },
  {
    id: "plato-ducha-slim",
    name: "Plato de Ducha Slim",
    category: "Platos de ducha",
    description: "Receptáculo ultra plano antideslizante con textura mineral, alta resistencia al impacto y fácil instalación.",
    href: "/productos/platos-de-ducha/slim",
    badge: "Diseño ultra plano"
  },
  {
    id: "columna-hydro",
    name: "Columna Hydro",
    category: "Columnas",
    description: "Columna de ducha vertical en acero inoxidable que integra rociador de alta presión, jets lumbares y grifería de precisión.",
    href: "/productos/columnas/hydro",
    badge: "Fácil instalación"
  },
  {
    id: "sauna-compact",
    name: "Sauna Compact",
    category: "Saunas",
    description: "Cabina de calor seco de madera seleccionada con calefactor eléctrico homologado, ideal para espacios residenciales reducidos.",
    href: "/productos/saunas/compact",
    badge: "Maderas selectas"
  }
];
export default featuredProducts;
