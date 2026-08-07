import { ReactNode } from "react";

export const metadata = {
  title: "Seguimiento Comercial | Five Saint",
  description: "Portal de seguimiento comercial y ventas",
};

export default function CommercialLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-accent-deep selection:text-white">
      {children}
    </div>
  );
}
