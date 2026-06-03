import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";

/**
 * Sección de Previsualización Institucional (Sobre Nosotros) (Sprint 3).
 * Rediseñada recreando la estética del sitio actual: incorpora la imagen real de fondo
 * de agua burbujeante (about_bg.png), el bloque izquierdo con el check de relajación y los
 * textos principales, y el bloque derecho con una tarjeta translúcida flotante.
 */
export function AboutPreviewSection() {
  return (
    <section className="relative isolate overflow-hidden py-24 lg:py-32 border-b border-stone-200/50">
      
      {/* Fondo fotográfico real (Agua y Burbujas de Spa) */}
      <div className="absolute inset-0 -z-20 w-full h-full">
        <Image
          src="/images/about_bg.png"
          alt="Agua relajante de spa Five Saint"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Capa de superposición para oscurecer el fondo y dar contraste */}
      <div className="absolute inset-0 -z-10 bg-stone-900/60 backdrop-blur-sm" />

      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Columna Izquierda: Bloque "Sobre Nosotros" con Checkmark Circular estilo Splatter */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center text-center gap-2 lg:border-r lg:border-stone-400/30 lg:pr-8">
          <span className="text-stone-300 font-sans text-lg font-semibold uppercase tracking-[0.25em] select-none">
            Sobre
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-wider drop-shadow-md select-none">
            Nosotros
          </h2>
          
          {/* Círculo Checkmark azul spa */}
          <div className="mt-6 w-20 h-20 bg-[#087d9f] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 relative">
            <Check className="h-10 w-10 stroke-[2.5]" />
            {/* Anillos de pulsación sutil */}
            <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping opacity-75" />
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Información Translúcida Flotante */}
        <div className="lg:col-span-7">
          <div className="bg-stone-900/60 backdrop-blur-md rounded-3xl border border-white/10 p-8 sm:p-10 shadow-2xl flex flex-col gap-6 text-left hover:bg-stone-900/70 transition-colors duration-500">
            <p className="text-base font-light text-stone-200 leading-relaxed">
              Fundada en 1995, hoy somos la empresa líder en la fabricación y suministro de bañeras, sistemas de hidromasaje, spa minipiscinas, platos de ducha, columnas de hidromasajes vertical, saunas y duchas escocesas en nuestro país, ofreciendo más de 200 artículos bajo la marca <strong className="text-white">Five Saint</strong>.
            </p>
            
            <p className="text-base font-light text-stone-200 leading-relaxed">
              Nuestra amplia gama de productos refleja nuestra dedicación a la calidad y la innovación, respaldando nuestra posición como líderes indiscutidos del bienestar en el mercado nacional.
            </p>
            
            <p className="text-sm font-semibold text-white uppercase tracking-widest border-l-4 border-[#087d9f] pl-3 py-1">
              Presencia y volumen de producción sólida en toda la República Argentina.
            </p>

            <div className="mt-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto uppercase tracking-wider font-bold rounded-full border-white text-white hover:bg-white hover:text-stone-900 transition-all duration-300 px-8 py-3 shadow-md"
                asChild
              >
                <Link href="/nosotros">Más Sobre Nosotros</Link>
              </Button>
            </div>
          </div>
        </div>

      </Container>
    </section>
  );
}

export default AboutPreviewSection;
