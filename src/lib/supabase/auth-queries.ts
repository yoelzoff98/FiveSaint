import { cache } from "react";
import { createSupabaseServerClient } from "./server";

// React invalidates these values for every server render/request. Never use a
// process-wide cache for identity or authorization, including after mutations.
export const getSessionUser = cache(async () => {
  const db = await createSupabaseServerClient();
  const { data, error } = await db.auth.getUser();
  return error ? null : data.user;
});

export const getAdminProfile = cache(async (userId: string) => {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from("admin_users")
    .select("id,full_name,is_active")
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new Error("No se pudieron validar los permisos de administrador.");
  return data;
});

export const getAdministrationProfile = cache(async (userId: string) => {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from("administration_users")
    .select("id,full_name,is_active,email")
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new Error("No se pudieron validar los permisos de administración.");
  return data;
});

export const getSellerProfile = cache(async (userId: string) => {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from("sellers")
    .select("id,full_name,is_active")
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new Error("No se pudieron validar los permisos comerciales.");
  return data;
});

export const getDistributorProfile = cache(async (userId: string) => {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from("distributors")
    .select("id,company_name,contact_name,discount_percentage,is_active")
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new Error("No se pudieron validar los permisos del distribuidor.");
  return data;
});
