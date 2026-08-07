"use server";

import { requireCommercialUser } from "@/lib/supabase/comercial";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function registerSellerAction(formData: {
  username: string;
  fullName: string;
  email: string;
  password: string;
}) {
  // 1. Validar permisos de administrador
  const ctx = await requireCommercialUser();
  if (!ctx.isAdmin) {
    throw new Error("No tenés permisos para realizar esta operación.");
  }

  const { username, fullName, email, password } = formData;

  // 2. Validaciones básicas
  if (!username || username.length < 3) {
    throw new Error("El nombre de usuario debe tener al menos 3 caracteres.");
  }
  if (!fullName || fullName.length < 2) {
    throw new Error("El nombre completo debe tener al menos 2 caracteres.");
  }
  if (!email || !email.includes("@")) {
    throw new Error("El email ingresado no es válido.");
  }
  if (!password || password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  // 3. Inicializar el cliente Supabase Admin
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("El sistema no está configurado para la autocreación. Falta la clave SUPABASE_SERVICE_ROLE_KEY.");
  }
  const supabaseAdmin = createSupabaseAdminClient();

  // 4. Crear el usuario de autenticación en Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password: password,
    email_confirm: true // Confirmar automáticamente el email
  });

  if (authError || !authData.user) {
    console.error("Error al crear usuario auth:", authError);
    throw new Error(authError?.message || "Error al crear el usuario de autenticación.");
  }

  const authUser = authData.user;

  try {
    // 5. Vincular y crear en la tabla publica `sellers`
    const { data: sellerData, error: dbError } = await supabaseAdmin
      .from("sellers")
      .insert([{
        user_id: authUser.id,
        username: username.trim().toLowerCase(),
        full_name: fullName.trim(),
        email: email.trim(),
        is_active: true
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      success: true,
      seller: sellerData
    };
  } catch (dbErr: any) {
    console.error("Error al guardar perfil de vendedor en BD, realizando rollback de Auth:", dbErr);
    
    // Rollback: Eliminar el usuario de Auth si falló la base de datos
    await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    
    throw new Error(dbErr.message || "Error al registrar el perfil del vendedor.");
  }
}
