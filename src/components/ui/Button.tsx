import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Definición de variantes y tamaños con Class Variance Authority (CVA)
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-sm text-sm font-medium tracking-wide transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-stone-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-deep text-white hover:bg-accent-deep/90 shadow-xs border border-transparent",
        secondary:
          "bg-stone-100 text-stone-900 hover:bg-stone-200/80 border border-transparent",
        outline:
          "border border-stone-200 bg-transparent text-stone-800 hover:bg-stone-50 hover:text-stone-950",
        ghost:
          "text-stone-700 hover:bg-stone-100/50 hover:text-stone-950",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Componente de Botón institucional, reutilizable, accesible y altamente parametrizable.
 * Soporta variantes visuales sofisticadas y diferentes dimensiones físicas.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
        className: cn(buttonVariants({ variant, size, className }), child.props.className),
        ref: ref,
        ...props,
      });
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
