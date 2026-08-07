import { redirect } from "next/navigation";
import { getCommercialUserContext } from "@/lib/supabase/comercial";

export default async function CommercialRootPage() {
  const ctx = await getCommercialUserContext();
  
  if (ctx.isLoggedIn && (ctx.isAdmin || ctx.isSeller)) {
    redirect("/admin-comercial/dashboard");
  } else {
    redirect("/admin-comercial/login");
  }
}
