import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getPublicCatalogProducts as getProducts } from "@/lib/supabase/public-catalog-products";
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return [
    "/",
    "/productos",
    "/nosotros",
    "/contacto",
    ...products.map((p) => p.href),
  ].map((href) => ({
    url: new URL(href, siteConfig.url).toString(),
    changeFrequency: "weekly" as const,
    priority: href === "/" ? 1 : 0.7,
  }));
}
