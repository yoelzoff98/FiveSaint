import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Card es un contenedor visual premium y minimalista.
 * Soporta efectos sutiles de hover, paddings configurables y renderizado polimórfico.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, as: Component = "div", hoverable = false, padding = "md", ...props }, ref) => {
    const paddingClasses = {
      none: "p-0",
      sm: "p-4 sm:p-5",
      md: "p-6 sm:p-8",
      lg: "p-8 sm:p-10",
    };

    return (
      <Component
        ref={ref}
        className={cn(
          "rounded-sm border border-stone-200/60 bg-white text-stone-900 transition-all duration-300 ease-out",
          hoverable && "hover:-translate-y-1 hover:border-accent-deep/20 hover:shadow-lg hover:shadow-stone-100",
          paddingClasses[padding],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
export default Card;
