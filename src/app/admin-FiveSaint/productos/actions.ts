"use server";

import { createAdminProduct, updateAdminProduct, AdminProductInput } from "@/lib/supabase/admin-products";
import { revalidatePath } from "next/cache";

export async function createProductAction(input: AdminProductInput) {
  try {
    const data = await createAdminProduct(input);
    revalidatePath("/admin-FiveSaint/productos");
    revalidatePath("/productos");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProductAction(id: string, input: AdminProductInput) {
  try {
    const data = await updateAdminProduct(id, input);
    revalidatePath("/admin-FiveSaint/productos");
    revalidatePath("/productos");
    revalidatePath(`/productos/${input.slug}`);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
