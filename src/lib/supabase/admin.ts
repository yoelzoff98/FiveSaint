import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";

/**
 * Obtiene el usuario actualmente logueado.
 * Retorna null si no hay sesión activa.
 */
export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error("Error obteniendo usuario actual:", err);
    return null;
  }
}

/**
 * Verifica si el usuario actual es un administrador autorizado (is_active = true).
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("id, is_active")
      .eq("user_id", user.id)
      .single();

    if (error || !adminUser) {
      return false;
    }

    return adminUser.is_active === true;
  } catch (err) {
    console.error("Error validando permisos de admin:", err);
    return false;
  }
}

/**
 * Protege Server Components o Server Actions.
 * Si el usuario no es admin o no está logueado, lo redirige al login del panel.
 */
export async function requireAdmin() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/admin-FiveSaint/login");
  }
}
