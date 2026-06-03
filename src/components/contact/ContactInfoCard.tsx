import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MapPin, Mail, Phone, Clock, ArrowRight, Info } from "lucide-react";

/**
 * Tarjeta lateral de Información Institucional (ContactInfoCard - Sprint 7).
 * Presenta datos de contacto oficiales utilizando iconos vectoriales sobrios,
 * incluye un bloque de atención técnica e importantes recomendaciones y un enlace CTA al catálogo general.
 */
export function ContactInfoCard() {
  const contactDetails = [
    {
      icon: MapPin,
      label: "Ubicación",
      value: siteConfig.contact.location
    },
    {
      icon: Mail,
      label: "Email Comercial",
      value: siteConfig.contact.email,
      href: `mailto:${siteConfig.contact.email}`
    },
    {
      icon: Phone,
      label: "Teléfono / WhatsApp",
      value: siteConfig.contact.phone
    },
    {
      icon: Clock,
      label: "Horario de Atención",
      value: siteConfig.contact.workingHours // Usamos workingHours o businessHours (son compatibles)
    }
  ];

  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-24">
      {/* 1. Card de Contacto Principal */}
      <Card className="bg-white border-stone-200 shadow-xs p-6 sm:p-8 flex flex-col gap-6 text-left">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-stone-900 tracking-tight">
            Información de contacto
          </h3>
          <p className="text-xs sm:text-sm font-light text-stone-500 leading-relaxed">
            También podés comunicarte directamente con nuestro equipo técnico para recibir asesoramiento personalizado sobre cada línea de productos.
          </p>
        </div>

        {/* Listado de Datos Estructurados */}
        <div className="flex flex-col gap-4 pt-4 border-t border-stone-100">
          {contactDetails.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="rounded-full bg-stone-50 p-2 text-accent-deep shrink-0 border border-stone-100">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {item.label}
                  </span>
                  {item.href ? (
                    <a 
                      href={item.href} 
                      className="text-sm font-medium text-stone-900 hover:text-accent-deep hover:underline transition-colors break-all"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-stone-900">
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. Bloque de Aviso / Importante */}
      <Card 
        className="bg-accent-soft/30 border-accent-soft/50 p-6 flex flex-col gap-3 text-left relative overflow-hidden"
        padding="none"
      >
        <div className="flex items-center gap-3 text-accent-deep">
          <Info className="h-5 w-5 shrink-0" aria-hidden="true" />
          <h4 className="text-xs font-bold uppercase tracking-widest">
            Importante
          </h4>
        </div>
        <p className="text-xs font-light text-stone-600 leading-relaxed">
          Las medidas, terminaciones y disponibilidad de los productos pueden variar según la línea de fabricación nacional. Recomendamos realizar una consulta técnica para recibir información y especificaciones actualizadas.
        </p>
      </Card>

      {/* 3. Botón de Catálogo Rápido */}
      <Button
        variant="outline"
        size="lg"
        className="w-full uppercase tracking-wider font-semibold group cursor-pointer"
        asChild
      >
        <Link href="/productos" className="flex items-center justify-center gap-2">
          Ver catálogo completo
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </Button>
    </div>
  );
}

export default ContactInfoCard;
