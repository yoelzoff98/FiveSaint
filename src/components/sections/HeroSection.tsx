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
    <section className="relative isolate overflow-hidden min-h-[calc(100vh-90px)] flex flex-col justify-center py-10 lg:py-12 border-b border-stone-800 text-white">
      
      {/* Imagen de fondo real (Wellness / Jacuzzi) */}
      <div className="absolute inset-0 -z-20 w-full h-full">
        <Image
          src="/images/hero_bg_new.jpg"
          alt="Bañera de hidromasaje de lujo Five Saint"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-x-[-1]"
        />
      </div>

      {/* Capa de superposición para legibilidad (Spa Oscuro) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#01161d] via-[#01161d]/80 to-transparent" />
      
      {/* Resplandores visuales de luz */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#087d9f]/10 filter blur-3xl opacity-40 -z-10 animate-pulse-slow pointer-events-none" />

      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 my-auto w-full">
        
        {/* Columna Izquierda: Información de Marca y CTAs */}
        <div className="lg:col-span-6 flex flex-col gap-4 lg:gap-5 text-left items-start">
          
          <h1 className="text-4xl font-extralight tracking-tight text-white sm:text-5xl lg:text-5xl leading-tight max-w-xl">
            Diseño, confort e innovación <br className="hidden lg:block" />
            para{" "}
            <span className="font-bold text-[#9de6f2] underline decoration-[#087d9f]/50 decoration-[4px] sm:decoration-[6px] underline-offset-4 sm:underline-offset-8">
              espacios de bienestar
            </span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl font-light text-stone-300 leading-relaxed max-w-lg">
            Fabricamos hidromasajes, spas y equipamiento premium. Transformamos tu baño con calidad industrial y diseño de vanguardia.
          </p>

          {/* Acciones principales - Botón "¡Contactanos!" estilo pill */}
          <div className="mt-1 flex flex-wrap gap-4 w-full sm:w-auto">
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
          <div className="mt-4 pt-4 lg:mt-6 lg:pt-6 border-t border-white/10 grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-2xl">
            <div className="flex flex-col gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                +30
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Años
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
      </Container>

      {/* Ola decorativa inferior para transicionar fluidamente */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 translate-y-px pointer-events-none">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[30px] lg:h-[40px] text-white fill-current">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.3,90.54,26.83,161.76,45,248.8,69.91,321.39,56.44Z" className="fill-[#087d9f]" />
        </svg>
      </div>

    </section>
  );
}

export default HeroSection;
