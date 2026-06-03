import { ProductCategory } from "@/types/product";

/**
 * Configuración de las categorías principales de productos de Five Saint (Sprint 3).
 * Proporciona el mapeo de rutas (href), identificadores únicos y copys alineados.
 */
export const productCategories: ProductCategory[] = [
  {
    id: "baneras",
    name: "Bañeras",
    slug: "baneras",
    sortOrder: 1,
    description: "Diseños pensados para integrar confort, estética y funcionalidad.",
    href: "/productos/baneras",
    tagline: "Diseño ergonómico y líneas puras",
    highlights: ["Acrílico sanitario de alta densidad", "Fácil mantenimiento y limpieza", "Aislación térmica prolongada"],
    featured: true
  },
  {
    id: "hidromasajes",
    name: "Hidromasajes",
    slug: "hidromasajes",
    sortOrder: 2,
    description: "Experiencias de relax con tecnología aplicada al bienestar.",
    href: "/productos/hidromasajes",
    tagline: "El arte de relajar mediante el agua",
    highlights: ["Sistemas neumáticos de encendido seguro", "Jets orientables y regulables", "Diseño autodrenante higiénico"],
    featured: true
  },
  {
    id: "spas",
    name: "Spas",
    slug: "spas",
    sortOrder: 3,
    description: "Soluciones amplias para espacios de descanso y recreación.",
    href: "/productos/spas",
    tagline: "Tu propio santuario de bienestar en casa",
    highlights: ["Climatizador digital integrado", "Cromoterapia LED", "Apto para interior y exterior"],
    featured: true
  },
  {
    id: "platos-de-ducha",
    name: "Platos de ducha",
    slug: "platos-de-ducha",
    sortOrder: 4,
    description: "Alternativas prácticas, modernas y resistentes.",
    href: "/productos/platos-de-ducha",
    tagline: "Superficies minimalistas de entrada segura",
    highlights: ["Tratamiento antideslizante", "Instalación ultra-flat", "Alta resistencia estructural"],
    featured: false
  },
  {
    id: "columnas",
    name: "Columnas",
    slug: "columnas",
    sortOrder: 5,
    description: "Equipamiento funcional para renovar la experiencia de ducha.",
    href: "/productos/columnas",
    tagline: "Una experiencia de ducha vertical renovada",
    highlights: ["Grifería termostática de precisión", "Jets lumbares integrados", "Duchador de mano anticalcáreo"],
    featured: false
  },
  {
    id: "saunas",
    name: "Saunas",
    slug: "saunas",
    sortOrder: 6,
    description: "Bienestar térmico para proyectos residenciales y comerciales.",
    href: "/productos/saunas",
    tagline: "Calor purificador en maderas selectas",
    highlights: ["Madera noble seleccionada", "Generador de calor seguro homologado", "Termómetro e higrómetro analógico"],
    featured: false
  },
  {
    id: "duchas-escocesas",
    name: "Duchas escocesas",
    slug: "duchas-escocesas",
    sortOrder: 7,
    description: "Sistemas diseñados para confort, relax y recuperación.",
    href: "/productos/duchas-escocesas",
    tagline: "Estimulación hidráulica a alta presión",
    highlights: ["Múltiples zonas de estimulación", "Control independiente de presión", "Efecto tonificante inmediato"],
    featured: true
  }
];
