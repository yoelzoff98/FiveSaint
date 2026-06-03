import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default async function LoginPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (isAdmin) {
    redirect("/admin-FiveSaint/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <AdminLoginForm />
    </div>
  );
}
