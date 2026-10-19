/**
 * Configuración de la estructura de navegación del sitio (Sprint 2).
 * Define los enlaces principales de la cabecera (Header) y del pie de página (Footer).
 */

export interface NavigationItem {
  label: string;
  href: string;
}

export interface FooterNavItem {
  title: string;
  href: string;
}

// Navegación principal requerida para el Header y MobileMenu
export const navigationItems: NavigationItem[] = [
  {
    label: "Inicio",
    href: "/",
  },
  {
    label: "Productos",
    href: "/productos",
  },
  {
    label: "Nosotros",
    href: "/nosotros",
  },
  {
    label: "Contacto",
    href: "/contacto",
  },
];

// Navegación agrupada para el pie de página
export const footerNavigation = {
  company: [
    { title: "Sobre Five Saint", href: "/nosotros" },
    { title: "Cómo trabajamos", href: "/nosotros#proceso" },
    { title: "Trayectoria desde 1995", href: "/nosotros#historia" },
    { title: "Contacto", href: "/contacto" },
  ] as FooterNavItem[],

  categories: [
    { title: "Bañeras", href: "/productos?categoria=baneras" },
    {
      title: "Spa y Minipiscinas",
      href: "/productos?categoria=spa-y-minipiscinas",
    },
    {
      title: "Platos de Duchas",
      href: "/productos?categoria=platos-de-duchas",
    },
    {
      title: "Columnas de Ducha",
      href: "/productos?categoria=columnas-de-ducha",
    },
    { title: "Ducha Escocesa", href: "/productos?categoria=ducha-escocesa" },
    { title: "Sauna", href: "/productos?categoria=sauna" },
  ] as FooterNavItem[],

  // Published legal texts are pending; do not link to nonexistent pages.
  legal: [] as FooterNavItem[],
};
