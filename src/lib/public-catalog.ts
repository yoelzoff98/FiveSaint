import type { Product } from "@/types/product";
export function normalizeCatalogText(value: string): string {
  return value
    .replace(/\bDesing\b/gi, "Design")
    .replace(/distribuídos/gi, "distribuidos")
    .replace(/Capacidad\s+6,\s*7\s+personas/gi, "Capacidad 6 a 7 personas")
    .replace(
      /(\d+(?:[.,]\d+)?)\s*(?:cm)?\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*(?:cm)?\s*[x×]\s*(\d+(?:[.,]\d+)?))?\s*(?:cm)?/gi,
      (match, a, b, c, offset, full) => {
        // Do not turn equipment counts or electrical powers into dimensions.
        const isDimension =
          /cm/i.test(match) ||
          full.trim() === match.trim() ||
          /(?:medidas|amplitud|dimensiones)[:\s]*$/i.test(
            full.slice(0, offset),
          );
        return isDimension ? `${a} x ${b}${c ? ` x ${c}` : ""} cm` : match;
      },
    );
}
export function catalogSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
export function filterPublicProducts(
  products: Product[],
  category: string,
  query: string,
): Product[] {
  const terms = catalogSearchText(query).split(/\s+/).filter(Boolean);
  return products.filter(
    (product) =>
      (category === "all" ||
        product.categorySlug === category ||
        product.categoryId === category) &&
      terms.every((term) =>
        catalogSearchText(
          [
            product.name,
            product.categoryName,
            product.shortDescription,
            ...product.features,
            ...(product.variants ?? []).map((v) => v.name),
          ].join(" "),
        ).includes(term),
      ),
  );
}
export function productImageAlt(
  alt: string | undefined,
  name: string,
  index: number,
): string {
  if (
    !alt ||
    /\.(png|jpe?g|webp|avif|gif)\b|gemini_generated|^img[_ -]?\d|^image[_ -]?\d/i.test(
      alt,
    )
  )
    return `${name} Five Saint${index ? ` — Vista ${index + 1}` : ""}`;
  return normalizeCatalogText(alt);
}
