import { z } from "zod";

export const ClientCategorySchema = z.enum(["consumidor_final", "arquitecto", "distribuidor", "constructor"]);
export type ClientCategory = z.infer<typeof ClientCategorySchema>;
export const CLIENT_CATEGORIES = [
  { value: "consumidor_final", label: "Consumidor Final" },
  { value: "arquitecto", label: "Arquitecto" },
  { value: "distribuidor", label: "Distribuidor" },
  { value: "constructor", label: "Constructor" },
] as const;
export function clientCategoryLabel(category?: string | null) {
  return CLIENT_CATEGORIES.find(item => item.value === category)?.label || "Consumidor Final";
}
