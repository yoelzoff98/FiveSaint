import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Cabecera institucional global (sticky & translúcido) */}
      <Header />
      
      {/* Cuerpo principal que se extiende al 100% de la altura disponible */}
      <main className="flex-1 flex flex-col w-full bg-white">
        {children}
      </main>
      
      {/* Pie de página institucional */}
      <Footer />

      {/* Botón Flotante de Consultas */}
      <WhatsAppButton />
    </>
  );
}
