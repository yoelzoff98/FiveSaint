import { Container } from "@/components/ui/Container";
import ContactForm from "./ContactForm";
import ContactInfoCard from "./ContactInfoCard";

/**
 * Contenido Central de la Página de Contacto (ContactPageContent - Sprint 7).
 * Orquesta un diseño en grilla responsiva:
 * - Columna principal (izquierda en desktop): El formulario interactivo validado.
 * - Columna lateral (derecha en desktop): Tarjeta con coordenadas de contacto e información técnica.
 */
export function ContactPageContent() {
  return (
    <section className="py-16 sm:py-24 bg-stone-50/50">
      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Columna Principal: Formulario */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          <ContactForm />
        </div>

        {/* Columna Lateral: Tarjeta informativa */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          <ContactInfoCard />
        </div>

      </Container>
    </section>
  );
}

export default ContactPageContent;
