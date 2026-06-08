"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { navigationItems } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import MobileMenu from "./MobileMenu";
import { cn } from "@/lib/utils";

/**
 * Cabecera institucional responsive (Header - Sprint 2).
 * Incluye un diseño sticky translúcido con efecto glassmorphism, mapeo dinámico de navegación,
 * subtexto de trayectoria y accesibilidad ARIA completa para la navegación móvil.
 */
export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Escucha el desplazamiento vertical para alterar la opacidad de fondo de forma sutil
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300 ease-in-out border-b backdrop-blur-md",
          scrolled
            ? "bg-white/85 shadow-sm border-stone-200/40 py-3"
            : "bg-white/70 border-stone-100/30 py-5"
        )}
      >
        <Container className="flex items-center justify-between">
          {/* Logo Corporativo con subtexto de trayectoria e imagen vectorizada */}
          <Link
            href="/"
            className="group flex items-center gap-3 focus-visible:outline-accent-deep focus-visible:outline-2 focus-visible:outline-offset-4"
            aria-label={`${siteConfig.name} - Volver al inicio`}
          >
            <div className="relative w-10 h-10 overflow-hidden rounded-lg shadow-sm border border-stone-200/40 bg-[#007299] shrink-0 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
              <Image
                src="/logo.png"
                alt="Five Saint Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-sans text-base font-bold uppercase tracking-[0.2em] text-stone-900 group-hover:text-accent-deep transition-colors leading-tight">
                {siteConfig.name}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-400 mt-0.5 leading-none">
                Equipamientos para Spa
              </span>
            </div>
          </Link>

          {/* Menú de Navegación de Escritorio */}
          <nav className="hidden md:flex items-center gap-8 text-stone-600">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative text-xs font-semibold tracking-widest uppercase transition-colors py-1.5 hover:text-stone-950",
                    isActive ? "text-stone-950 font-bold" : "text-stone-500"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                  <span className={cn(
                    "absolute bottom-0 left-0 h-[2px] bg-accent-deep rounded-full transition-all duration-300",
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  )} />
                </Link>
              );
            })}
          </nav>

          {/* Botón CTA Superior de Escritorio y Buscador */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative w-36 lg:w-44">
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full text-xs font-light px-3 py-1.5 pr-8 rounded-md border border-stone-200/80 focus:outline-none focus:border-accent-deep bg-stone-50/80 focus:bg-white transition-all duration-300"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs uppercase tracking-wider font-semibold cursor-pointer"
              asChild
            >
              <Link href="/contacto">Solicitar asesoramiento</Link>
            </Button>
          </div>

          {/* Gatillo del Menú Móvil */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-sm p-2 text-stone-700 hover:bg-stone-100 hover:text-stone-950 md:hidden transition-colors cursor-pointer"
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </Container>
      </header>

      {/* Menú Lateral Drawer para Mobile/Tablet */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
