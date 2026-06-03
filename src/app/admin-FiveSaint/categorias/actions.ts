"use server";

import { createAdminCategory, updateAdminCategory, AdminCategoryInput } from "@/lib/supabase/admin-categories";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(input: AdminCategoryInput) {
  try {
    const data = await createAdminCategory(input);
    revalidatePath("/admin-FiveSaint/categorias");
    revalidatePath("/productos"); // Ya que pueden usarse en el filtro
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCategoryAction(id: string, input: AdminCategoryInput) {
  try {
    const data = await updateAdminCategory(id, input);
    revalidatePath("/admin-FiveSaint/categorias");
    revalidatePath("/productos");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
