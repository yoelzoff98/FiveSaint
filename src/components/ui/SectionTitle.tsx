import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center" | "right";
  light?: boolean; // Si es true, invierte los colores para fondos oscuros
}

/**
 * Componente premium para títulos de sección.
 * Incorpora un eyebrow (copete estilizado), el título principal con tipografía sofisticada
 * y un párrafo de descripción opcional alineado dinámicamente.
 */
export const SectionTitle = React.forwardRef<HTMLDivElement, SectionTitleProps>(
  ({ className, eyebrow, title, description, align = "left", light = false, ...props }, ref) => {
    const alignClasses = {
      left: "text-left items-start",
      center: "text-center items-center mx-auto",
      right: "text-right items-end ml-auto",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-3 max-w-3xl",
          alignClasses[align],
          className
        )}
        {...props}
      >
        {eyebrow && (
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-widest sm:text-xs",
              light ? "text-accent-soft" : "text-accent-deep"
            )}
          >
            {eyebrow}
          </span>
        )}
        <h2
          className={cn(
            "text-3xl font-light leading-tight tracking-tight sm:text-4xl md:text-5xl",
            light ? "text-white" : "text-stone-900"
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-2 text-base font-light leading-relaxed sm:text-lg",
              light ? "text-stone-300" : "text-stone-500"
            )}
          >
            {description}
          </p>
        )}
      </div>
    );
  }
);

SectionTitle.displayName = "SectionTitle";
export default SectionTitle;
