"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Receipt,
  FileMinus,
  Download,
  Users,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  User,
  LogOut,
  BookOpen,
} from "lucide-react";
import { accountingLogout } from "@/lib/supabase/accounting";
const links = [
  { href: "/contable", label: "Resumen contable", icon: LayoutDashboard },
  { href: "/contable/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/contable/pedidos", label: "Pedidos", icon: ShoppingBag },
  {
    href: "/contable/comprobantes",
    label: "Facturas y comprobantes",
    icon: Receipt,
  },
  {
    href: "/contable/notas",
    label: "Notas de crédito / débito",
    icon: FileMinus,
  },
  { href: "/contable/exportaciones", label: "Exportaciones", icon: Download },
];
export function AccountingNavigation({
  name,
  canManage,
  internal,
}: {
  name?: string;
  canManage: boolean;
  internal: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open) {
      el.showModal();
      closeButton.current?.focus();
    } else if (el.open) {
      el.close();
      trigger.current?.focus();
    }
  }, [open]);
  const active = (href: string) =>
    href === "/contable"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");
  const navigation = (
    <>
      <div className="p-6 border-b border-stone-800/80">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-deep" />
          <span className="text-white text-lg font-bold tracking-wider uppercase">
            Five Saint
          </span>
        </div>
        <span className="text-[11px] font-semibold text-accent-gold uppercase tracking-widest">
          Portal Contable
        </span>
      </div>
      <nav
        aria-label="Navegación contable"
        className="flex-1 px-4 py-5 space-y-1.5"
      >
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
          Gestión contable
        </p>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              prefetch={false}
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={active(link.href) ? "page" : undefined}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-colors ${active(link.href) ? "bg-accent-deep text-white shadow-sm" : "text-stone-400 hover:bg-stone-800 hover:text-white"}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
        {canManage && (
          <div className="mt-5 border-t border-stone-800 pt-4">
            <Link
              prefetch={false}
              href="/contable/usuarios"
              onClick={() => setOpen(false)}
              aria-current={active("/contable/usuarios") ? "page" : undefined}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm ${active("/contable/usuarios") ? "bg-accent-deep text-white" : "text-stone-400 hover:bg-stone-800 hover:text-white"}`}
            >
              <Users className="w-4 h-4" />
              Accesos contables
            </Link>
          </div>
        )}
        {internal && (
          <Link
            prefetch={false}
            href="/administracion"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3.5 py-3 text-xs text-stone-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Administración
          </Link>
        )}
      </nav>
      <div className="p-5 border-t border-stone-800 text-xs text-stone-500 flex gap-2">
        <BookOpen className="w-4 h-4 shrink-0" />
        <span>
          Consulta de documentación vinculada a comprobantes fiscales.
        </span>
      </div>
    </>
  );
  return (
    <>
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 z-40 bg-stone-900 text-stone-300 flex-col overflow-y-auto">
        {navigation}
      </aside>
      <dialog
        ref={dialog}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        aria-label="Menú del Portal Contable"
        className="fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-72 max-w-[90vw] bg-stone-900 text-stone-300 p-0 border-0 backdrop:bg-black/50"
      >
        <div className="flex flex-col min-h-full">
          <button
            ref={closeButton}
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-4 p-2 rounded text-stone-300 hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
          {navigation}
        </div>
      </dialog>
      <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs md:ml-64">
        <div className="flex items-center gap-3 min-w-0">
          <button
            ref={trigger}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú contable"
            aria-expanded={open}
            className="md:hidden p-2 rounded border border-stone-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 hidden lg:inline">
            Five Saint
          </span>
          <span className="text-stone-300 hidden lg:inline">/</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-deep/30 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-accent-deep">
            <ShieldCheck className="w-3.5 h-3.5" />
            {canManage
              ? "ADMIN Central"
              : internal
                ? "Administración"
                : "Contabilidad"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600">
              <User className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-stone-800 hidden lg:inline">
              {name}
            </span>
          </div>
          <form action={accountingLogout}>
            <button
              className="inline-flex items-center gap-1.5 border border-stone-200 rounded-lg p-2 text-xs text-stone-600 hover:bg-red-50 hover:text-red-700"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </form>
        </div>
      </header>
    </>
  );
}
