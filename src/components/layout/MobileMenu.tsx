"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { navigationItems } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente de Menú Móvil interactivo (Sprint 2).
 * Implementa accesibilidad ARIA, transiciones suaves y cierre automático al navegar.
 */
export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  // Bloquea el scroll de la página de fondo cuando el menú está abierto
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo desenfocado y semitransparente */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Panel Lateral Desplazable */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-sm flex-col bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            id="mobile-menu"
          >
            {/* Header del Menú */}
            <div className="flex items-center justify-between">
              <span className="font-sans text-lg font-semibold uppercase tracking-[0.2em] text-stone-900">
                {siteConfig.name}
              </span>
              <button
                onClick={onClose}
                aria-label="Cerrar menú de navegación"
                className="rounded-sm p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Listado de Enlaces de Navegación */}
            <nav className="mt-12 flex flex-col gap-5">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "text-xl font-light tracking-wide transition-colors py-2 border-b border-stone-100 block",
                      isActive
                        ? "text-accent-deep font-normal border-accent-deep/30"
                        : "text-stone-700 hover:text-stone-950 hover:border-stone-200"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer del Menú con CTA y Contacto */}
            <div className="mt-auto flex flex-col gap-6 border-t border-stone-100 pt-6">
              {/* Botón CTA para Móviles */}
              <Button
                variant="primary"
                size="md"
                className="w-full text-xs uppercase tracking-wider font-semibold cursor-pointer"
                asChild
              >
                <Link href="/contacto" onClick={onClose}>
                  Solicitar asesoramiento
                </Link>
              </Button>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Trayectoria
                </span>
                <span className="text-xs font-light text-stone-600">
                  Fabricando bienestar desde {siteConfig.foundedYear} | {siteConfig.location}
                </span>
              </div>

              {/* Redes Sociales */}
              <div className="flex items-center gap-4 text-stone-500 pt-2">
                <a
                  href={siteConfig.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-stone-900 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a
                  href={siteConfig.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-stone-900 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0 -5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a
                  href={siteConfig.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-stone-900 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
