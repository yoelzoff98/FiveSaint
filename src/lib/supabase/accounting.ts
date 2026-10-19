"use server";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "./server";
import { getAdministrationUserContext } from "./administration";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function accountingContext() {
  const ctx = await getAdministrationUserContext();
  if (!ctx.user) return null;
  if (ctx.isAdmin || ctx.isAdministration)
    return { name: ctx.profileName, canManage: ctx.isAdmin, internal: true };
  // Existing inactive privileged profiles cannot regain access through another profile.
  if (ctx.adminId || ctx.administrationId) return null;
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from("accounting_users")
    .select("full_name,is_active")
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (error || !data?.is_active) return null;
  return { name: data.full_name, canManage: false, internal: false };
}
export async function requireAccountingUser() {
  const ctx = await accountingContext();
  if (!ctx) redirect("/contable/login?error=unauthorized");
  return ctx;
}
export async function createAccountingUser(form: FormData) {
  const ctx = await getAdministrationUserContext();
  if (!ctx.isAdmin || !ctx.user) throw new Error("Acceso denegado");
  const input = z
    .object({
      name: z.string().trim().min(2).max(120),
      email: z.email().transform((v) => v.toLowerCase()),
      password: z.string().min(12).max(128),
    })
    .parse({
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    });
  const db = createSupabaseAdminClient();
  const { data, error } = await db.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (error || !data.user)
    throw new Error(
      "No se pudo crear la cuenta. Revisá si el correo ya está registrado.",
    );
  const { error: profileError } = await db
    .from("accounting_users")
    .insert({
      user_id: data.user.id,
      full_name: input.name,
      email: input.email,
      created_by: ctx.user.id,
    });
  if (profileError) {
    await db.auth.admin.deleteUser(data.user.id);
    throw new Error("No se pudo asignar el perfil contable");
  }
  revalidatePath("/contable/usuarios");
}
export async function toggleAccountingUser(form: FormData) {
  const ctx = await getAdministrationUserContext();
  if (!ctx.isAdmin) throw new Error("Acceso denegado");
  const id = z.uuid().parse(form.get("id"));
  const active = z.enum(["true", "false"]).parse(form.get("active")) === "true";
  const { error } = await createSupabaseAdminClient()
    .from("accounting_users")
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw new Error("No se pudo actualizar el acceso");
  revalidatePath("/contable/usuarios");
}
export async function accountingLogout() {
  const db = await createSupabaseServerClient();
  await db.auth.signOut();
  redirect("/contable/login");
}
