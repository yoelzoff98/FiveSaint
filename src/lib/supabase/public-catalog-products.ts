import { getProducts } from "./products";
import { withPriceListSauna } from "@/config/sauna-public-catalog";
// Public website only. Commercial IDs, price calculations and issued documents keep their existing sources.
export async function getPublicCatalogProducts() {
  return withPriceListSauna(await getProducts());
}
