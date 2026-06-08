"use server";

import { AdminVariantInput } from "@/types/admin";
import { createAdminVariant, deactivateAdminVariant, updateAdminVariant } from "@/lib/supabase/admin-variants";
import { revalidatePath } from "next/cache";

export async function createVariantAction(input: AdminVariantInput) {
  try {
    const data = await createAdminVariant(input);
    revalidatePath("/admin-FiveSaint/productos/[id]/editar", "page");
    revalidatePath("/productos", "layout");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear la variante." };
  }
}

export async function updateVariantAction(id: string, input: AdminVariantInput) {
  try {
    const data = await updateAdminVariant(id, input);
    revalidatePath("/admin-FiveSaint/productos/[id]/editar", "page");
    revalidatePath("/admin-FiveSaint/variantes/[id]/editar", "page");
    revalidatePath("/productos", "layout");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar la variante." };
  }
}

export async function deactivateVariantAction(id: string) {
  try {
    await deactivateAdminVariant(id);
    revalidatePath("/admin-FiveSaint/productos/[id]/editar", "page");
    revalidatePath("/productos", "layout");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al desactivar la variante." };
  }
}
