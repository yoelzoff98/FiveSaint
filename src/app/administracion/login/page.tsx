import { getAdministrationUserContext } from "@/lib/supabase/administration";
import { redirect } from "next/navigation";
import { AdministrationLoginForm } from "@/components/administracion/AdministrationLoginForm";

export default async function AdministrationLoginPage() {
  const ctx = await getAdministrationUserContext();

  if (ctx.isLoggedIn && ctx.isActive && (ctx.isAdmin || ctx.isAdministration)) {
    redirect("/administracion");
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-deep/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <AdministrationLoginForm />
      </div>
    </div>
  );
}
