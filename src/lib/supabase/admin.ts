import { redirect } from "next/navigation";
import { getSessionUser, getAdminProfile } from "./auth-queries";

/**
 * Obtiene el usuario actualmente logueado.
 * Retorna null si no hay sesión activa.
 */
export async function getCurrentUser() {
  try {
    return await getSessionUser();
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
    const adminUser = await getAdminProfile(user.id);
    if (!adminUser) {
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
