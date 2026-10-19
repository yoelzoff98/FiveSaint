import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ReactNode } from "react";

export const revalidate = 3600;
export const metadata: Metadata = {
  robots: { index: true, follow: true },
  openGraph: {
    title: "Five Saint — Hidromasajes, spas y bañeras",
    description: siteConfig.description,
    type: "website",
    locale: "es_AR",
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "Five Saint — Fabricación nacional",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: [siteConfig.ogImage] },
};
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-site min-h-screen flex flex-col">
      {/* Cabecera institucional global (sticky & translúcido) */}
      <Header />

      {/* Cuerpo principal que se extiende al 100% de la altura disponible */}
      <main className="flex-1 flex flex-col w-full bg-white">{children}</main>

      {/* Pie de página institucional */}
      <Footer />

      {/* Botón Flotante de Consultas */}
      <WhatsAppButton />
    </div>
  );
}
