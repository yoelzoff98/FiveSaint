import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { siteConfig } from "@/config/site";
import { Calendar, Layers, MapPin } from "lucide-react";

/**
 * Cabecera del Catálogo (ProductCatalogHeader - Sprint 4).
 * Presenta un encabezado institucional amplio con una grilla decorativa de estadísticas rápidas,
 * preparando al usuario comercial y particular para explorar el catálogo de productos.
 */
export function ProductCatalogHeader() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f2f9fb] via-[#f7fbfd] to-stone-50/80 pt-8 pb-7 sm:pt-10 sm:pb-8 border-b border-stone-200/70">
      {/* Sutil resplandor de fondo en color marca */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#087d9f]/10 via-transparent to-transparent -z-10" />
      
      <Container className="flex flex-col gap-3.5 sm:gap-4 items-start text-left relative z-10">
        <Badge variant="outline" className="uppercase tracking-widest text-[9px] font-bold px-3 py-0.5 text-[#087d9f] border-[#087d9f]/30 bg-[#087d9f]/10">
          Catálogo Oficial
        </Badge>
        
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-stone-900 leading-tight max-w-3xl">
          Soluciones para <span className="font-semibold text-[#087d9f]">baño, relax y bienestar</span>
        </h1>
        
        <p className="max-w-2xl text-xs sm:text-sm font-light text-stone-600 leading-relaxed">
          Explorá las principales líneas de productos Five Saint: bañeras, hidromasajes, spas, platos de ducha, columnas, saunas y duchas escocesas.
        </p>

        {/* Chips compactos de estadísticas al pie de la cabecera */}
        <div className="mt-2 pt-3 border-t border-stone-200/80 flex flex-wrap items-center gap-3 sm:gap-5 w-full">
          <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-stone-200/80 shadow-xs text-xs">
            <Calendar className="h-3.5 w-3.5 text-[#087d9f]" aria-hidden="true" />
            <span className="text-stone-500 font-medium">Trayectoria:</span>
            <span className="font-bold text-stone-800">Desde {siteConfig.foundedYear}</span>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-stone-200/80 shadow-xs text-xs">
            <Layers className="h-3.5 w-3.5 text-[#087d9f]" aria-hidden="true" />
            <span className="text-stone-500 font-medium">Variedad:</span>
            <span className="font-bold text-stone-800">+200 Artículos</span>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-stone-200/80 shadow-xs text-xs">
            <MapPin className="h-3.5 w-3.5 text-[#087d9f]" aria-hidden="true" />
            <span className="text-stone-500 font-medium">Origen:</span>
            <span className="font-bold text-stone-800">Fabricación Nacional</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
export default ProductCatalogHeader;
