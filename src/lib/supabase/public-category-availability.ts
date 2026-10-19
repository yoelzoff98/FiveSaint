import { cache } from "react";
import { getProducts } from "./products";
export const getAvailablePublicCategorySlugs = cache(async () => {
  const products = await getProducts();
  return [
    ...new Set(
      products
        .map((product) => product.categorySlug)
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ];
});
