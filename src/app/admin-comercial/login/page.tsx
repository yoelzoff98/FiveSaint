import { redirect } from "next/navigation";
import { getCommercialUserContext } from "@/lib/supabase/comercial";
import { CommercialLoginForm } from "@/components/comercial/CommercialLoginForm";

export default async function LoginPage() {
  const ctx = await getCommercialUserContext();
  
  if (ctx.isLoggedIn && (ctx.isAdmin || ctx.isSeller)) {
    redirect("/admin-comercial/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <CommercialLoginForm />
    </div>
  );
}
