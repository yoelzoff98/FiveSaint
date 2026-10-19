export function CatalogSearchForm({
  query = "",
  category,
}: {
  query?: string;
  category?: string;
}) {
  return (
    <form action="/productos" role="search" className="flex flex-wrap gap-3">
      <label htmlFor="catalog-search" className="sr-only">
        Buscar productos en el catálogo
      </label>
      <input
        id="catalog-search"
        name="q"
        type="search"
        maxLength={120}
        defaultValue={query}
        placeholder="Buscar por producto, modelo o característica…"
        className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm"
      />
      {category && category !== "all" && (
        <input type="hidden" name="categoria" value={category} />
      )}
      <button
        type="submit"
        className="min-h-11 rounded-lg bg-accent-deep px-5 py-3 text-sm font-semibold text-white"
      >
        Buscar
      </button>
    </form>
  );
}
