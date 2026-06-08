import { Product } from "@/types/product";
import { Card } from "@/components/ui/Card";
import { Check, Info, FileText } from "lucide-react";

interface ProductDetailContentProps {
  product: Product;
}

/**
 * Contenido Informativo y de Especificaciones (ProductDetailContent - Sprint 5/8).
 * Renderiza de forma condicional descripción, características, aplicaciones, notas y archivos.
 */
export function ProductDetailContent({ product }: ProductDetailContentProps) {
  return (
    <div className="flex flex-col gap-10 text-left">
      
      {/* 1. Sección de Descripción */}
      {product.description && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-stone-900 uppercase tracking-wider text-left">
            Descripción
          </h2>
          <div className="w-12 h-[2px] bg-accent-deep rounded-full mb-2" />
          <p className="text-stone-600 font-light text-base leading-relaxed">
            {product.description}
          </p>
        </div>
      )}

      {/* 2. Características Principales */}
      {product.features && product.features.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-stone-900 uppercase tracking-wider text-left">
            Características principales
          </h2>
          <div className="w-12 h-[2px] bg-accent-deep rounded-full mb-4" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.features.map((feature, idx) => (
              <Card
                key={idx}
                className="bg-white shadow-sm border border-stone-100/80 p-4 rounded-xl flex items-start gap-3 hover:shadow-md hover:border-stone-200/60 hover:-translate-y-0.5 transition-all duration-300 group"
                padding="none"
              >
                <div className="rounded-full bg-accent-soft/40 p-1.5 text-accent-deep shrink-0 mt-0.5 group-hover:bg-accent-deep group-hover:text-white transition-colors duration-300">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <span className="text-sm font-light text-stone-700 leading-tight">
                  {feature}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 3. Aplicaciones */}
      {product.applications && product.applications.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-stone-900 uppercase tracking-wider text-left">
            Aplicaciones sugeridas
          </h2>
          <div className="w-12 h-[2px] bg-accent-deep rounded-full mb-4" />
          <ul className="list-disc list-inside text-stone-600 font-light text-sm flex flex-col gap-2">
            {product.applications.map((app, idx) => (
              <li key={idx}>{app}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Notas Técnicas */}
      {product.technicalNotes && product.technicalNotes.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-stone-900 uppercase tracking-wider text-left">
            Notas Técnicas
          </h2>
          <div className="w-12 h-[2px] bg-accent-deep rounded-full mb-4" />
          <ul className="list-disc list-inside text-stone-600 font-light text-sm flex flex-col gap-2">
            {product.technicalNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Archivos Descargables */}
      {product.files && product.files.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-stone-900 uppercase tracking-wider text-left">
            Descargas
          </h2>
          <div className="w-12 h-[2px] bg-accent-deep rounded-full mb-4" />
          <div className="flex flex-col gap-2">
            {product.files.map((file) => (
              <a
                key={file.id}
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-accent-deep hover:underline text-sm font-medium"
              >
                <FileText className="h-4 w-4" />
                {file.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 6. Bloque de Alerta Informativo */}
      <div className="flex items-start gap-4 p-5 rounded-sm bg-accent-soft/30 border border-accent-soft text-stone-850 mt-4">
        <Info className="h-5 w-5 text-accent-deep shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs sm:text-sm font-light leading-relaxed text-stone-750">
          Las medidas, terminaciones y configuraciones disponibles pueden variar según la línea y el proyecto. Ponete en contacto con nuestro equipo comercial para recibir asesoramiento técnico personalizado.
        </p>
      </div>

    </div>
  );
}
export default ProductDetailContent;
