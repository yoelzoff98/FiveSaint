import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  clean?: boolean; // Si es true, elimina los paddings por defecto
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

/**
 * Componente contenedor estructural que centraliza el contenido de forma responsiva.
 * Mantiene un ancho de lectura y márgenes laterales consistentes en todo el sitio web.
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, as: Component = "div", clean = false, size = "lg", ...props }, ref) => {
    const sizeClasses = {
      sm: "max-w-3xl",
      md: "max-w-5xl",
      lg: "max-w-7xl",
      xl: "max-w-8xl",
      full: "max-w-none",
    };

    return (
      <Component
        ref={ref}
        className={cn(
          "mx-auto w-full",
          !clean && "px-4 sm:px-6 lg:px-8",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Container.displayName = "Container";
export default Container;
