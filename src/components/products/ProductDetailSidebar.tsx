import Link from "next/link";
import { Product } from "@/types/product";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MessageSquare, BadgeHelp, HelpCircle } from "lucide-react";

interface ProductDetailSidebarProps {
  product: Product;
}

/**
 * Tarjeta Lateral Sticky de Consulta (ProductDetailSidebar - Sprint 5).
 * Proporciona un canal de contacto rápido orientado a la conversión comercial,
 * acompañado de un resumen de especificaciones de instalación estandarizadas de Five Saint.
 */
export function ProductDetailSidebar({ product }: ProductDetailSidebarProps) {
  return (
    <aside className="w-full lg:sticky lg:top-24 h-fit">
      <Card className="bg-white border border-stone-200/60 shadow-sm p-6 sm:p-8 flex flex-col gap-6 text-left">
        
        {/* Título de Consulta */}
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-stone-900 leading-tight flex items-center gap-2">
            <BadgeHelp className="h-5 w-5 text-accent-deep shrink-0" aria-hidden="true" />
            Consulta personalizada
          </h3>
          <p className="text-xs font-light text-stone-500 leading-relaxed mt-2">
            Recibí orientación experta sobre planos de instalación, disponibilidad de matrices, medidas especiales y alternativas para este producto.
          </p>
        </div>

        {/* Botón de Contacto CTA */}
        <Button
          variant="primary"
          size="md"
          className="w-full uppercase tracking-wider font-semibold group cursor-pointer flex items-center justify-center gap-2"
          asChild
        >
          <Link href={`/contacto?ref=${product.slug}`}>
            Solicitar asesoramiento
            <MessageSquare className="h-4 w-4" />
          </Link>
        </Button>

        {/* Línea Separadora */}
        <div className="w-full h-[1px] bg-stone-100" aria-hidden="true" />

        {/* Resumen Ficha Técnica */}
        <div className="flex flex-col gap-4 text-xs font-light text-stone-600">
          <h4 className="font-semibold uppercase tracking-wider text-stone-400 text-[10px]">
            Especificaciones Ficha
          </h4>
          
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center py-1.5 border-b border-stone-50/50">
              <span className="text-stone-400">Producto</span>
              <span className="font-semibold text-stone-850 truncate max-w-[150px]">{product.name}</span>
            </div>
            
            <div className="flex justify-between items-center py-1.5 border-b border-stone-50/50">
              <span className="text-stone-400">Línea</span>
              <span className="font-semibold text-stone-850">{product.categoryName}</span>
            </div>
            
            <div className="flex justify-between items-center py-1.5 border-b border-stone-50/50">
              <span className="text-stone-400">Uso</span>
              <span className="font-semibold text-stone-850">Residencial / Comercial</span>
            </div>
            
            <div className="flex justify-between items-center py-1.5">
              <span className="text-stone-400">Plano de Obra</span>
              <span className="font-semibold text-stone-850">A confirmar según modelo</span>
            </div>
          </div>
        </div>

      </Card>
    </aside>
  );
}
export default ProductDetailSidebar;
