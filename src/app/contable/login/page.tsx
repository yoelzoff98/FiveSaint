import { redirect } from "next/navigation";
import { accountingContext } from "@/lib/supabase/accounting";
import { AccountingLogin } from "@/components/contable/AccountingLogin";
export default async function Page() {
  if (await accountingContext()) redirect("/contable");
  return (
    <main className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
      <AccountingLogin />
    </main>
  );
}
