import { ProductCategory } from "@/types/product";

/**
 * Configuración de las categorías principales de productos de Five Saint (Sprint 3).
 * Proporciona el mapeo de rutas (href), identificadores únicos y copys alineados.
 */
export const productCategories: ProductCategory[] = [
  {
    id: "spas-y-minipiscinas",
    name: "Spa y Minipiscinas",
    slug: "spa-y-minipiscinas",
    sortOrder: 1,
    description: "Soluciones amplias para espacios de descanso y recreación.",
    href: "/productos?categoria=spa-y-minipiscinas",
    tagline: "Tu propio santuario de bienestar en casa",
    highlights: ["Climatizador digital integrado", "Cromoterapia LED", "Apto para interior y exterior"],
    featured: true
  },
  {
    id: "baneras",
    name: "Bañeras",
    slug: "baneras",
    sortOrder: 2,
    description: "Diseños pensados para integrar confort, estética y funcionalidad.",
    href: "/productos?categoria=baneras",
    tagline: "Diseño ergonómico y líneas puras",
    highlights: ["Acrílico sanitario de alta densidad", "Fácil mantenimiento y limpieza", "Aislación térmica prolongada"],
    featured: true
  },
  {
    id: "platos-de-duchas",
    name: "Platos de Duchas",
    slug: "platos-de-duchas",
    sortOrder: 3,
    description: "Alternativas prácticas, modernas y resistentes.",
    href: "/productos?categoria=platos-de-duchas",
    tagline: "Superficies minimalistas de entrada segura",
    highlights: ["Tratamiento antideslizante", "Instalación ultra-flat", "Alta resistencia estructural"],
    featured: false
  },
  {
    id: "columnas-de-ducha",
    name: "Columnas de Ducha",
    slug: "columnas-de-ducha",
    sortOrder: 4,
    description: "Equipamiento funcional para renovar la experiencia de ducha.",
    href: "/productos?categoria=columnas-de-ducha",
    tagline: "Una experiencia de ducha vertical renovada",
    highlights: ["Grifería termostática de precisión", "Jets lumbares integrados", "Duchador de mano anticalcáreo"],
    featured: false
  },
  {
    id: "ducha-escocesa",
    name: "Ducha Escocesa",
    slug: "ducha-escocesa",
    sortOrder: 5,
    description: "Sistemas diseñados para confort, relax y recuperación.",
    href: "/productos?categoria=ducha-escocesa",
    tagline: "Estimulación hidráulica a alta presión",
    highlights: ["Múltiples zonas de estimulación", "Control independiente de presión", "Efecto tonificante inmediato"],
    featured: true
  },
  {
    id: "sauna",
    name: "Sauna",
    slug: "sauna",
    sortOrder: 6,
    description: "Bienestar térmico para proyectos residenciales y comerciales.",
    href: "/productos?categoria=sauna",
    tagline: "Calor purificador en maderas selectas",
    highlights: ["Madera noble seleccionada", "Generador de calor seguro homologado", "Termómetro e higrómetro analógico"],
    featured: false
  }
];
