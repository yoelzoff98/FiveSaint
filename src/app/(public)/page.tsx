import HeroSection from "@/components/sections/HeroSection";
import ProductCategoriesSection from "@/components/sections/ProductCategoriesSection";
import AboutPreviewSection from "@/components/sections/AboutPreviewSection";
import FeaturedProductsSection from "@/components/sections/FeaturedProductsSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import ClientsSection from "@/components/sections/ClientsSection";
import ContactCTASection from "@/components/sections/ContactCTASection";

/**
 * Página principal (HomePage - Sprint 3).
 * Actúa de forma limpia únicamente como un orquestador que compone las 7 secciones
 * del home organizadas secuencialmente, facilitando el mantenimiento y la modularidad del sitio.
 */
export default function HomePage() {
  return (
    <>
      {/* 1. Portada Visual de Impacto */}
      <HeroSection />

      {/* 2. Muestrario de Categorías */}
      <ProductCategoriesSection />

      {/* 3. Previsualización Institucional y Trayectoria */}
      <AboutPreviewSection />

      {/* 4. Muestrario de Productos Destacados */}
      <FeaturedProductsSection />

      {/* 5. Valores y Diferenciales de la Marca */}
      <BenefitsSection />

      {/* 6. Sectores y Clientes de Confianza */}
      <ClientsSection />

      {/* 7. Banner Comercial de Contacto y Cierre */}
      <ContactCTASection />
    </>
  );
}
