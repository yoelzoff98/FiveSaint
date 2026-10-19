import { saunaData } from "@/config/price-list-data";
import type { Product, ProductCategory } from "@/types/product";
import { productCategories } from "@/config/product-categories";
// Public presentation of the existing price-list entry, not a database product or manufacturing recipe.
export const saunaPublicProduct: Product = {
  id: "price-list:sauna",
  name: saunaData.title,
  slug: "sauna",
  href: "/productos/sauna",
  categoryId: "sauna",
  categoryName: "Sauna",
  categorySlug: "sauna",
  shortDescription:
    "Saunas a medida para 3 a 4, 5 a 6 y 6 a 7 personas. Cotización a pedido.",
  description: saunaData.note,
  features: [
    "Fabricación a medida",
    "Cabina y revestimiento interior",
    "Cotización a pedido",
    ...saunaData.models.map(
      (model) =>
        `${model.capacidad} · Cabina ${model.cabinaCode} · Revestimiento ${model.revestimientoCode}`,
    ),
  ],
  technicalNotes: [
    saunaData.note,
    ...saunaData.opcionales.map(
      (optional) => `Opcional ${optional.code}: ${optional.name}`,
    ),
    saunaData.contact,
  ],
  image: {
    id: "price-list:sauna-cover",
    url: saunaData.images[3],
    alt: "Cabina de sauna de la lista Five Saint",
    sortOrder: 0,
    isCover: true,
  },
  images: saunaData.images.map((url, index) => ({
    id: `price-list:sauna-photo-${index + 1}`,
    url,
    alt: `Sauna Five Saint — Fotografía ${index + 1} de la lista`,
    sortOrder: index,
    isCover: index === 3,
  })),
  variants: saunaData.models.map((model, index) => ({
    id: `price-list:${model.cabinaCode}`,
    productId: "price-list:sauna",
    name: `Sauna ${model.capacidad}`,
    slug: `sauna-${index + 1}`,
    capacityLabel: model.capacidad,
    features: [
      `Consumo: ${model.consumo}`,
      ...model.linea,
      `Cabina: ${model.cabinaCode}`,
      `Revestimiento interior: ${model.revestimientoCode}`,
    ],
    equipment: [],
    technicalNotes: [saunaData.note],
    isActive: true,
    isDefault: false,
    sortOrder: index,
  })),
};
export function withPriceListSauna(products: Product[]): Product[] {
  return products.some((product) => product.slug === "sauna")
    ? products
    : [...products, saunaPublicProduct];
}
export function withSaunaCategory(
  categories: ProductCategory[],
): ProductCategory[] {
  const category = productCategories.find((c) => c.slug === "sauna")!;
  return categories.some((c) => c.slug === "sauna")
    ? categories
    : [...categories, category];
}
