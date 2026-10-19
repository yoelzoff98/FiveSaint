import type { ReactNode } from "react";
import { AccountingNavigation } from "./AccountingNavigation";
export function AccountingShell({
  children,
  context,
}: {
  children: ReactNode;
  context: { name?: string; canManage: boolean; internal: boolean };
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      <AccountingNavigation {...context} />
      <main
        id="contenido-contable"
        className="md:ml-64 min-w-0 p-4 sm:p-6 lg:p-8"
      >
        <div className="max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
