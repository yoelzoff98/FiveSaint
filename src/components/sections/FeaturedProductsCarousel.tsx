"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, ChevronLeft, ChevronRight, Waves } from "lucide-react";

interface FeaturedProductsCarouselProps {
  products: Product[];
}

export function FeaturedProductsCarousel({ products }: FeaturedProductsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScrollState = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 24 : 330;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, products.length - 1));
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollState();
    el.addEventListener("scroll", checkScrollState, { passive: true });
    window.addEventListener("resize", checkScrollState);

    return () => {
      el.removeEventListener("scroll", checkScrollState);
      window.removeEventListener("resize", checkScrollState);
    };
  }, [products]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollToIndex = (index: number) => {
    const el = scrollContainerRef.current;
    if (!el || !el.children[index]) return;

    const targetCard = el.children[index] as HTMLElement;
    el.scrollTo({
      left: targetCard.offsetLeft - el.offsetLeft,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full flex flex-col gap-6 group/carousel">
      {/* 1. Flecha Izquierda Flotante */}
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        aria-label="Anterior producto"
        className={`absolute left-0 sm:-left-5 top-[40%] -translate-y-1/2 z-30 h-12 w-12 rounded-full border border-stone-200 bg-white/95 text-stone-850 shadow-xl hover:bg-accent-deep hover:text-white hover:border-accent-deep hover:scale-110 disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center backdrop-blur-md cursor-pointer`}
      >
        <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
      </button>

      {/* 2. Flecha Derecha Flotante */}
      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        aria-label="Siguiente producto"
        className={`absolute right-0 sm:-right-5 top-[40%] -translate-y-1/2 z-30 h-12 w-12 rounded-full border border-stone-200 bg-white/95 text-stone-850 shadow-xl hover:bg-accent-deep hover:text-white hover:border-accent-deep hover:scale-110 disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center backdrop-blur-md cursor-pointer`}
      >
        <ChevronRight className="h-6 w-6 stroke-[2.5]" />
      </button>

      {/* 3. Track del Carrusel (Desplazamiento horizontal fluido) */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-1 no-scrollbar select-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product, idx) => {
          const isBanera =
            product.categorySlug === "baneras" ||
            product.categorySlug === "bañeras" ||
            product.categoryName?.toLowerCase().includes("bañera") ||
            product.categoryName?.toLowerCase().includes("banera");
          const isColumna =
            product.categorySlug === "columnas-de-ducha" ||
            product.categoryName?.toLowerCase().includes("columna");

          return (
            <div
              key={product.id}
              className="snap-start shrink-0 w-[280px] sm:w-[320px] md:w-[340px] lg:w-[350px]"
            >
              <Card
                hoverable
                className="flex flex-col justify-between h-full bg-white p-0 overflow-hidden border border-stone-200/70 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] rounded-[1.5rem] transition-all duration-500 group"
                padding="none"
              >
                {/* Contenedor Visual del Producto */}
                <div
                  className={`relative w-full ${
                    isColumna ? "h-72 aspect-[3/4]" : "h-52 sm:h-56"
                  } flex items-center justify-center border-b border-stone-100 overflow-hidden ${
                    isBanera
                      ? "bg-gradient-to-br from-[#71717a] via-[#8d8d97] to-[#52525b]"
                      : isColumna
                      ? "bg-gradient-to-b from-stone-100 via-stone-50 to-white"
                      : "bg-gradient-to-br from-stone-50 via-white to-accent-soft/20 group-hover:from-accent-soft/10 transition-colors"
                  }`}
                >
                  {product.image?.url ? (
                    <Image
                      src={product.image.url}
                      alt={product.image.alt || product.name}
                      fill
                      className={`transition-transform duration-500 group-hover:scale-105 ${
                        isBanera
                          ? "object-contain p-1 drop-shadow-[0_20px_25px_rgba(0,0,0,0.55)]"
                          : isColumna
                          ? "object-contain p-3 drop-shadow-md"
                          : "object-cover"
                      }`}
                    />
                  ) : (
                    <Waves className="h-10 w-10 text-accent-deep/30 opacity-70 group-hover:scale-110 group-hover:text-accent-deep/50 transition-all duration-300" />
                  )}

                  <div className="absolute top-4 left-4 flex gap-2 z-10">
                    <Badge
                      variant="outline"
                      className="text-[8.5px] uppercase tracking-widest font-bold bg-white/90 backdrop-blur-xs"
                    >
                      {product.categoryName}
                    </Badge>
                    {product.badge && (
                      <Badge
                        variant="primary"
                        className="text-[8.5px] uppercase tracking-widest font-bold shadow-sm"
                      >
                        {product.badge}
                      </Badge>
                    )}
                  </div>

                  <span className="absolute bottom-3 right-3 text-[9px] uppercase tracking-widest font-bold text-stone-300 z-10 drop-shadow-xs">
                    Five Saint
                  </span>
                </div>

                {/* Contenido del Producto */}
                <div className="p-6 flex flex-col justify-between flex-1 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900 group-hover:text-accent-deep transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-xs font-light text-stone-600 leading-relaxed line-clamp-3 min-h-[48px]">
                      {product.shortDescription || product.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100/80 flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-deep">
                      Garantía Escrita
                    </span>
                    <Link
                      href={product.href}
                      className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-stone-850 hover:text-accent-deep hover:underline transition-colors"
                    >
                      Ver detalles
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* 4. Paginación de Puntos Dots */}
      {products.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-2">
          {products.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToIndex(idx)}
              aria-label={`Ir al producto ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex
                  ? "w-8 bg-accent-deep"
                  : "w-2.5 bg-stone-300 hover:bg-stone-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FeaturedProductsCarousel;
