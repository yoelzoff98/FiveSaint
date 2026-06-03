import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { siteConfig } from "@/config/site";

/**
 * Cabecera del Catálogo (ProductCatalogHeader - Sprint 4).
 * Presenta un encabezado institucional amplio con una grilla decorativa de estadísticas rápidas,
 * preparando al usuario comercial y particular para explorar el catálogo de productos.
 */
export function ProductCatalogHeader() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 border-b border-stone-200/50">
      {/* Detalle visual sutil de gradiente de agua */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_35rem_at_top,theme(colors.accent-soft/20%),transparent)]" />
      
      <Container className="flex flex-col gap-6 items-start text-left">
        <Badge variant="primary" className="uppercase tracking-widest text-[9px] font-bold px-3 py-1">
          Catálogo Oficial
        </Badge>
        
        <h1 className="text-3xl font-light tracking-tight text-stone-900 sm:text-5xl leading-tight max-w-3xl">
          Soluciones para <span className="font-semibold text-accent-deep">baño, relax y bienestar</span>
        </h1>
        
        <p className="max-w-2xl text-sm sm:text-base font-light text-stone-500 leading-relaxed">
          Explorá las principales líneas de productos Five Saint: bañeras, hidromasajes, spas, platos de ducha, columnas, saunas y duchas escocesas.
        </p>

        {/* Grilla de Estadísticas Rápidas al pie de la cabecera */}
        <div className="mt-6 pt-8 border-t border-stone-100 flex flex-wrap gap-8 sm:gap-16 w-full">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-stone-950">Desde {siteConfig.foundedYear}</span>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-light">Trayectoria y Confianza</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-stone-950">+200 Artículos</span>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-light">Variedad y Adaptabilidad</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-stone-950">{siteConfig.location}</span>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-light">Fabricación Nacional</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
export default ProductCatalogHeader;
