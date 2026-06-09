/**
 * Configuración global del sitio web institucional de Five Saint (Sprint 2).
 * Contiene metadatos de SEO, información corporativa de contacto y enlaces de redes sociales.
 */

export const siteConfig = {
  name: "Five Saint",
  tagline: "Diseño, Confort y Bienestar en Hidromasajes y Spas",
  description: 
    "Fabricante líder en la Argentina desde 1995. Diseñamos y fabricamos bañeras, hidromasajes, spas, platos de ducha, columnas de ducha, saunas y duchas escocesas con los más altos estándares de calidad, innovación y diseño.",
  url: "https://www.fivesaint.com.ar",
  ogImage: "/images/og-image.jpg",
  foundedYear: 1995,
  foundationYear: 1995, // Alias para garantizar retrocompatibilidad del Sprint 1
  location: "Buenos Aires, Argentina",
  
  contact: {
    address: "Buenos Aires, Argentina",
    phone: "+54 11 3816-1492",
    email: "info@fivesaint.com",
    workingHours: "A definir",
    whatsapp: "+541138161492",
    location: "Buenos Aires, Argentina",
    businessHours: "A definir",
  },

  socials: {
    instagram: "https://instagram.com/fivesaint",
    facebook: "https://facebook.com/fivesaint",
    linkedin: "https://linkedin.com/company/fivesaint",
  },

  values: [
    {
      title: "Diseño Premium",
      description: "Líneas elegantes, minimalistas y ergonómicas que embellecen cada espacio de baño."
    },
    {
      title: "Confort & Bienestar",
      description: "Tecnología de hidromasaje y spa pensada para un relax físico y mental absoluto."
    },
    {
      title: "Calidad de Exportación",
      description: "Materiales nobles como el acrílico sanitario reforzado de alta durabilidad."
    },
    {
      title: "Innovación Tecnológica",
      description: "Sistemas de jets autolimpiantes, calefactores digitales y cromoterapia integrada."
    }
  ]
};

export type SiteConfig = typeof siteConfig;
