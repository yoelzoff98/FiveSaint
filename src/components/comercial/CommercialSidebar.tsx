"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  PlusSquare, 
  ExternalLink, 
  DollarSign, 
  FileText, 
  ShoppingBag,
  UserCheck,
  Building2
} from "lucide-react";

interface CommercialSidebarProps {
  isAdmin: boolean;
}

export function CommercialSidebar({ isAdmin }: CommercialSidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/admin-comercial/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin-comercial/clientes", label: "Clientes", icon: Users },
    { href: "/admin-comercial/lista-de-precios", label: "Lista de Precios", icon: DollarSign },
    { href: "/admin-comercial/presupuestos", label: "Presupuestos", icon: FileText },
    { href: "/admin-comercial/pedidos", label: "Pedidos", icon: ShoppingBag },
  ];

  // Si es administrador, agregar la gestión de vendedores y distribuidores
  if (isAdmin) {
    links.push({ href: "/admin-comercial/vendedores", label: "Vendedores", icon: UserCheck });
    links.push({ href: "/admin-comercial/distribuidores", label: "Distribuidores", icon: Building2 });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-300 min-h-screen border-r border-stone-800 shrink-0">
      <div className="p-6">
        <h2 className="text-white text-lg font-bold tracking-wider uppercase">Five Saint</h2>
        <span className="text-xs text-stone-500 uppercase tracking-widest block mt-0.5">Seguimiento Comercial</span>
      </div>
      <nav className="flex-1 px-4 flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || 
            (pathname.startsWith(link.href) && link.href !== "/admin-comercial/dashboard");
          
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                isActive ? "bg-accent-deep text-white" : "hover:bg-stone-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 mt-auto">
        <Link 
          href="/" 
          target="_blank"
          className="flex items-center justify-center gap-2 text-sm text-stone-400 hover:text-white transition-colors py-4 border-t border-stone-800"
        >
          <ExternalLink className="w-4 h-4" />
          Ver sitio público
        </Link>
      </div>
    </aside>
  );
}
