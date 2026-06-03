import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, Sparkles, Shield, Compass } from "lucide-react";

/**
 * Sección Hero de Impacto Visual (Sprint 3).
 * Rediseñada para incorporar un fondo de fotografía real de hidromasaje (hero_bg.png),
 * superposición oscura de alto contraste, textos en blanco nítido,
 * y el botón principal de contacto estilizado como "¡Contactanos!" tipo pill.
 */
export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden min-h-[550px] lg:min-h-[650px] flex items-center py-20 lg:py-32 border-b border-stone-800 text-white">
      
      {/* Imagen de fondo real (Wellness / Jacuzzi) */}
      <div className="absolute inset-0 -z-20 w-full h-full">
        <Image
          src="/images/hero_bg.png"
          alt="Bañera de hidromasaje de lujo Five Saint"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Capa de superposición para legibilidad (Spa Oscuro) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#01161d]/90 via-[#01161d]/75 to-black/30" />
      
      {/* Resplandores visuales de luz */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#087d9f]/20 filter blur-3xl opacity-50 -z-10 animate-pulse-slow" />

      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* Columna Izquierda: Información de Marca y CTAs */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left items-start">
          <Badge 
            variant="outline" 
            className="uppercase tracking-widest text-[9px] font-bold px-3.5 py-1.5 bg-[#087d9f]/20 border-[#c5a880] text-[#e3c498] shadow-xs"
          >
            30 años de experiencia | Calidad Industrial
          </Badge>
          
          <h1 className="text-4xl font-extralight tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight max-w-2xl">
            Diseño, confort e innovación para{" "}
            <span className="font-bold text-[#9de6f2] relative inline-block">
              espacios de baño y bienestar
              <span className="absolute bottom-1.5 left-0 w-full h-[6px] bg-[#087d9f]/30 -z-10 rounded-full" />
            </span>
          </h1>
          
          <p className="text-base sm:text-lg font-light text-stone-300 leading-relaxed max-w-xl">
            Fabricamos bañeras, hidromasajes, spas, platos de ducha, columnas, saunas y duchas escocesas con foco en calidad, funcionalidad y diseño.
          </p>

          {/* Acciones principales - Botón "¡Contactanos!" estilo pill */}
          <div className="mt-4 flex flex-wrap gap-4 w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto uppercase tracking-wider font-bold rounded-full bg-[#087d9f] hover:bg-[#055f79] text-white border-none group cursor-pointer shadow-lg px-8"
              asChild
            >
              <Link href="/contacto" className="flex items-center justify-center gap-2">
                ¡Contactanos!
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto uppercase tracking-wider font-semibold rounded-full border-white/40 hover:border-white hover:bg-white/10 text-white transition-all duration-300 bg-white/5 backdrop-blur-xs px-8"
              asChild
            >
              <Link href="/productos">Ver productos</Link>
            </Button>
          </div>

          {/* Estadísticas de Confianza */}
          <div className="mt-10 pt-10 border-t border-white/10 grid grid-cols-3 gap-6 sm:gap-12 w-full">
            <div className="flex flex-col gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                +30
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Años en el mercado
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                +200
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Artículos
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#e3c498] leading-none">
                100%
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Industria Nacional
              </span>
            </div>
          </div>
        </div>
 
        {/* Columna Derecha: Showcase Visual Premium Flotante con Glassmorphism */}
        <div className="lg:col-span-5 relative w-full h-[320px] sm:h-[400px] lg:h-[420px] rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-white/5 backdrop-blur-md flex items-center justify-center animate-float-slow">
          
          {/* Círculo decorativo difuso en el interior */}
          <div className="absolute top-1/4 left-1/4 w-56 h-56 rounded-full bg-[#087d9f]/20 filter blur-3xl -z-10" />
          
          {/* Ilustración de Grilla Arquitectónica y Platos Abstractos */}
          <div className="relative w-4/5 h-4/5 flex flex-col justify-between p-6">
            
            {/* Tarjeta Flotante 1: Hidromasaje Concept */}
            <div className="self-start bg-[#01161d]/85 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-lg w-4/5 flex items-center gap-3.5 transform -rotate-1 hover:rotate-0 transition-all duration-300 hover:scale-[1.02]">
              <div className="bg-[#087d9f] text-white p-2.5 rounded-lg shrink-0 shadow-xs">
                <Sparkles className="h-4.5 w-4.5 text-[#9de6f2]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-widest font-bold text-[#9de6f2]">
                  Línea Hidro
                </span>
                <span className="text-sm font-semibold text-white">
                  Premium Jet System
                </span>
              </div>
            </div>

            {/* Bloque Central de Grilla/Materiales */}
            <div className="w-full flex items-center justify-center my-4 opacity-75">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#087d9f]/40 to-transparent relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#01161d] px-3 py-1 rounded-full border border-white/10 text-[8px] uppercase tracking-widest text-[#9de6f2] font-bold">
                  Acrílico Sanitario
                </div>
              </div>
            </div>

            {/* Tarjeta Flotante 2: Calidad Certificada */}
            <div className="self-end bg-white/95 text-stone-900 rounded-xl p-4 shadow-xl w-4/5 flex items-center gap-3.5 border border-white/50 transform rotate-1 hover:rotate-0 transition-all duration-300 hover:scale-[1.02]">
              <div className="bg-[#087d9f]/10 text-[#087d9f] p-2.5 rounded-lg shrink-0 shadow-sm">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-widest font-bold text-[#087d9f]">
                  Calidad Certificada
                </span>
                <span className="text-sm font-bold text-stone-900">
                  Garantía Escrita
                </span>
              </div>
            </div>
            
          </div>
          
          {/* Micro-insignia flotante de Bienestar */}
          <div className="absolute bottom-4 left-4 bg-[#01161d]/85 border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <Compass className="h-3.5 w-3.5 text-[#9de6f2] animate-spin-slow" />
            <span className="text-[9px] uppercase tracking-widest font-bold text-stone-300">
              Wellness Design
            </span>
          </div>
        </div>

      </Container>

      {/* Ola decorativa inferior para transicionar fluidamente */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 translate-y-px pointer-events-none">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] text-white fill-current">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.3,90.54,26.83,161.76,45,248.8,69.91,321.39,56.44Z" className="fill-[#087d9f]" />
        </svg>
      </div>

    </section>
  );
}

export default HeroSection;
