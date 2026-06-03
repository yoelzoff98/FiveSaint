import { ProductVariant } from "@/types/product";
import { Check, Download, Info, Maximize, Settings, Star, Users } from "lucide-react";

type ProductVariantsSectionProps = {
  variants: ProductVariant[];
};

export function ProductVariantsSection({ variants }: ProductVariantsSectionProps) {
  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-stone-50 border-t border-stone-200">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-12 md:mb-16 text-center max-w-3xl mx-auto">
          <span className="text-accent-deep font-semibold tracking-wider uppercase text-sm mb-3 block">
            Versiones disponibles
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-6 font-display tracking-wide">
            Configuraciones y variantes
          </h2>
          <p className="text-lg text-stone-600 leading-relaxed">
            Cada línea puede contar con alternativas de equipamiento, medida o configuración según el producto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {variants.map((variant) => (
            <div 
              key={variant.id} 
              className={`bg-white rounded-2xl shadow-sm border p-6 md:p-8 flex flex-col transition-all duration-300 hover:shadow-md ${
                variant.isDefault ? "border-accent-deep/50 ring-1 ring-accent-deep/20" : "border-stone-200"
              }`}
            >
              <div className="mb-6 pb-6 border-b border-stone-100 flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold text-stone-900 font-display">{variant.name}</h3>
                  {variant.isDefault && (
                    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Predeterminada
                    </span>
                  )}
                </div>
                
                {variant.shortDescription && (
                  <p className="text-stone-600 text-sm mb-4 leading-relaxed">
                    {variant.shortDescription}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mt-4">
                  {variant.sizeLabel && (
                    <div className="inline-flex items-center gap-2 text-sm text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg font-medium">
                      <Maximize className="w-4 h-4 text-stone-500" />
                      {variant.sizeLabel}
                    </div>
                  )}
                  {variant.capacityLabel && (
                    <div className="inline-flex items-center gap-2 text-sm text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg font-medium">
                      <Users className="w-4 h-4 text-stone-500" />
                      {variant.capacityLabel}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {variant.description && (
                  <div className="text-sm text-stone-600 leading-relaxed">
                    {variant.description}
                  </div>
                )}

                {variant.equipment && variant.equipment.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-accent-deep" />
                      Equipamiento Incluido
                    </h4>
                    <ul className="space-y-2">
                      {variant.equipment.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                          <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {variant.features && variant.features.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-accent-deep" />
                      Características
                    </h4>
                    <ul className="space-y-2">
                      {variant.features.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-deep/50 shrink-0 mt-1.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {variant.technicalNotes && variant.technicalNotes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-accent-deep" />
                      Notas Técnicas
                    </h4>
                    <ul className="space-y-2">
                      {variant.technicalNotes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0 mt-1.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {variant.planFileUrl && (
                  <div className="pt-4 mt-2 border-t border-stone-100">
                    <a 
                      href={variant.planFileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-accent-deep bg-accent-deep/5 hover:bg-accent-deep/10 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {variant.planFileName || "Descargar Plano"}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
