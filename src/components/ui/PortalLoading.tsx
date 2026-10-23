export function PortalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando pantalla"
      className="p-6 space-y-5 max-w-7xl mx-auto"
    >
      <p className="text-sm text-stone-600">Cargando…</p>
      <div
        aria-hidden="true"
        className="animate-pulse motion-reduce:animate-none space-y-5"
      >
        <div className="h-8 w-52 rounded bg-stone-200" />
        <div className="h-12 rounded bg-stone-200" />
        <div className="h-64 rounded-xl border border-stone-200 bg-white" />
      </div>
    </div>
  );
}
