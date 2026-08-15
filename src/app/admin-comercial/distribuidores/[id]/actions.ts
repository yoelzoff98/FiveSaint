"use server";

import { updateDistributorDiscount } from "@/lib/supabase/comercial";
import { revalidatePath } from "next/cache";

export async function updateDistributorDiscountAction(distributorId: string, discountPercentage: number) {
  await updateDistributorDiscount(distributorId, discountPercentage);
  revalidatePath(`/admin-comercial/distribuidores/${distributorId}`);
  revalidatePath(`/admin-comercial/distribuidores`);
}
