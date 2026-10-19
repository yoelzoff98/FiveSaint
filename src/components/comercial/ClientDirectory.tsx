"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";

export function ClientDirectory({ children }: { children: ReactNode }) {
  return (
    <section className="client-directory min-w-0 space-y-0 rounded-2xl border border-stone-200 bg-white shadow-sm">
      <style>{`
   .client-directory table{width:100%;min-width:1120px;border-collapse:collapse;text-align:left;font-size:13px}
   .client-directory thead tr{background:#f8fafb;color:#64748b;border-bottom:1px solid #e5ebee;font-size:11px;letter-spacing:.035em;font-weight:600}
   .client-directory th{padding:15px 20px;white-space:nowrap;font-weight:600}
   .client-directory tbody tr{border-bottom:1px solid #edf1f3;transition:background .15s}
   .client-directory tbody tr:last-child{border-bottom:0}
   .client-directory tbody tr:hover{background:#f7fbfb}
   .client-directory td{padding:16px 20px;vertical-align:middle}
   .client-directory td:last-child{white-space:nowrap}
   .client-directory .directory-search{flex-basis:100%;width:100%}
   @media(min-width:640px){.client-directory .directory-search{flex-basis:auto;width:auto}}
   @media(min-width:768px){.client-directory th:last-child,.client-directory tbody tr:not(:has(td[colspan])) td:last-child{position:sticky;right:0;box-shadow:-1px 0 0 #edf1f3}.client-directory th:last-child{background:#f8fafb}.client-directory td:last-child{background:white}.client-directory tbody tr:hover td:last-child{background:#f7fbfb}}
   .client-directory table a:focus-visible,.client-directory button:focus-visible,.client-directory select:focus-visible,.client-directory input:focus-visible{outline:2px solid #0e7490;outline-offset:3px}
   .client-directory .directory-filters select{border:1px solid #e2e8ea;border-radius:8px;background:white;color:#475569;padding:8px 10px;font-size:12px;min-height:36px;max-width:100%}
   .client-directory .directory-filters input{border:1px solid #e2e8ea;border-radius:8px;padding:8px 10px;font-size:12px}
  `}</style>
      {children}
    </section>
  );
}

type View = { value: string; label: string; count?: number };
export function ClientDirectoryHeader({
  count,
  subtitle,
  views,
  view,
  onView,
  search,
  onSearch,
  onSearchSubmit,
  sort,
  onSort,
  onCreate,
  filters,
  activeFilters,
  onClear,
  busy = false,
}: {
  count: number;
  subtitle: string;
  views: View[];
  view: string;
  onView: (value: string) => void;
  search: string;
  onSearch: (value: string) => void;
  onSearchSubmit: () => void;
  sort: string;
  onSort: (value: string) => void;
  onCreate: () => void;
  filters: ReactNode;
  activeFilters: number;
  onClear: () => void;
  busy?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const panelId = useId();
  return (
    <div className="px-5 pt-6 sm:px-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Clientes
            </h1>
            <span
              aria-live="polite"
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
            >
              {count}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-2 rounded-full bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-900"
        >
          <Plus className="h-4 w-4" />
          Agregar cliente
        </button>
      </div>
      <nav
        aria-label="Vistas de clientes"
        className="flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {views.map((item, index) => {
          const Icon =
            index === 0 ? Users : index === 1 ? UserCheck : UserRound;
          return (
            <button
              type="button"
              disabled={busy}
              key={item.value}
              aria-pressed={view === item.value}
              onClick={() => onView(item.value)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${view === item.value ? "border-teal-800 text-teal-900" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.count !== undefined && (
                <span className="rounded bg-slate-100 px-1.5 text-xs text-slate-500">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="flex flex-wrap items-center gap-2 py-4">
        <form
          className="directory-search flex min-w-0 flex-1 items-center gap-2 sm:max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit();
          }}
        >
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              aria-label="Buscar clientes"
              className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Buscar nombre, empresa o contacto…"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
            />
          </label>
          <button
            disabled={busy}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Buscar
          </button>
        </form>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((value) => !value)}
          className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm ${expanded ? "border-teal-200 bg-teal-50 text-teal-900" : "border-slate-300 text-slate-600"}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {activeFilters > 0 && (
            <span className="rounded-full bg-teal-800 px-1.5 text-xs text-white">
              {activeFilters}
            </span>
          )}
        </button>
        <label className="flex items-center gap-2 rounded-full border border-slate-300 px-3.5 py-2 text-slate-600">
          <ArrowDownUp className="h-3.5 w-3.5" />
          <select
            aria-label="Ordenar clientes"
            disabled={busy}
            value={sort}
            onChange={(event) => onSort(event.target.value)}
            className="max-w-44 bg-transparent text-sm outline-none"
          >
            <option value="newest">Más recientes</option>
            <option value="name">Nombre: A a Z</option>
            <option value="updated">Última actualización</option>
          </select>
        </label>
        {busy && (
          <span role="status" className="text-xs text-slate-400">
            Actualizando…
          </span>
        )}
      </div>
      {expanded && (
        <div
          id={panelId}
          className="directory-filters mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3"
        >
          {filters}
          {activeFilters > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={onClear}
              className="ml-auto flex items-center gap-1.5 px-2 py-2 text-xs font-medium text-slate-500 hover:text-teal-800"
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}
      <p className="mb-3 text-xs text-slate-400 md:hidden">
        Deslizá la tabla para ver todas las columnas.
      </p>
    </div>
  );
}

export function ClientIdentity({
  name,
  company,
  href,
}: {
  name: string;
  company?: string | null;
  href?: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const color = [
    "bg-teal-50 text-teal-700",
    "bg-indigo-50 text-indigo-600",
    "bg-amber-50 text-amber-700",
    "bg-sky-50 text-sky-700",
  ][name.charCodeAt(0) % 4 || 0];
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color}`}
      >
        {initials}
      </span>
      <div className="min-w-0">
        {href ? (
          <Link
            prefetch={false}
            href={href}
            className="font-semibold text-slate-800 hover:text-teal-800"
          >
            {name}
          </Link>
        ) : (
          <span className="font-semibold text-slate-800">{name}</span>
        )}
        <p
          className="mt-0.5 max-w-56 truncate text-xs text-slate-400"
          title={company || undefined}
        >
          {company || "Sin empresa registrada"}
        </p>
      </div>
    </div>
  );
}

export function ClientDate({ value }: { value?: string | null }) {
  if (!value || Number.isNaN(new Date(value).getTime()))
    return <span className="text-slate-300">—</span>;
  return (
    <span className="whitespace-nowrap text-xs text-slate-500">
      {new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(new Date(value))}
    </span>
  );
}
