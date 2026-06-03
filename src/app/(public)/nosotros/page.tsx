import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import AboutStorySection from "@/components/about/AboutStorySection";
import AboutStatsSection from "@/components/about/AboutStatsSection";
import AboutValuesSection from "@/components/about/AboutValuesSection";
import AboutProcessSection from "@/components/about/AboutProcessSection";
import AboutCTASection from "@/components/sections/AboutCTASection";

// Metadatos SEO enriquecidos para la sección institucional Nosotros
export const metadata: Metadata = {
  title: "Nosotros | Five Saint",
  description: 
    "Conocé la trayectoria de Five Saint, empresa argentina dedicada a la fabricación de bañeras, hidromasajes, spas, platos de ducha, columnas, saunas y duchas escocesas desde 1995. Calidad y diseño nacional.",
  keywords: [
    "nosotros",
    "historia",
    "trayectoria",
    "planta industrial",
    "fabricación nacional",
    "Five Saint Argentina",
    "bañeras",
    "spas"
  ]
};

/**
 * Página Institucional "Nosotros" (AboutPage - Sprint 6).
 * Compone secuencialmente los seis bloques requeridos por el Sprint:
 * portada Hero, reseña de historia, métricas, valores en tarjetas, pasos de fabricación y cierre CTA.
 */
export default function AboutPage() {
  return (
    <>
      {/* 1. Portada Institucional */}
      <AboutHero />

      {/* 2. Reseña Histórica y Cita */}
      <AboutStorySection />

      {/* 3. Panel de Métricas de Experiencia */}
      <AboutStatsSection />

      {/* 4. Mapeo de Diferenciales y Valores */}
      <AboutValuesSection />

      {/* 5. Timeline de Pasos de Fabricación */}
      <AboutProcessSection />

      {/* 6. Banner Comercial Final */}
      <AboutCTASection />
    </>
  );
}
