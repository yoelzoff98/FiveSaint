import { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import ProductCard from "./ProductCard";

interface RelatedProductsProps {
  products: Product[];
}

/**
 * Sección de Productos Relacionados (RelatedProducts - Sprint 5/8).
 * Renderiza productos sugeridos pasados por props.
 * Si no existen productos sugeridos, auto-oculta la sección de forma elegante.
 */
export function RelatedProducts({ products }: RelatedProductsProps) {
  // Si no hay productos relacionados, no renderizamos nada
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 lg:py-28 bg-stone-50/20 border-t border-b border-stone-200/50">
      <Container className="flex flex-col gap-12">
        
        {/* Título de la Sección de Sugeridos */}
        <SectionTitle
          eyebrow="Más Opciones"
          title="Productos relacionados"
          description="Otras alternativas de la misma línea o soluciones complementarias para tu proyecto."
          align="left"
          className="max-w-2xl text-left"
        />

        {/* Cuadrícula de Productos Reutilizando el ProductCard del Sprint 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>

      </Container>
    </section>
  );
}
export default RelatedProducts;
