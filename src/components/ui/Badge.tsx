import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "outline";
}

/**
 * Componente Badge premium para micro-etiquetas.
 * Perfecto para destacar características, novedades o badges promocionales.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const variantClasses = {
      primary: "bg-accent-soft text-accent-deep",
      secondary: "bg-stone-100 text-stone-700",
      outline: "border border-stone-200 text-stone-600 bg-transparent",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
export default Badge;
