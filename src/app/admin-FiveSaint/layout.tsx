import { ReactNode } from "react";

export const metadata = {
  title: "Admin Panel | Five Saint",
  description: "Portal privado administrativo",
};

/**
 * Layout exclusivo para las rutas de /admin-FiveSaint.
 * Desacopla la interfaz del Header y Footer públicos.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-accent-deep selection:text-white">
      {children}
    </div>
  );
}
