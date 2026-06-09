import Link from "next/link";
import Image from "next/image";
import { productCategories } from "@/config/product-categories";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ArrowRight, Check } from "lucide-react";

// Mapeo de imágenes generadas para cada categoría
const categoryImages: Record<string, string> = {
  "spas-y-minipiscinas": "/images/cat_spas_new.jpg",
  "baneras": "/images/cat_baneras_new.jpg",
  "platos-de-duchas": "/images/cat_platos_new.jpg",
  "columnas-de-ducha": "/images/cat_columnas.png",
  "ducha-escocesa": "/images/DuchaEscocesa.png",
  "sauna": "/images/cat_saunas.png",
  "adicionales": "/images/duchador-manual.png"
};

/**
 * Sección de Categorías de Producto (Sprint 3).
 * Rediseñada bajo las directrices del sitio actual: incorpora la barra separadora turquesa
 * "Nuestros Productos" y renderiza las tarjetas de producto utilizando imágenes reales
 * de fondo con capas de overlay oscuras y un panel de detalles interactivo al hacer hover.
 */
export function ProductCategoriesSection() {
  return (
    <section className="py-20 lg:py-28 bg-[#fafcfd] border-b border-stone-200/50">
      <Container className="flex flex-col gap-12">
        <SectionTitle
          eyebrow="Explora nuestras líneas"
          title="Nuestros Productos"
          description="Descubre nuestra amplia gama de soluciones diseñadas para brindar la mejor experiencia de bienestar en tus espacios."
          align="center"
        />
        

          {/* Grilla de Categorías */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productCategories.map((category) => {
              const bgImage = categoryImages[category.id] || "/images/cat_baneras.png";
              
              return (
                <Card
                  key={category.id}
                  padding="none"
                  className="relative isolate h-[280px] sm:h-[320px] rounded-2xl overflow-hidden group shadow-lg hover:shadow-xl hover:shadow-[#087d9f]/10 transition-all duration-500 border border-stone-200/40"
                >
                  {/* Imagen de fondo real de la categoría */}
                  <div className="absolute inset-0 w-full h-full -z-20">
                    <Image
                      src={bgImage}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>

                  {/* Superposición oscura gradual */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25 -z-10 group-hover:via-black/55 transition-all duration-300" />

                  {/* Contenido por defecto (Siempre Visible) */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between items-center text-center">
                    {/* Vacío superior para empujar el texto al centro */}
                    <div />

                    {/* Título y Tagline */}
                    <div className="flex flex-col gap-2 transform group-hover:-translate-y-8 transition-transform duration-500">
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide leading-tight drop-shadow-md">
                        {category.name}
                      </h3>
                      {category.tagline && (
                        <span className="text-[10px] font-bold text-[#9de6f2] uppercase tracking-widest drop-shadow-sm">
                          {category.tagline}
                        </span>
                      )}
                    </div>

                    {/* Botón flotante inferior */}
                    <div className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#9de6f2] hover:text-white">
                        Ver línea <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  {/* Panel Flotante de Detalles al hacer Hover (Glassmorphism Slide Up) */}
                  <div className="absolute inset-x-0 bottom-0 h-4/5 bg-[#01161d]/90 backdrop-blur-md border-t border-white/10 p-6 flex flex-col justify-between transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-t-2xl">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="text-lg font-bold text-white">{category.name}</span>
                        <span className="text-[9px] font-bold text-[#c5a880] uppercase tracking-widest bg-[#c5a880]/15 px-2 py-0.5 rounded-md border border-[#c5a880]/20">
                          Premium
                        </span>
                      </div>
                      
                      <p className="text-xs font-light text-stone-300 leading-relaxed">
                        {category.description}
                      </p>

                      {/* Highlights / Viñetas */}
                      {category.highlights && (
                        <ul className="flex flex-col gap-1.5 mt-2">
                          {category.highlights.map((highlight) => (
                            <li key={highlight} className="flex items-center gap-2 text-[11px] font-light text-stone-200">
                              <div className="rounded-full bg-[#087d9f]/20 p-0.5 text-[#9de6f2] shrink-0 border border-[#087d9f]/30">
                                <Check className="h-2.5 w-2.5 stroke-[3]" aria-hidden="true" />
                              </div>
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Enlace final del Panel */}
                    <Link
                      href={category.href}
                      className="w-full py-2.5 bg-[#087d9f] hover:bg-[#055f79] text-center text-xs font-bold uppercase tracking-widest text-white rounded-lg transition-colors duration-300 shadow-md flex items-center justify-center gap-2"
                    >
                      Explorar Catálogo
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Botón inferior - Ver todos los productos */}
          <div className="flex justify-center mt-6">
            <Link
              href="/productos"
              className="px-8 py-3.5 border-2 border-[#087d9f] hover:bg-[#087d9f] text-[#087d9f] hover:text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 shadow-sm"
            >
              Todos Nuestros Productos
            </Link>
          </div>

        </Container>
      </section>
  );
}

export default ProductCategoriesSection;
