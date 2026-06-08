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
    <section className="relative overflow-hidden bg-stone-900 pt-16 pb-12 sm:pt-20 sm:pb-14 border-b border-stone-800">
      {/* Luz tenue de fondo para darle profundidad al oscuro */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-deep/15 via-stone-900 to-stone-900 -z-10" />
      
      <Container className="flex flex-col gap-6 items-start text-left relative z-10">
        <Badge variant="outline" className="uppercase tracking-widest text-[9px] font-bold px-3 py-1 text-accent-soft border-accent-soft/30 bg-accent-soft/10">
          Catálogo Oficial
        </Badge>
        
        <h1 className="text-3xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight max-w-3xl">
          Soluciones para <span className="font-semibold text-accent-soft">baño, relax y bienestar</span>
        </h1>
        
        <p className="max-w-2xl text-sm sm:text-base font-light text-stone-300 leading-relaxed">
          Explorá las principales líneas de productos Five Saint: bañeras, hidromasajes, spas, platos de ducha, columnas, saunas y duchas escocesas.
        </p>

        {/* Grilla de Estadísticas Rápidas al pie de la cabecera */}
        <div className="mt-8 pt-8 border-t border-stone-800 flex flex-wrap gap-4 sm:gap-6 w-full">
          
          <div className="flex items-center gap-4 bg-stone-800/40 backdrop-blur-md p-4 pr-8 rounded-2xl border border-white/5 shadow-xl hover:bg-stone-800/60 hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="bg-stone-800 p-2.5 rounded-full shadow-sm text-accent-soft border border-white/5 group-hover:bg-accent-deep group-hover:text-white transition-colors duration-300">
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">Trayectoria y Confianza</span>
              <span className="text-sm font-semibold text-white">Desde {siteConfig.foundedYear}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-stone-800/40 backdrop-blur-md p-4 pr-8 rounded-2xl border border-white/5 shadow-xl hover:bg-stone-800/60 hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="bg-stone-800 p-2.5 rounded-full shadow-sm text-accent-soft border border-white/5 group-hover:bg-accent-deep group-hover:text-white transition-colors duration-300">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">Variedad y Adaptabilidad</span>
              <span className="text-sm font-semibold text-white">+200 Artículos</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-stone-800/40 backdrop-blur-md p-4 pr-8 rounded-2xl border border-white/5 shadow-xl hover:bg-stone-800/60 hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="bg-stone-800 p-2.5 rounded-full shadow-sm text-accent-soft border border-white/5 group-hover:bg-accent-deep group-hover:text-white transition-colors duration-300">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">Fabricación Nacional</span>
              <span className="text-sm font-semibold text-white">{siteConfig.location}</span>
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}
export default ProductCatalogHeader;
