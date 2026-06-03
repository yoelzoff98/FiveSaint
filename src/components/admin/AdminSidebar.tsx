"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, PlusSquare, ExternalLink, FolderTree, FolderPlus } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin-FiveSaint/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin-FiveSaint/productos", label: "Productos", icon: Package },
    { href: "/admin-FiveSaint/productos/nuevo", label: "Nuevo Producto", icon: PlusSquare },
    { href: "/admin-FiveSaint/categorias", label: "Categorías", icon: FolderTree },
    { href: "/admin-FiveSaint/categorias/nueva", label: "Nueva Categoría", icon: FolderPlus },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-300 min-h-screen border-r border-stone-800 shrink-0">
      <div className="p-6">
        <h2 className="text-white text-lg font-bold tracking-wider uppercase">Five Saint</h2>
        <span className="text-xs text-stone-500 uppercase tracking-widest">Admin Portal</span>
      </div>
      <nav className="flex-1 px-4 flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || 
            (pathname.startsWith(link.href) && link.href !== "/admin-FiveSaint/dashboard");
          
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
