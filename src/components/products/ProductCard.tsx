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
  const isPlatoDucha = product.categorySlug === 'platos-de-duchas' || product.categoryName?.toLowerCase().includes('plato');
  const isBanera = product.categorySlug === 'baneras' || product.categorySlug === 'bañeras' || product.categoryName?.toLowerCase().includes('bañera') || product.categoryName?.toLowerCase().includes('banera');

  return (
    <Card
      hoverable
      className="flex flex-col justify-between h-full bg-white p-0 overflow-hidden group border border-stone-100/50 shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] rounded-[1.5rem] hover:-translate-y-1 transition-all duration-500"
      padding="none"
    >
      {/* 1. Contenedor de la Imagen Placeholder o Real con Gradiente */}
      <div className={`relative w-full flex items-center justify-center overflow-hidden ${
        isBanera 
          ? 'bg-gradient-to-br from-[#71717a] via-[#8d8d97] to-[#52525b]' 
          : 'bg-gradient-to-br from-stone-100 via-white to-stone-50'
      } ${isPlatoDucha ? 'aspect-[3/4] sm:aspect-[4/5]' : 'h-48 sm:h-56'}`}>
        
        {/* Imagen real si existe */}
        {product.image ? (
          <img 
            src={product.image.url} 
            alt={product.image.alt || product.name} 
            className={`absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-110 ${
              isBanera ? 'object-contain p-1 sm:p-2 drop-shadow-[0_20px_25px_rgba(0,0,0,0.55)]' : 'object-cover'
            }`}
          />
        ) : (
          <>
            {/* Decoración Visual de Agua (solo si no hay imagen real) */}
            <Waves className={`h-9 w-9 opacity-70 group-hover:scale-110 transition-all duration-300 ${
              isBanera ? 'text-white/80 group-hover:text-white' : 'text-accent-deep/30 group-hover:text-accent-deep/50'
            }`} aria-hidden="true" />
            
            {/* Sello de Marca de Agua */}
            <span className={`absolute bottom-3 right-3 text-[8.5px] uppercase tracking-widest font-semibold ${
              isBanera ? 'text-zinc-200/70' : 'text-stone-300'
            }`}>
              Five Saint
            </span>
          </>
        )}

        {/* Badges de Categoría y Adicionales (sobre la imagen o placeholder) */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <Badge variant="outline" className={`text-[8.5px] uppercase tracking-widest font-bold ${
            isBanera ? 'bg-zinc-900/80 text-white border-zinc-500/80 backdrop-blur-xs' : 'bg-white/95'
          }`}>
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
        <div className="pt-5 border-t border-stone-100/60 flex items-center justify-between mt-auto">
          <span className="text-[9.5px] uppercase tracking-wider font-semibold text-stone-400">
            Medidas a Pedido
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold group-hover:text-white group-hover:bg-accent-deep/90 transition-all duration-300 cursor-pointer rounded-xl px-4 hover:shadow-md"
            asChild
          >
            <Link href={product.href} className="flex items-center gap-1">
              Ver detalle
              <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
export default ProductCard;
