import { ReactNode } from "react";
import { getCommercialUserContext } from "@/lib/supabase/comercial";
import { CommercialSidebar } from "./CommercialSidebar";
import { CommercialHeader } from "./CommercialHeader";
import { RealtimeNotificationToast } from "./RealtimeNotificationToast";

interface CommercialShellProps {
  children: ReactNode;
}

export async function CommercialShell({ children }: CommercialShellProps) {
  const ctx = await getCommercialUserContext();

  return (
    <div className="flex min-h-screen bg-stone-50">
      <CommercialSidebar isAdmin={ctx.isAdmin} />
      <div className="flex-1 flex flex-col min-w-0">
        <CommercialHeader profileName={ctx.profileName || "Usuario Comercial"} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <RealtimeNotificationToast isAdmin={ctx.isAdmin} />
    </div>
  );
}
