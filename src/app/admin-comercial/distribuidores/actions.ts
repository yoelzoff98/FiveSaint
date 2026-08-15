"use server";

import { requireCommercialUser } from "@/lib/supabase/comercial";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function registerDistributorAction(formData: {
  username: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  discountPercentage: number;
  password: string;
}) {
  // 1. Validar permisos de administrador
  const ctx = await requireCommercialUser();
  if (!ctx.isAdmin) {
    throw new Error("No tenés permisos para realizar esta operación.");
  }

  const { username, companyName, contactName, email, phone, address, discountPercentage, password } = formData;

  // 2. Validaciones básicas
  if (!username || username.length < 3) {
    throw new Error("El nombre de usuario debe tener al menos 3 caracteres.");
  }
  if (!companyName || companyName.length < 2) {
    throw new Error("La razón social / empresa debe tener al menos 2 caracteres.");
  }
  if (!contactName || contactName.length < 2) {
    throw new Error("El nombre de contacto debe tener al menos 2 caracteres.");
  }
  if (!email || !email.includes("@")) {
    throw new Error("El email ingresado no es válido.");
  }
  if (discountPercentage === undefined || discountPercentage < 0 || discountPercentage > 100) {
    throw new Error("El porcentaje de descuento debe ser entre 0 y 100.");
  }
  if (!password || password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  // 3. Inicializar el cliente Supabase Admin
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("El sistema no está configurado para la autocreación. Falta la clave SUPABASE_SERVICE_ROLE_KEY.");
  }
  const supabaseAdmin = createSupabaseAdminClient();

  // 4. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password: password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error("Error al crear usuario auth distribuidor:", authError);
    throw new Error(authError?.message || "Error al crear el usuario de autenticación.");
  }

  const authUser = authData.user;

  try {
    // 5. Vincular y crear en la tabla publica `distributors`
    const { data: distributorData, error: dbError } = await supabaseAdmin
      .from("distributors")
      .insert([{
        user_id: authUser.id,
        username: username.trim().toLowerCase(),
        company_name: companyName.trim(),
        contact_name: contactName.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        discount_percentage: discountPercentage,
        is_active: true
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      success: true,
      distributor: distributorData
    };
  } catch (dbErr: any) {
    console.error("Error al guardar distribuidor en BD, realizando rollback de Auth:", dbErr);
    
    // Rollback: Eliminar el usuario de Auth si falló la base de datos
    await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    
    throw new Error(dbErr.message || "Error al registrar el perfil del distribuidor.");
  }
}
