import React from "react";
import { Container } from "./Container";

interface SectionSeparatorProps {
  title: string;
}

/**
 * Separador de Sección estilizado (Sprint 3).
 * Renderiza una barra sólida en color turquesa Five Saint con patrón de ondas sutil,
 * utilizado para estructurar las secciones del Home de forma marcada y vibrante.
 */
export function SectionSeparator({ title }: SectionSeparatorProps) {
  return (
    <div className="w-full bg-[#087d9f] text-white py-4 relative overflow-hidden shadow-sm border-y border-[#066a87]">
      {/* Patrón de onda sutil de fondo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full object-cover">
          <path fill="#ffffff" d="M0,192L80,186.7C160,181,320,171,480,181.3C640,192,800,224,960,224C1120,224,1280,192,1360,176L1440,160L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z" />
        </svg>
      </div>

      <Container className="relative z-10 flex justify-center text-center">
        <h2 className="text-lg sm:text-xl font-bold uppercase tracking-[0.2em] text-white select-none">
          {title}
        </h2>
      </Container>
    </div>
  );
}

export default SectionSeparator;
