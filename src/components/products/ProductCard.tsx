import Link from "next/link";
import { Product } from "@/types/product";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Check, ArrowRight, Waves } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

/**
 * Tarjeta de Producto (ProductCard - Sprint 4).
 * Presenta un placeholder visual con gradientes fluidos, insignias (badges) condicionales,
 * listado de especificaciones (features) y llamado a la acción "Ver detalle".
 */
export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card
      hoverable
      className="flex flex-col justify-between h-full bg-white p-0 overflow-hidden group border border-stone-200/60"
      padding="none"
    >
      {/* 1. Contenedor de la Imagen Placeholder o Real con Gradiente */}
      <div className="relative w-full h-44 bg-gradient-to-br from-stone-50 via-white to-accent-soft/25 border-b border-stone-100 flex items-center justify-center transition-colors duration-300 group-hover:from-accent-soft/10 overflow-hidden">
        
        {/* Imagen real si existe */}
        {product.image ? (
          <img 
            src={product.image.url} 
            alt={product.image.alt || product.name} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            {/* Decoración Visual de Agua (solo si no hay imagen real) */}
            <Waves className="h-9 w-9 text-accent-deep/30 opacity-70 group-hover:scale-110 group-hover:text-accent-deep/50 transition-all duration-300" aria-hidden="true" />
            
            {/* Sello de Marca de Agua */}
            <span className="absolute bottom-3 right-3 text-[8.5px] uppercase tracking-widest font-semibold text-stone-300">
              Five Saint
            </span>
          </>
        )}

        {/* Badges de Categoría y Adicionales (sobre la imagen o placeholder) */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <Badge variant="outline" className="text-[8.5px] uppercase tracking-widest font-bold bg-white/95">
            {product.categoryName}
          </Badge>
          {product.badge && (
            <Badge variant="primary" className="text-[8.5px] uppercase tracking-widest font-bold shadow-sm">
              {product.badge}
            </Badge>
          )}
        </div>
      </div>

      {/* 2. Cuerpo de Información */}
      <div className="p-6 flex flex-col justify-between flex-1 gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-stone-900 group-hover:text-accent-deep transition-colors leading-tight">
            {product.name}
          </h3>
          <p className="text-xs font-light text-stone-500 leading-relaxed min-h-[36px]">
            {product.shortDescription}
          </p>

          {/* Listado de Características (Features) Limitado a 3 */}
          <ul className="mt-4 flex flex-col gap-2 border-t border-stone-100/60 pt-4">
            {product.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs font-light text-stone-600">
                <Check className="h-3.5 w-3.5 text-accent-deep shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-tight">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Pie de la Tarjeta con CTA de Detalles */}
        <div className="pt-4 border-t border-stone-100/60 flex items-center justify-between mt-auto">
          <span className="text-[9.5px] uppercase tracking-wider font-semibold text-stone-400">
            Medidas a Pedido
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs uppercase tracking-wider font-semibold group-hover:text-accent-deep cursor-pointer"
            asChild
          >
            <Link href={product.href} className="flex items-center gap-1">
              Ver detalle
              <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
export default ProductCard;
