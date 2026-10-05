import { ReactNode } from "react";

export const metadata = {
  title: "Portal Administración | Five Saint",
  description: "Gestión administrativa, presupuestos y órdenes de producción",
};

export default function AdministrationLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-accent-deep selection:text-white">
      {children}
    </div>
  );
}
