import { redirect } from "next/navigation";
import { requireAdministrationUser } from "@/lib/supabase/administration";

export default async function LegacyManufacturingPage() {
  await requireAdministrationUser();
  redirect("/administracion/fabricacion-productos");
}
