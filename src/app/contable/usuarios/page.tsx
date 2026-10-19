import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAccountingUser } from "@/lib/supabase/accounting";
import { AccountingShell } from "@/components/contable/AccountingShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountingUserForm } from "@/components/contable/AccountingUserForms";
export default async function Page() {
  const ctx = await requireAccountingUser();
  if (!ctx.canManage) redirect("/contable");
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from("accounting_users")
    .select("id,full_name,email,is_active")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <AccountingShell context={ctx}>
      <div className="max-w-4xl bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <Link href="/contable">← Portal Contable</Link>
        <h1 className="text-2xl font-bold my-6">Accesos contables</h1>
        <p className="mb-4">
          Cuentas de consulta. Sólo ADMIN puede crear y desactivar estos
          accesos.
        </p>
        {error ? (
          <p role="alert">
            No se pudieron consultar los perfiles. Verificá la migración.
          </p>
        ) : (
          <>
            <AccountingUserForm />
            <ul className="mt-6">
              {data?.map((user) => (
                <li
                  className="border-b py-4 flex justify-between gap-3"
                  key={user.id}
                >
                  <span>
                    {user.full_name} · {user.email} ·{" "}
                    {user.is_active ? "Activo" : "Inactivo"}
                  </span>
                  <AccountingUserForm user={user} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AccountingShell>
  );
}
