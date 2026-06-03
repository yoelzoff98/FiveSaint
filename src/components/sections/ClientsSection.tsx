import { clients } from "@/data/clients";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Card } from "@/components/ui/Card";
import { Building2 } from "lucide-react";

/**
 * Sección de Clientes e Integraciones Corporativas (Sprint 3).
 * Muestra las tipologías de obras y desarrollos que eligen los productos de Five Saint,
 * distribuidos en una grilla sofisticada, monocromática y extremadamente sobria.
 */
export function ClientsSection() {
  return (
    <section className="py-20 lg:py-28 bg-[#fafcfd] border-b border-stone-200/50">
      <Container className="flex flex-col gap-12">
        
        {/* Título y Copete */}
        <SectionTitle
          eyebrow="Proyectos & Obras"
          title="Clientes y proyectos que confían en Five Saint"
          description="Acompañamos proyectos residenciales, hoteleros y comerciales con soluciones adaptadas a cada necesidad."
          align="center"
        />

        {/* Cuadrícula de Proyectos / Tipologías */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="bg-white border border-stone-100 p-6 flex items-start gap-5 hover:bg-white rounded-xl shadow-md hover:shadow-xl hover:border-accent-soft hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
            >
              {/* Borde lateral de color */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent-deep opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Ícono elegante */}
              <div className="rounded-lg bg-gradient-to-br from-accent-soft to-white text-accent-deep border border-stone-100 p-3 shrink-0 mt-0.5 shadow-sm group-hover:shadow-md transition-all duration-300">
                <Building2 className="h-6 w-6" aria-hidden="true" />
              </div>

              <div className="flex flex-col text-left gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#087d9f]">
                  {client.category}
                </span>
                <h3 className="text-lg font-bold text-stone-900 leading-tight group-hover:text-[#087d9f] transition-colors duration-300">
                  {client.name}
                </h3>
                <p className="text-sm font-light text-stone-500 leading-relaxed mt-1">
                  {client.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

      </Container>
    </section>
  );
}
export default ClientsSection;
