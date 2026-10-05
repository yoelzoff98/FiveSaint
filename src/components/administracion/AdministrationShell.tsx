import { ReactNode } from "react";
import { AdministrationSidebar } from "./AdministrationSidebar";
import { AdministrationHeader } from "./AdministrationHeader";
import { getAdministrationUserContext } from "@/lib/supabase/administration";

interface AdministrationShellProps {
  children: ReactNode;
}

export async function AdministrationShell({ children }: AdministrationShellProps) {
  const ctx = await getAdministrationUserContext();

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdministrationSidebar isAdmin={ctx.isAdmin} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdministrationHeader
          profileName={ctx.profileName}
          isAdmin={ctx.isAdmin}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
