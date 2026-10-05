"use server";

import { createSupabaseServerClient, createSupabaseAdminClient } from "./server";
import { getCurrentUser } from "./admin";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export interface AdministrationUserContext {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isAdministration: boolean;
  isActive: boolean;
  user?: User;
  profileName?: string;
  adminId?: string;
  administrationId?: string;
}

export interface AdministrationUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Obtiene el contexto de autorización administrativa.
 * Retorna true para 'isAdmin' si pertenece a public.admin_users activo.
 * Retorna true para 'isAdministration' si pertenece a public.administration_users activo.
 */
export async function getAdministrationUserContext(): Promise<AdministrationUserContext> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      isLoggedIn: false,
      isAdmin: false,
      isAdministration: false,
      isActive: false
    };
  }

  const supabase = await createSupabaseServerClient();

  // 1. Verificar si es ADMIN general (admin_users)
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id, full_name, is_active")
    .eq("user_id", user.id)
    .single();

  if (adminUser) {
    const isActive = Boolean(adminUser.is_active);
    return {
      isLoggedIn: true,
      isAdmin: isActive,
      isAdministration: false,
      isActive,
      adminId: adminUser.id,
      user,
      profileName: adminUser.full_name || "Administrador Central"
    };
  }

  // 2. Verificar si es usuario del rol Administración (administration_users)
  const { data: adminStaff } = await supabase
    .from("administration_users")
    .select("id, full_name, is_active, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminStaff) {
    const isActive = Boolean(adminStaff.is_active);
    return {
      isLoggedIn: true,
      isAdmin: false,
      isAdministration: isActive,
      isActive,
      administrationId: adminStaff.id,
      user,
      profileName: adminStaff.full_name || "Administración"
    };
  }

  return {
    isLoggedIn: true,
    isAdmin: false,
    isAdministration: false,
    isActive: false,
    user
  };
}

/**
 * Guardia de servidor: Autoriza únicamente a ADMIN activo y Administración activa.
 * Redirige al login de administración en caso de falta de sesión o falta de permisos.
 */
export async function requireAdministrationUser(): Promise<AdministrationUserContext> {
  const ctx = await getAdministrationUserContext();

  if (!ctx.isLoggedIn) {
    redirect("/administracion/login");
  }

  if (!ctx.isActive || (!ctx.isAdmin && !ctx.isAdministration)) {
    redirect("/administracion/login?error=unauthorized");
  }

  return ctx;
}

// =========================================================================
// GESTIÓN DE USUARIOS DE ADMINISTRACIÓN (Solo ADMIN Central)
// =========================================================================

/**
 * Obtiene el listado de todos los miembros del rol Administración.
 */
export async function getAdministrationUsers(): Promise<AdministrationUser[]> {
  const ctx = await getAdministrationUserContext();
  if (!ctx.isAdmin) {
    throw new Error("ACCESO DENEGADO: Solo el ADMIN puede gestionar el rol Administración.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("administration_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205" || error.message?.includes("administration_users")) {
      return [];
    }
    console.error("Error al obtener administration_users:", error);
    throw new Error("No se pudieron cargar los usuarios de administración.");
  }

  return (data || []) as AdministrationUser[];
}

/**
 * Registra un nuevo usuario en Supabase Auth y le asigna el rol Administración.
 */
export async function createAdministrationUserAction(formData: {
  fullName: string;
  email: string;
  password: string;
}) {
  const ctx = await getAdministrationUserContext();
  if (!ctx.isAdmin) {
    throw new Error("ACCESO DENEGADO: Solo el ADMIN puede crear miembros de Administración.");
  }

  const { fullName, email, password } = formData;

  if (!fullName || fullName.trim().length < 2) {
    throw new Error("El nombre completo debe tener al menos 2 caracteres.");
  }
  if (!email || !email.includes("@")) {
    throw new Error("El email ingresado no es válido.");
  }
  if (!password || password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Crear el usuario en auth.users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password: password,
    email_confirm: true
  });

  if (authError || !authData.user) {
    console.error("Error al crear usuario auth para administración:", authError);
    throw new Error(authError?.message || "Error al crear el usuario en el sistema de autenticación.");
  }

  const authUser = authData.user;

  try {
    // 2. Insertar en public.administration_users
    const { data: adminStaff, error: dbError } = await supabaseAdmin
      .from("administration_users")
      .insert([{
        user_id: authUser.id,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        is_active: true,
        created_by: ctx.user!.id,
        updated_by: ctx.user!.id
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      success: true,
      user: adminStaff
    };
  } catch (dbErr: any) {
    console.error("Rollback Auth al fallar inserción en administration_users:", dbErr);
    await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    throw new Error(dbErr.message || "Error al registrar el usuario de administración en base de datos.");
  }
}

/**
 * Asigna el rol Administración a un usuario existente en auth.users.
 */
export async function assignExistingUserToAdministrationAction(formData: {
  userId: string;
  fullName: string;
  email: string;
}) {
  const ctx = await getAdministrationUserContext();
  if (!ctx.isAdmin) {
    throw new Error("ACCESO DENEGADO: Solo el ADMIN puede asignar el rol Administración.");
  }

  const { userId, fullName, email } = formData;

  if (!userId || !fullName || fullName.trim().length < 2) {
    throw new Error("Datos incompletos para asignar el rol de administración.");
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: adminStaff, error } = await supabaseAdmin
    .from("administration_users")
    .insert([{
      user_id: userId,
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      is_active: true,
      created_by: ctx.user!.id,
      updated_by: ctx.user!.id
    }])
    .select()
    .single();

  if (error) {
    console.error("Error al asignar rol de administración:", error);
    throw new Error(error.message || "Error al asignar el rol a la cuenta existente.");
  }

  return {
    success: true,
    user: adminStaff
  };
}

/**
 * Alterna el estado activo/inactivo de un usuario de administración.
 */
export async function toggleAdministrationUserActiveAction(id: string) {
  const ctx = await getAdministrationUserContext();
  if (!ctx.isAdmin) {
    throw new Error("ACCESO DENEGADO: Solo el ADMIN puede modificar el estado de un usuario.");
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: current, error: getErr } = await supabaseAdmin
    .from("administration_users")
    .select("is_active")
    .eq("id", id)
    .single();

  if (getErr || !current) {
    throw new Error("Usuario de administración no encontrado.");
  }

  const newStatus = !current.is_active;

  const { data, error } = await supabaseAdmin
    .from("administration_users")
    .update({
      is_active: newStatus,
      updated_by: ctx.user!.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("Error al cambiar el estado del usuario de administración.");
  }

  return { success: true, user: data };
}

/**
 * Actualiza los datos de un usuario de administración.
 */
export async function updateAdministrationUserAction(id: string, formData: { fullName: string }) {
  const ctx = await getAdministrationUserContext();
  if (!ctx.isAdmin) {
    throw new Error("ACCESO DENEGADO: Solo el ADMIN puede editar usuarios de administración.");
  }

  if (!formData.fullName || formData.fullName.trim().length < 2) {
    throw new Error("El nombre completo debe tener al menos 2 caracteres.");
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data, error } = await supabaseAdmin
    .from("administration_users")
    .update({
      full_name: formData.fullName.trim(),
      updated_by: ctx.user!.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("Error al actualizar el usuario de administración.");
  }

  return { success: true, user: data };
}
