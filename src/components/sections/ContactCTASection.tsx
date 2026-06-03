import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, MessageSquare } from "lucide-react";

/**
 * Sección de Llamado a la Acción de Contacto Final (Sprint 3).
 * Rediseñada para incorporar un fondo abisal turquesa oscuro con resplandores duales,
 * botones interactivos y badges en oro corporativo para incentivar la conversión.
 */
export function ContactCTASection() {
  return (
    <section className="py-20 lg:py-32 bg-[#021116] text-white relative overflow-hidden">
      
      {/* Resplandores visuales premium de spa acuático */}
      <div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] rounded-full bg-[#087d9f]/20 filter blur-3xl opacity-70 -z-10 animate-pulse-slow" />
      <div className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-[#c5a880]/10 filter blur-3xl opacity-30 -z-10" />
      
      <Container className="relative z-10 flex flex-col items-center text-center gap-6">
        
        {/* Eyebrow de Asesoramiento en Oro */}
        <Badge 
          variant="primary" 
          className="mb-2 bg-[#c5a880] hover:bg-[#b19369] text-white border-none uppercase tracking-widest text-[9px] font-bold px-3.5 py-1.5 shadow-sm"
        >
          ¿Tenés un proyecto?
        </Badge>
        
        {/* Título Principal */}
        <h2 className="text-3xl font-light tracking-tight sm:text-4xl lg:text-5xl max-w-3xl leading-tight text-white">
          Te ayudamos a elegir la{" "}
          <span className="font-semibold text-white relative inline-block">
            solución adecuada
            <span className="absolute bottom-1.5 left-0 w-full h-[5px] bg-[#087d9f]/50 -z-10 rounded-full" />
          </span>
        </h2>
        
        {/* Descripción comercial */}
        <p className="max-w-xl text-sm sm:text-base font-light text-stone-400 leading-relaxed">
          Contactanos para recibir asesoramiento sobre productos, medidas, líneas disponibles y opciones a medida para tu espacio particular o comercial.
        </p>

        {/* Acciones principales */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto uppercase tracking-wider font-bold group cursor-pointer bg-white text-[#021116] hover:bg-[#087d9f] hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shrink-0 shadow-lg"
            asChild
          >
            <Link href="/contacto" className="flex items-center justify-center gap-2">
              Solicitar asesoramiento
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto uppercase tracking-wider font-semibold cursor-pointer text-stone-300 hover:text-white hover:bg-white/5 border border-stone-800 hover:border-[#087d9f]/40 transition-all duration-300"
            asChild
          >
            <Link href="/productos">Ver productos</Link>
          </Button>
        </div>

        {/* Información de soporte adicional */}
        <div className="mt-8 flex items-center gap-2 text-stone-500 text-xs font-light">
          <MessageSquare className="h-4 w-4 text-[#9de6f2] shrink-0" />
          <span>Atención personalizada de Lunes a Viernes de 9 a 18 hs</span>
        </div>

      </Container>
    </section>
  );
}

export default ContactCTASection;
