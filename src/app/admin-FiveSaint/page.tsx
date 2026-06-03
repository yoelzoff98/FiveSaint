import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";

export default async function AdminRootPage() {
  const isAdmin = await isCurrentUserAdmin();
  
  if (isAdmin) {
    redirect("/admin-FiveSaint/dashboard");
  } else {
    redirect("/admin-FiveSaint/login");
  }
}
