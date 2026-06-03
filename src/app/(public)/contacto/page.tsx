import type { Metadata } from "next";
import ContactHero from "@/components/contact/ContactHero";
import ContactPageContent from "@/components/contact/ContactPageContent";

// Metadatos SEO enriquecidos para la página de Contacto
export const metadata: Metadata = {
  title: "Contacto | Five Saint",
  description: 
    "Contactá a Five Saint para recibir asesoramiento personalizado sobre bañeras, hidromasajes, spas, platos de ducha, columnas de ducha, saunas y duchas escocesas de fabricación nacional.",
  keywords: [
    "contacto Five Saint",
    "solicitar asesoramiento",
    "presupuesto bañeras",
    "presupuesto hidromasajes",
    "spas Argentina",
    "fábrica de saunas",
    "atención comercial"
  ]
};

/**
 * Página de Contacto (/contacto - Sprint 7).
 * Compone secuencialmente la portada de contacto y el contenedor principal con el formulario validado y coordenadas.
 */
export default function ContactPage() {
  return (
    <>
      {/* 1. Cabecera Visual */}
      <ContactHero />

      {/* 2. Formulario y Datos de Soporte */}
      <ContactPageContent />
    </>
  );
}
