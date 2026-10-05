"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  ShoppingBag,
  Receipt,
  Users,
  ExternalLink,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";

interface AdministrationSidebarProps {
  isAdmin?: boolean;
}

export function AdministrationSidebar({ isAdmin = false }: AdministrationSidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/administracion", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/administracion/pedidos", label: "Gestión de Pedidos", icon: ShoppingBag },
    { href: "/administracion/presupuestos", label: "Presupuestos", icon: FileText },
    { href: "/administracion/presupuestos/nuevo", label: "Nuevo Presupuesto", icon: FilePlus },
    { href: "/administracion/facturacion", label: "Facturación", icon: Receipt, badge: "Próximamente" },
  ];

  if (isAdmin) {
    links.push({
      href: "/administracion/usuarios",
      label: "Usuarios Administración",
      icon: Users
    });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-300 min-h-screen border-r border-stone-800 shrink-0">
      <div className="p-6 border-b border-stone-800/80">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-deep animate-pulse" />
          <h2 className="text-white text-lg font-bold tracking-wider uppercase">Five Saint</h2>
        </div>
        <span className="text-[11px] font-semibold text-accent-gold uppercase tracking-widest block">
          Portal Administración
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 flex flex-col gap-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(link.href + "/");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-accent-deep text-white shadow-sm"
                  : "hover:bg-stone-800/80 text-stone-400 hover:text-stone-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-stone-400"}`} />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-stone-800">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider px-3 mb-2 block">
              Accesos de Superadmin
            </span>
            <Link
              href="/admin-FiveSaint/dashboard"
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-accent-gold" />
              Panel Catálogo & Config
            </Link>
            <Link
              href="/admin-comercial/dashboard"
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs text-stone-400 hover:text-white hover:bg-stone-800/60 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Portal Comercial
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 mt-auto border-t border-stone-800/80">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center gap-2 text-xs text-stone-400 hover:text-white transition-colors py-2"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver Sitio Web
        </Link>
      </div>
    </aside>
  );
}
