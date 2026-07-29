import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { footerNavigation } from "@/config/navigation";
import { Container } from "@/components/ui/Container";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

/**
 * Pie de página institucional (Footer - Sprint 2).
 * Presenta un diseño oscuro sumamente elegante, con enlaces clasificados a nivel de grilla,
 * datos de contacto corporativo placeholders y derechos de autor actualizados automáticamente.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#021116] text-stone-300 border-t border-[#04242e] pt-16 pb-8">
      <Container className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Columna 1: Branding y Trayectoria */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-4 w-fit block group">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 overflow-hidden rounded-lg shadow-md border border-stone-800 bg-[#007299] shrink-0 group-hover:scale-105 transition-all duration-300">
                <Image
                  src="/LOGO.svg"
                  alt="Five Saint Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-sans text-base font-bold uppercase tracking-[0.2em] text-white group-hover:text-accent-soft transition-colors leading-tight">
                  {siteConfig.name}
                </span>
                <span className="block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#9de6f2] mt-0.5 leading-none">
                  Equipamientos para Spa
                </span>
              </div>
            </div>
          </Link>
          <p className="text-sm font-light text-stone-400 leading-relaxed mt-2">
            {siteConfig.description}
          </p>
          
          {/* Redes Sociales */}
          <div className="mt-4 flex items-center gap-3">
            <a
              href={siteConfig.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-stone-900 p-2 text-stone-400 hover:bg-accent-deep hover:text-white transition-colors"
              aria-label="Instagram de Five Saint"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a
              href={siteConfig.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-stone-900 p-2 text-stone-400 hover:bg-accent-deep hover:text-white transition-colors"
              aria-label="Facebook de Five Saint"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0 -5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a
              href={siteConfig.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-stone-900 p-2 text-stone-400 hover:bg-accent-deep hover:text-white transition-colors"
              aria-label="LinkedIn de Five Saint"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>
        </div>

        {/* Columna 2: Categorías de productos */}
        <div>
          <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-white border-b border-stone-850 pb-2">
            Nuestros Productos
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {footerNavigation.categories.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="text-sm font-light text-stone-400 hover:text-white transition-colors"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3: Empresa y Menú */}
        <div>
          <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-white border-b border-stone-850 pb-2">
            Compañía
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {footerNavigation.company.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="text-sm font-light text-stone-400 hover:text-white transition-colors"
                >
                  {item.title}
                </Link>
              </li>
            ))}
            {footerNavigation.legal.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="text-xs font-light text-stone-500 hover:text-stone-300 transition-colors"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 4: Datos de Contacto placeholder */}
        <div className="flex flex-col gap-4">
          <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-white border-b border-stone-850 pb-2">
            Contacto
          </h3>
          <ul className="mt-4 flex flex-col gap-3.5 text-sm font-light text-stone-400">
            <li className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-accent-soft shrink-0 mt-0.5" aria-hidden="true" />
              <span>{siteConfig.location}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-accent-soft shrink-0" aria-hidden="true" />
              <a href={`tel:${siteConfig.contact.phone}`} className="hover:underline hover:text-white">
                {siteConfig.contact.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-accent-soft shrink-0" aria-hidden="true" />
              <a href="mailto:info@fivesaint.com" className="hover:underline hover:text-white">
                info@fivesaint.com
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-accent-soft shrink-0 mt-0.5" aria-hidden="true" />
              <span>{siteConfig.contact.workingHours}</span>
            </li>
          </ul>
        </div>
      </Container>

      {/* Derechos de Autor Dinámicos */}
      <Container className="mt-16 pt-8 border-t border-[#04242e] text-center flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-light text-stone-500">
        <p>
          &copy; {currentYear} {siteConfig.name}. Todos los derechos reservados.
        </p>
        <p className="tracking-wide">
          Fabricando bienestar y confort en Argentina desde {siteConfig.foundedYear}.
        </p>
      </Container>
    </footer>
  );
}
