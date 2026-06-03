import { ProductImage } from "@/types/product";
import { Container } from "@/components/ui/Container";

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

/**
 * Galería de Imágenes de Producto (Sprint 9).
 * Muestra las imágenes adicionales de un producto. Si solo hay 1 imagen (o cero), 
 * no renderiza nada ya que la principal se muestra en el Hero.
 */
export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  if (!images || images.length <= 1) {
    return null;
  }

  // Filtrar la imagen de cover si se quiere, o simplemente mostrar todas las adicionales.
  // El usuario dice: "Si images.length > 1, mostrar sección Galería". 
  // No indicó explícitamente ocultar la del cover, pero por diseño suele ser mejor 
  // mostrar todas juntas en la grilla para que el usuario pueda verlas en contexto.

  return (
    <section className="bg-stone-50 py-16 sm:py-24 border-t border-stone-200/50">
      <Container className="flex flex-col gap-10">
        
        <div className="flex flex-col gap-3 text-center items-center">
          <h2 className="text-2xl font-light tracking-tight text-stone-900 sm:text-3xl uppercase">
            Galería
          </h2>
          <div className="w-12 h-[2px] bg-accent-deep rounded-full" />
        </div>

        {/* Grid Responsive: 1 en mobile, 2 en tablet, 3 en desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {images.map((image) => (
            <div 
              key={image.id}
              className="group relative aspect-square sm:aspect-[4/3] rounded-lg overflow-hidden bg-white shadow-sm border border-stone-200/50 transition-all duration-300 hover:shadow-md"
            >
              <img
                src={image.url}
                alt={image.alt || `${productName} - Galería`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Overlay sutil al hacer hover */}
              <div className="absolute inset-0 bg-accent-deep/0 group-hover:bg-accent-deep/5 transition-colors duration-300 pointer-events-none" />
            </div>
          ))}
        </div>

      </Container>
    </section>
  );
}
