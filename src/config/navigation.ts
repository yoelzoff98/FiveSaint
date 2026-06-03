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
    { title: "Nuestra Planta", href: "/nosotros#planta" },
    { title: "Trayectoria desde 1995", href: "/nosotros#historia" },
    { title: "Contacto", href: "/contacto" },
  ] as FooterNavItem[],
  
  categories: [
    { title: "Bañeras", href: "/productos/baneras" },
    { title: "Hidromasajes", href: "/productos/hidromasajes" },
    { title: "Spas", href: "/productos/spas" },
    { title: "Platos de Ducha", href: "/productos/platos-de-ducha" },
    { title: "Columnas de Ducha", href: "/productos/columnas" },
    { title: "Saunas", href: "/productos/saunas" },
    { title: "Duchas Escocesas", href: "/productos/duchas-escocesas" },
  ] as FooterNavItem[],

  legal: [
    { title: "Términos y Condiciones", href: "/legal/terminos" },
    { title: "Políticas de Privacidad", href: "/legal/privacidad" },
    { title: "Garantía de Productos", href: "/legal/garantia" },
  ] as FooterNavItem[],
};
