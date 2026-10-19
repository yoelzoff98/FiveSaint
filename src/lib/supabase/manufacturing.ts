"use server";

import { createSupabaseServerClient, createSupabaseAdminClient } from "./server";
import { requireAdministrationUser, getAdministrationUserContext } from "./administration";
import { requireCommercialUser } from "./comercial";
import {
  calculateRequiredSupplies,
  validateSingleA4Capacity,
  validateOptionCompatibility,
  SupplyItem,
  CompositionBaseItem,
  ConfigurableOptionDefinition
} from "@/lib/manufacturing-calculations";
import {
  SupplyInputSchema,
  CreateCompositionInputSchema,
  ConfigurableOptionInputSchema,
  ReassignClientInputSchema,
  IssueManufacturingOrderInputSchema,
  ReviseManufacturingOrderInputSchema,
  CheckDuplicatesInputSchema
} from "@/lib/validations/manufacturing";
import crypto from "crypto";
import { ClientCategorySchema } from "@/lib/client-categories";
import { AdminClientUpdateSchema } from "@/lib/validations/admin-client";

// =========================================================================
// 1. GESTIÓN DE CLIENTES EN ADMINISTRACIÓN
// =========================================================================

export async function getPaginatedClientsAdmin(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sellerId?: string;
  category?: string;
}) {
  await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("clients")
    .select(`
      id, name, company_name, category, email, phone, address, notes, status, source,
      seller_id, created_by_name, created_by_role, created_at, updated_at,
      sellers(id, full_name, email)
    `, { count: "exact" });

  if (params.sellerId && params.sellerId !== "all") {
    query = query.eq("seller_id", params.sellerId);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.category && params.category !== "all") {
    query = query.eq("category", ClientCategorySchema.parse(params.category));
  }

  if (params.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(`name.ilike.${term},company_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error getPaginatedClientsAdmin:", error);
    throw new Error("No se pudieron cargar los clientes.");
  }

  const total = count || 0;
  return {
    data: data || [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export async function checkClientDuplicatesAction(input: {
  name?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  excludeId?: string | null;
}) {
  await requireAdministrationUser();
  const parsed = CheckDuplicatesInputSchema.safeParse(input);
  if (!parsed.success) return { duplicates: [] };

  const { name, companyName, email, phone, excludeId } = parsed.data;
  const supabase = createSupabaseAdminClient();

  const cleanEmail = email?.trim().toLowerCase();
  const cleanPhone = phone?.replace(/[^0-9]/g, "");
  const cleanName = name?.trim();
  const cleanCompany = companyName?.trim();

  const orConditions: string[] = [];
  if (cleanEmail && cleanEmail.includes("@")) {
    orConditions.push(`email.ilike.${cleanEmail}`);
  }
  if (cleanPhone && cleanPhone.length >= 6) {
    orConditions.push(`phone.ilike.%${cleanPhone}%`);
  }
  if (cleanCompany && cleanCompany.length >= 3) {
    orConditions.push(`company_name.ilike.%${cleanCompany}%`);
  }
  if (cleanName && cleanName.length >= 3) {
    orConditions.push(`name.ilike.%${cleanName}%`);
  }

  if (orConditions.length === 0) {
    return { duplicates: [] };
  }

  let query = supabase
    .from("clients")
    .select("id, name, company_name, email, phone, status, seller_id, sellers(full_name)")
    .or(orConditions.join(","))
    .limit(5);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error checking duplicates:", error);
    return { duplicates: [] };
  }

  return { duplicates: data || [] };
}

export async function reassignClientAction(formData: {
  clientId: string;
  newSellerId: string;
  reason: string;
}) {
  const ctx = await requireAdministrationUser();
  const validated = ReassignClientInputSchema.parse(formData);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("reassign_client_transactional", {
    p_user_id: ctx.user!.id,
    p_client_id: validated.clientId,
    p_new_seller_id: validated.newSellerId,
    p_reason: validated.reason
  });

  if (error) {
    console.error("Error en reassign_client_transactional:", error);
    throw new Error(error.message || "Error al reasignar el cliente.");
  }

  return data;
}

export async function getClientAssignmentHistory(clientId: string) {
  await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("client_assignment_history")
    .select(`
      id, client_id, previous_seller_id, new_seller_id, changed_by_name, reason, created_at,
      previous_seller:previous_seller_id(full_name),
      new_seller:new_seller_id(full_name)
    `)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error getClientAssignmentHistory:", error);
    return [];
  }

  return data || [];
}

export async function createClientAdmin(clientData: {
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  seller_id?: string;
  source?: string;
  category?: string;
}) {
  const ctx = await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  if (!clientData.name || !clientData.name.trim()) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  const { data, error } = await supabase
    .from("clients")
    .insert([{
      name: clientData.name.trim(),
      category: ClientCategorySchema.parse(clientData.category ?? "consumidor_final"),
      company_name: clientData.company_name?.trim() || null,
      email: clientData.email?.trim() || null,
      phone: clientData.phone?.trim() || null,
      address: clientData.address?.trim() || null,
      notes: clientData.notes?.trim() || null,
      seller_id: clientData.seller_id || null,
      source: clientData.source || "manual",
      status: "nuevo",
      created_by_user_id: ctx.user!.id,
      created_by_role: ctx.isAdmin ? "admin" : "administration",
      created_by_name: ctx.profileName || "Administración FiveSaint"
    }])
    .select(`*, sellers(id, full_name)`)
    .single();

  if (error) {
    console.error("Error createClientAdmin:", error);
    throw new Error(error.message || "Error al crear cliente.");
  }

  return data;
}

export async function updateClientAdmin(
  id: string,
  clientData: {
    name?: string;
    category?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    status?: string;
    source?: string;
    seller_id?: string;
  }
) {
  await requireAdministrationUser();
  const validated=AdminClientUpdateSchema.safeParse(clientData);
  if(!validated.success) throw new Error(validated.error.issues[0]?.message || "Datos del cliente no válidos.");
  clientData=validated.data;
  const supabase = createSupabaseAdminClient();

  // Control estricto de auditoría: No se permite cambiar seller_id de forma directa.
  // Toda reasignación de cartera debe realizarse exclusivamente a través de reassignClientAction()
  if (clientData.seller_id !== undefined) {
    const { data: currentClient } = await supabase
      .from("clients")
      .select("seller_id")
      .eq("id", id)
      .single();

    if (currentClient && currentClient.seller_id !== clientData.seller_id) {
      throw new Error(
        "REASIGNACIÓN NO PERMITIDA: No puede cambiar el asesor comercial asignado directamente. Toda reasignación debe ejecutarse mediante la operación auditada con motivo obligatorio."
      );
    }
  }

  const updateFields: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (clientData.name !== undefined) updateFields.name = clientData.name.trim();
  if (clientData.category !== undefined) updateFields.category = ClientCategorySchema.parse(clientData.category);
  if (clientData.company_name !== undefined) updateFields.company_name = clientData.company_name?.trim() || null;
  if (clientData.email !== undefined) updateFields.email = clientData.email?.trim() || null;
  if (clientData.phone !== undefined) updateFields.phone = clientData.phone?.trim() || null;
  if (clientData.address !== undefined) updateFields.address = clientData.address?.trim() || null;
  if (clientData.notes !== undefined) updateFields.notes = clientData.notes?.trim() || null;
  if (clientData.status !== undefined) updateFields.status = clientData.status;
  if (clientData.source !== undefined) updateFields.source = clientData.source;

  const { data, error } = await supabase
    .from("clients")
    .update(updateFields)
    .eq("id", id)
    .select(`*, sellers(id, full_name)`)
    .single();

  if (error) {
    console.error("Error updateClientAdmin:", error);
    throw new Error(error.message || "Error al actualizar cliente.");
  }

  return data;
}

export async function deleteClientSafeAction(clientId: string) {
  const ctx = await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("fn_delete_client_safe", {
    p_user_id: ctx.user!.id,
    p_client_id: clientId
  });

  if (error) {
    console.error("Error en fn_delete_client_safe:", error);
    throw new Error(error.message || "Error al intentar eliminar el cliente.");
  }

  return data;
}

// =========================================================================
// 2. CATÁLOGO DE INSUMOS (supplies)
// =========================================================================

export async function getSupplies(params?: { search?: string; isActive?: boolean | 'all' }) {
  await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  let query = supabase.from("supplies").select("*");

  if (params?.isActive !== undefined && params.isActive !== 'all') {
    query = query.eq("is_active", Boolean(params.isActive));
  }

  if (params?.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(`code.ilike.${term},name.ilike.${term},description.ilike.${term}`);
  }

  const { data, error } = await query.order("code", { ascending: true });
  if (error) {
    console.error("Error getSupplies:", error);
    throw new Error("No se pudo obtener el catálogo de insumos.");
  }

  return data || [];
}

export async function createSupplyAction(formData: {
  code: string;
  name: string;
  description?: string | null;
  unitOfMeasure: 'un' | 'm' | 'kg' | 'l' | 'm2' | 'm3' | 'g' | 'cm';
  isActive?: boolean;
  notes?: string | null;
}) {
  const ctx = await requireAdministrationUser();
  const validated = SupplyInputSchema.parse(formData);
  const supabase = createSupabaseAdminClient();

  const cleanCode = validated.code.trim().toUpperCase();

  const { data, error } = await supabase
    .from("supplies")
    .insert([{
      code: cleanCode,
      name: validated.name.trim(),
      description: validated.description?.trim() || null,
      unit_of_measure: validated.unitOfMeasure,
      is_active: validated.isActive !== false,
      notes: validated.notes?.trim() || null,
      created_by_user_id: ctx.user!.id,
      created_by_name: ctx.profileName || "Administración FiveSaint"
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`El código de insumo "${cleanCode}" ya existe en el sistema.`);
    }
    console.error("Error createSupplyAction:", error);
    throw new Error(error.message || "Error al registrar el insumo.");
  }

  return data;
}

export async function updateSupplyAction(id: string, formData: {
  name: string;
  description?: string | null;
  unitOfMeasure: 'un' | 'm' | 'kg' | 'l' | 'm2' | 'm3' | 'g' | 'cm';
  isActive?: boolean;
  notes?: string | null;
}) {
  const ctx = await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  const updateFields: Record<string, unknown> = {
    name: formData.name.trim(),
    description: formData.description?.trim() || null,
    unit_of_measure: formData.unitOfMeasure,
    notes: formData.notes?.trim() || null,
    updated_by_user_id: ctx.user!.id,
    updated_by_name: ctx.profileName || "Administración FiveSaint",
    updated_at: new Date().toISOString()
  };

  if (formData.isActive !== undefined) {
    updateFields.is_active = Boolean(formData.isActive);
  }

  const { data, error } = await supabase
    .from("supplies")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updateSupplyAction:", error);
    throw new Error(error.message || "Error al actualizar el insumo.");
  }

  return data;
}

export async function toggleSupplyActiveAction(id: string) {
  const ctx = await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  const { data: curr, error: currErr } = await supabase
    .from("supplies")
    .select("is_active")
    .eq("id", id)
    .single();

  if (currErr || !curr) throw new Error("Insumo no encontrado.");

  const { data, error } = await supabase
    .from("supplies")
    .update({
      is_active: !curr.is_active,
      updated_by_user_id: ctx.user!.id,
      updated_by_name: ctx.profileName || "Administración FiveSaint",
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error("Error al modificar estado del insumo.");
  return data;
}

export async function deleteSupplySafeAction(id: string) {
  await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  // Verificar si está utilizado en composiciones
  const { count: compCount } = await supabase
    .from("composition_items")
    .select("*", { count: "exact", head: true })
    .eq("supply_id", id);

  if ((compCount || 0) > 0) {
    throw new Error("No se puede eliminar físicamente: el insumo está utilizado en composiciones técnicas. Desactívelo para prevenir nuevos usos.");
  }

  const { error } = await supabase.from("supplies").delete().eq("id", id);
  if (error) {
    throw new Error("No se pudo eliminar el insumo. Verifique que no posea referencias activas.");
  }

  return { success: true };
}

// =========================================================================
// 3. COMPOSICIONES BASE VERSIONADAS (product_compositions)
// =========================================================================

export async function getProductCompositions(params?: {
  productId?: string;
  status?: string;
}) {
  await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  let query = supabase.from("product_compositions").select(`
    id, product_id, variant_id, version, status, name, technical_notes, waste_percentage,
    published_at, created_at, updated_at, created_by_name, updated_by_name,
    products(id, name),
    product_variants(id, name)
  `);

  if (params?.productId && params.productId !== "all") {
    query = query.eq("product_id", params.productId);
  }

  if (params?.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query
    .order("product_id", { ascending: true })
    .order("version", { ascending: false });

  if (error) {
    console.error("Error getProductCompositions:", error);
    throw new Error("No se pudieron cargar las composiciones.");
  }

  return data || [];
}

export async function getProductCompositionById(id: string) {
  await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("product_compositions")
    .select(`
      id, product_id, variant_id, version, status, name, technical_notes, waste_percentage,
      published_at, created_at, updated_at, created_by_name, updated_by_name,
      products(id, name),
      product_variants(id, name),
      items:composition_items(
        id, supply_id, quantity, notes,
        supplies(id, code, name, unit_of_measure, is_active)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error getProductCompositionById:", error);
    throw new Error("Composición no encontrada.");
  }

  return data;
}

export async function createProductCompositionAction(formData: {
  productId: string;
  variantId?: string | null;
  name: string;
  technicalNotes?: string | null;
  wastePercentage?: number;
  items: Array<{ supplyId: string; quantity: number; notes?: string | null }>;
}) {
  const ctx = await requireAdministrationUser();
  const validated = CreateCompositionInputSchema.parse(formData);
  const supabase = createSupabaseAdminClient();

  // Calcular la próxima versión
  let versionQuery = supabase
    .from("product_compositions")
    .select("version")
    .eq("product_id", validated.productId);

  if (validated.variantId) {
    versionQuery = versionQuery.eq("variant_id", validated.variantId);
  } else {
    versionQuery = versionQuery.is("variant_id", null);
  }

  const { data: existingVersions } = await versionQuery.order("version", { ascending: false }).limit(1);
  const nextVersion = existingVersions && existingVersions.length > 0 ? (existingVersions[0].version + 1) : 1;

  // Insertar cabecera de composición en estado borrador
  const { data: comp, error: compErr } = await supabase
    .from("product_compositions")
    .insert([{
      product_id: validated.productId,
      variant_id: validated.variantId || null,
      version: nextVersion,
      status: "draft",
      name: validated.name.trim(),
      technical_notes: validated.technicalNotes?.trim() || null,
      waste_percentage: validated.wastePercentage || 0,
      created_by_user_id: ctx.user!.id,
      created_by_name: ctx.profileName || "Administración FiveSaint"
    }])
    .select()
    .single();

  if (compErr || !comp) {
    console.error("Error al crear product_compositions:", compErr);
    throw new Error(compErr?.message || "Error al crear la composición.");
  }

  // Insertar ítems
  const itemsToInsert = validated.items.map(it => ({
    composition_id: comp.id,
    supply_id: it.supplyId,
    quantity: it.quantity,
    notes: it.notes?.trim() || null
  }));

  const { error: itemsErr } = await supabase.from("composition_items").insert(itemsToInsert);
  if (itemsErr) {
    await supabase.from("product_compositions").delete().eq("id", comp.id);
    console.error("Error al insertar composition_items:", itemsErr);
    throw new Error("Error al asociar insumos a la composición.");
  }

  return comp;
}

export async function publishProductCompositionAction(id: string) {
  const ctx = await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("publish_product_composition_transactional", {
    p_user_id: ctx.user!.id,
    p_composition_id: id
  });

  if (error) {
    console.error("Error publish_product_composition_transactional:", error);
    throw new Error(error.message || "Error al publicar la composición.");
  }

  return data;
}

export async function retireProductCompositionAction(id: string) {
  const ctx = await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("product_compositions")
    .update({
      status: "retired",
      retired_at: new Date().toISOString(),
      updated_by_user_id: ctx.user!.id,
      updated_by_name: ctx.profileName || "Administración FiveSaint",
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("Error al retirar la composición.");
  }

  return data;
}

export async function createNextVersionCompositionAction(publishedCompositionId: string) {
  const ctx = await requireAdministrationUser();
  const current = await getProductCompositionById(publishedCompositionId);
  const supabase = createSupabaseAdminClient();

  // Próxima versión
  const nextVersion = current.version + 1;

  const { data: newComp, error: compErr } = await supabase
    .from("product_compositions")
    .insert([{
      product_id: current.product_id,
      variant_id: current.variant_id,
      version: nextVersion,
      status: "draft",
      name: `${current.name} (v${nextVersion})`,
      technical_notes: current.technical_notes,
      waste_percentage: current.waste_percentage,
      created_by_user_id: ctx.user!.id,
      created_by_name: ctx.profileName || "Administración FiveSaint"
    }])
    .select()
    .single();

  if (compErr || !newComp) {
    throw new Error("Error al generar la nueva versión borrador.");
  }

  // Copiar insumos
  if (Array.isArray(current.items) && current.items.length > 0) {
    const items = current.items.map((it: any) => ({
      composition_id: newComp.id,
      supply_id: it.supply_id,
      quantity: it.quantity,
      notes: it.notes
    }));

    await supabase.from("composition_items").insert(items);
  }

  return newComp;
}

// =========================================================================
// 4. OPCIONES CONFIGURABLES (configurable_options)
// =========================================================================

export async function getConfigurableOptions(params?: { productId?: string; isActiveOnly?: boolean }) {
  await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  let query = supabase.from("configurable_options").select("*");

  if (params?.isActiveOnly) {
    query = query.eq("is_active", true);
  }

  if (params?.productId) {
    query = query.or(`product_id.is.null,product_id.eq.${params.productId}`);
  }

  const { data, error } = await query.order("sort_order", { ascending: true });
  if (error) {
    console.error("Error getConfigurableOptions:", error);
    return [];
  }

  return data || [];
}

/** Commercial projection: never serialize material rules to the seller. */
export async function getCommercialManufacturingSetup() {
  await requireCommercialUser();
  const db = createSupabaseAdminClient();
  const [options, bindings] = await Promise.all([
    db.from("configurable_options").select("code,name,product_id,allowed_values,default_value,is_required").eq("is_active", true).order("sort_order"),
    db.from("catalog_manufacturing_bindings").select("catalog_key,product_id,variant_id")
  ]);
  if (options.error || bindings.error) throw new Error("No se pudo cargar la configuración técnica. Verificá las migraciones.");
  return { options: options.data || [], bindings: bindings.data || [] };
}

export async function saveCatalogManufacturingBinding(input: { catalogKey: string; productId: string; variantId?: string }) {
  const ctx = await requireAdministrationUser();
  const { getOfficialCatalog } = await import("@/lib/catalog-service");
  if (!getOfficialCatalog().some(item => item.key === input.catalogKey)) throw new Error("Artículo de catálogo inválido.");
  const db = createSupabaseAdminClient();
  const { data: product } = await db.from("products").select("id").eq("id", input.productId).eq("is_active", true).single();
  if (!product) throw new Error("Producto inválido o inactivo.");
  if (input.variantId) {
    const { data: variant } = await db.from("product_variants").select("id").eq("id", input.variantId).eq("product_id", input.productId).eq("is_active", true).single();
    if (!variant) throw new Error("La variante no corresponde al producto.");
  }
  const { error } = await db.from("catalog_manufacturing_bindings").upsert({ catalog_key: input.catalogKey, product_id: input.productId, variant_id: input.variantId || null, updated_by: ctx.user!.id, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function createConfigurableOptionAction(formData: any) {
  const ctx = await requireAdministrationUser();
  const validated = ConfigurableOptionInputSchema.parse(formData);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("configurable_options")
    .insert([{
      product_id: validated.productId || null,
      code: validated.code.trim().toLowerCase(),
      name: validated.name.trim(),
      description: validated.description?.trim() || null,
      is_required: validated.isRequired,
      default_value: validated.defaultValue?.trim() || null,
      allowed_values: validated.allowedValues,
      manufacturing_instructions: validated.manufacturingInstructions || {},
      compatibility_rules: validated.compatibilityRules || [],
      materials_effect: validated.materialsEffect || [],
      changes_materials: validated.changesMaterials || (validated.materialsEffect && validated.materialsEffect.length > 0),
      is_active: validated.isActive !== false,
      sort_order: validated.sortOrder || 0,
      created_by_user_id: ctx.user!.id,
      created_by_name: ctx.profileName || "Administración FiveSaint"
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`El código de opción "${validated.code}" ya está en uso.`);
    }
    console.error("Error createConfigurableOptionAction:", error);
    throw new Error(error.message || "Error al crear opción configurable.");
  }

  return data;
}

export async function updateConfigurableOptionAction(id: string, formData: any) {
  await requireAdministrationUser();
  const validated = ConfigurableOptionInputSchema.parse(formData);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("configurable_options")
    .update({
      product_id: validated.productId || null,
      name: validated.name.trim(),
      description: validated.description?.trim() || null,
      is_required: validated.isRequired,
      default_value: validated.defaultValue?.trim() || null,
      allowed_values: validated.allowedValues,
      manufacturing_instructions: validated.manufacturingInstructions || {},
      compatibility_rules: validated.compatibilityRules || [],
      materials_effect: validated.materialsEffect || [],
      changes_materials: validated.changesMaterials || (validated.materialsEffect && validated.materialsEffect.length > 0),
      is_active: validated.isActive !== false,
      sort_order: validated.sortOrder || 0,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updateConfigurableOptionAction:", error);
    throw new Error(error.message || "Error al actualizar opción configurable.");
  }

  return data;
}

// =========================================================================
// 5. ÓRDENES DE FABRICACIÓN (manufacturing_orders)
// =========================================================================

export async function getManufacturingOrders(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}) {
  await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.min(50, Math.max(1, params?.pageSize || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("manufacturing_orders").select(`
    id, order_number, order_id, order_item_id, product_name, variant_name, quantity, status,
    bom_version, issued_at, issued_by_name, revision_number, notes, created_at,
    orders(order_number, client_id, sale_channel, clients(name, company_name))
  `, { count: "exact" });

  if (params?.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params?.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(`order_number.ilike.${term},product_name.ilike.${term}`);
  }

  const { data, count, error } = await query
    .order("issued_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error getManufacturingOrders:", error);
    throw new Error("No se pudieron cargar las órdenes de fabricación.");
  }

  const total = count || 0;
  return {
    data: data || [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

export async function getManufacturingOrderById(id: string) {
  await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("manufacturing_orders")
    .select(`
      *,
      orders(
        id, order_number, created_at, notes
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error getManufacturingOrderById:", error);
    throw new Error("Orden de fabricación no encontrada.");
  }

  return data;
}

/**
 * Obtiene los ítems de pedidos vigentes pendientes de emitir orden de fabricación.
 */
export async function getPendingOrderItemsForManufacturing(orderId?: string) {
  await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  // Pedidos vigentes directos que no estén cancelados ni completados (venta distribuidor)
  let query = supabase
    .from("order_items")
    .select(`
      id, order_id, product_id, variant_id, product_name, variant_name, quantity,
      factory_notes, configuration, configuration_status, configuration_review_notes,
      manufacturing_issued_quantity,
      orders!inner(
        id, order_number, status, sale_channel, commercial_approval_status, created_at,
        clients(name, company_name),
        sellers(full_name)
      )
    `)
    .neq("orders.status", "cancelled")
    .eq("orders.sale_channel", "direct")
    .in("orders.commercial_approval_status", ["approved","legacy"])
    .order("created_at", { ascending: false });
  if (orderId) query = query.eq("order_id", orderId);
  const {data,error} = await query;

  if (error) {
    console.error("Error getPendingOrderItemsForManufacturing:", JSON.stringify({
      code: error.code, message: error.message, details: error.details, hint: error.hint
    }));
    if ((error.code === "42703" || error.code === "PGRST204") && error.message.includes("commercial_approval_status")) {
      throw new Error("Fabricación pendiente no disponible: falta aplicar la migración 20261018000200_order_request_approval.sql en la base de datos de este entorno. No se pueden verificar las aprobaciones de los pedidos.");
    }
    throw new Error("No se pudieron cargar los pedidos pendientes de fabricación. Intente nuevamente antes de emitir órdenes.");
  }

  // Filtrar ítems que todavía tienen saldo para fabricar
  return (data || []).filter((item: any) => {
    const issued = item.manufacturing_issued_quantity || 0;
    return item.quantity > issued;
  });
}

/**
 * Emite una orden de fabricación validando BOM, opciones configurables,
 * concurrencia y estricta capacidad de una sola hoja A4.
 */
async function prepareManufacturingLine(formData: {
  orderId: string;
  orderItemId: string;
  quantity: number;
  bomId?: string | null;
  notes?: string | null;
  idempotencyKey?: string | null;
}) {
  const ctx = await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  // 1. Obtener ítem de pedido y validar
  const { data: orderItem, error: oiErr } = await supabase
    .from("order_items")
    .select(`
      *,
      orders(id, status, sale_channel, distributor_id, order_number)
    `)
    .eq("id", formData.orderItemId)
    .single();

  if (oiErr || !orderItem) {
    throw new Error("Ítem de pedido no encontrado.");
  }

  // 2. Resolver Composición Base (debe estar publicada)
  let bomId: string | null | undefined = formData.bomId;
  let bomRecord: any = null;

  if (bomId) {
    bomRecord = await getProductCompositionById(bomId);
  } else if (orderItem.product_id) {
    // Buscar composición publicada para este producto y variante
    let compQ = supabase
      .from("product_compositions")
      .select("id")
      .eq("product_id", orderItem.product_id)
      .eq("status", "published");

    if (orderItem.variant_id) {
      compQ = compQ.eq("variant_id", orderItem.variant_id);
    }

    const { data: foundComp } = await compQ.limit(1);
    const resolvedCompId = foundComp?.[0]?.id as string | undefined;
    if (resolvedCompId) {
      bomId = resolvedCompId;
      bomRecord = await getProductCompositionById(resolvedCompId);
    }
  }

  if (!bomRecord) {
    throw new Error(
      "CONTROL DE FÁBRICA: No se encontró una composición técnica (BOM) publicada para este producto. Registre y publique una composición en Administración antes de emitir fabricación. Queda terminantemente prohibido emitir con recetas supuestas o automáticas."
    );
  }

  if (bomRecord.status !== "published") {
    throw new Error(
      `CONTROL DE FÁBRICA: La composición técnica seleccionada '${bomRecord.name}' no está publicada (estado: ${bomRecord.status}). Solo se permite fabricar con composiciones en estado 'published'.`
    );
  }

  // Comprobar que el ítem haya sido revisado y aprobado formalmente antes de emitirse a producción
  if (orderItem.configuration_status !== "approved") {
    throw new Error(
      `CONTROL DE FÁBRICA: La configuración del ítem se encuentra en estado '${orderItem.configuration_status || "pendiente"}'. Debe revisarse y aprobarse en Administración (/administracion/fabricacion/revision) antes de emitir la orden de fabricación.`
    );
  }

  // 3. Mapear insumos base para el motor de cálculo
  const baseItems: CompositionBaseItem[] = (bomRecord.items || []).map((it: any) => ({
    supplyId: it.supply_id,
    code: it.supplies.code,
    name: it.supplies.name,
    unitOfMeasure: it.supplies.unit_of_measure,
    baseQuantity: it.quantity,
    notes: it.notes
  }));

  // 4. Cargar opciones configurables del producto y validar compatibilidad
  const optionsDb = await getConfigurableOptions({ productId: bomRecord.product_id, isActiveOnly: true });
  const optionsDefinitions: ConfigurableOptionDefinition[] = optionsDb.map((o: any) => ({
    code: o.code,
    name: o.name,
    allowedValues: o.allowed_values || [],
    defaultValue: o.default_value,
    isRequired: o.is_required,
    manufacturingInstructions: o.manufacturing_instructions || {},
    compatibilityRules: o.compatibility_rules || [],
    materialsEffect: o.materials_effect || [],
    changesMaterials: o.changes_materials
  }));

  const itemConfig = orderItem.configuration || {};
  const compatResult = validateOptionCompatibility(itemConfig, optionsDefinitions);
  if (!compatResult.valid) {
    throw new Error(`Incompatibilidad en configuración: ${compatResult.errors.join('; ')}`);
  }

  // 5. Calcular explosión de insumos e instrucciones de fabricación
  const { supplies, instructions } = calculateRequiredSupplies({
    baseItems,
    quantity: formData.quantity,
    wastePercentage: bomRecord.waste_percentage || 0,
    configuration: itemConfig,
    options: optionsDefinitions
  });

  // 6. Validación estricta de capacidad para una sola hoja A4
  const a4Validation = validateSingleA4Capacity({
    supplies,
    instructions,
    configuration: itemConfig,
    notes: formData.notes
  });

  if (!a4Validation.fitsInSingleA4) {
    throw new Error(a4Validation.reason || "El contenido excede los límites de una única hoja A4.");
  }

  return { orderItem, bomRecord, supplies, instructions, itemConfig };
}

export async function issueManufacturingOrderAction(formData: {
  orderId: string; orderItemId: string; quantity: number; bomId?: string | null;
  notes?: string | null; idempotencyKey?: string | null;
  additionalItems?: { orderItemId: string; quantity: number; bomId: string }[];
}) {
  const ctx = await requireAdministrationUser();
  const db = createSupabaseAdminClient();
  const requested = [{orderItemId:formData.orderItemId,quantity:formData.quantity,bomId:formData.bomId}, ...(formData.additionalItems || [])];
  if (new Set(requested.map(item => item.orderItemId)).size !== requested.length) throw new Error("No se puede incluir dos veces el mismo renglón.");
  const prepared = [];
  for (const line of requested) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) throw new Error("Cantidad a fabricar inválida.");
    const result = await prepareManufacturingLine({...formData,...line});
    if (result.orderItem.order_id !== formData.orderId) throw new Error("El adicional no pertenece al pedido.");
    prepared.push(result);
  }
  const primary = prepared[0];
  const lines = prepared.map((result,index) => ({order_item_id:result.orderItem.id,quantity:requested[index].quantity,bom_id:result.bomRecord.id,product_name:result.orderItem.product_name,variant_name:result.orderItem.variant_name,configuration:result.itemConfig}));
  const consolidated = new Map<string, SupplyItem>();
  for (const result of prepared) for (const supply of result.supplies) {
    const key = JSON.stringify([supply.code,supply.unitOfMeasure,supply.notes || ""]);
    const previous = consolidated.get(key);
    consolidated.set(key,{...supply,quantity:(previous?.quantity || 0)+supply.quantity});
  }
  const supplies = [...consolidated.values()];
  const instructions = prepared.flatMap((result,index) => index === 0 ? result.instructions : [`Adicional: ${result.orderItem.product_name} × ${requested[index].quantity}`,...result.instructions]);
  const capacity = validateSingleA4Capacity({supplies,instructions,configuration:primary.itemConfig,notes:formData.notes});
  if (!capacity.fitsInSingleA4) throw new Error(capacity.reason);
  const hash = crypto.createHash("sha256").update(JSON.stringify({orderId:formData.orderId,lines,supplies,instructions,notes:formData.notes || null})).digest("hex");
  const {data,error} = await db.rpc("issue_manufacturing_group_transactional",{
    p_user_id:ctx.user!.id,p_order_id:formData.orderId,p_primary_item_id:formData.orderItemId,
    p_lines:lines,p_configuration:primary.itemConfig,p_instructions:instructions,p_supplies:supplies,
    p_notes:formData.notes || null,p_key:formData.idempotencyKey || crypto.randomUUID(),p_hash:hash
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function reviseManufacturingOrderAction(formData: {
  manufacturingOrderId: string;
  reason: string;
  notes?: string | null;
}) {
  const ctx = await requireAdministrationUser();
  const validated = ReviseManufacturingOrderInputSchema.parse(formData);
  const supabase = createSupabaseAdminClient();

  const currentOrder = await getManufacturingOrderById(validated.manufacturingOrderId);

  const { data, error } = await supabase.rpc("revise_manufacturing_order_transactional", {
    p_user_id: ctx.user!.id,
    p_manufacturing_order_id: validated.manufacturingOrderId,
    p_reason: validated.reason,
    p_new_configuration_snapshot: currentOrder.configuration_snapshot,
    p_new_instructions_snapshot: currentOrder.manufacturing_instructions_snapshot,
    p_new_supplies_snapshot: currentOrder.supplies_snapshot,
    p_notes: validated.notes?.trim() || null
  });

  if (error) {
    console.error("Error en revise_manufacturing_order_transactional:", error);
    throw new Error(error.message || "Error al registrar la revisión de la orden.");
  }

  return data;
}

export async function reviewOrderItemConfigurationAction(formData: {
  orderItemId: string;
  status: 'approved' | 'rejected' | 'pending_review';
  reviewNotes?: string;
  adjustedConfiguration?: Record<string, any>;
}) {
  const ctx = await requireAdministrationUser();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("review_order_item_configuration_transactional", {
    p_user_id: ctx.user!.id,
    p_order_item_id: formData.orderItemId,
    p_status: formData.status,
    p_review_notes: formData.reviewNotes?.trim() || null,
    p_adjusted_configuration: formData.adjustedConfiguration || null
  });

  if (error) {
    console.error("Error en review_order_item_configuration_transactional:", error);
    throw new Error(error.message || "Error al registrar la revisión de la configuración.");
  }

  return data;
}
