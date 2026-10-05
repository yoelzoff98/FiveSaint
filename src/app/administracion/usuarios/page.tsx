import { requireAdministrationUser, getAdministrationUsers } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { AdministrationUsersClient } from "./AdministrationUsersClient";
import { redirect } from "next/navigation";

export default async function AdministrationUsersPage() {
  const ctx = await requireAdministrationUser();

  // Exclusivo para el ADMIN Central
  if (!ctx.isAdmin) {
    redirect("/administracion");
  }

  const users = await getAdministrationUsers();

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <AdministrationUsersClient initialUsers={users} />
      </div>
    </AdministrationShell>
  );
}
