"use server";

import crypto from "crypto";
import { cache } from "react";
import type { Budget as IssuedBudget } from "@/components/pdf/BudgetPrintPdf";
import { createSupabaseServerClient, createSupabaseAdminClient } from "./server";
import { getCurrentUser } from "./admin";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  calculateCommercialTotals,
  roundCurrency
} from "@/lib/commercial-calculations";
import {
  CreateBudgetInputSchema,
  ConvertBudgetInputSchema,
  CancelOrderInputSchema,
  isValidBudgetTransition,
  isValidOrderTransition
} from "@/lib/validations/commercial";

export interface CommercialUserContext {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isDistributor: boolean;
  isActive: boolean;
  sellerId?: string; // id from public.sellers table
  distributorId?: string; // id from public.distributors table
  discountPercentage?: number;
  user?: User;
  profileName?: string;
}

/**
 * Calcula un hash SHA-256 de cualquier payload para verificación estricta de idempotencia.
 */
function hashPayload(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Obtiene el contexto comercial del usuario autenticado.
 * Valida de forma estricta el estado activo (is_active === true) para cada rol.
 */
export async function getCommercialUserContext(): Promise<CommercialUserContext> {
  const user = await getCurrentUser();
  if (!user) {
    return { isLoggedIn: false, isAdmin: false, isSeller: false, isDistributor: false, isActive: false };
  }

  const supabase = await createSupabaseServerClient();

  // 1. Verificar si es admin
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
      isSeller: false,
      isDistributor: false,
      isActive,
      user,
      profileName: adminUser.full_name || "Administrador",
    };
  }

  // 2. Verificar si es vendedor
  const { data: sellerUser } = await supabase
    .from("sellers")
    .select("id, full_name, is_active")
    .eq("user_id", user.id)
    .single();

  if (sellerUser) {
    const isActive = Boolean(sellerUser.is_active);
    return {
      isLoggedIn: true,
      isAdmin: false,
      isSeller: isActive,
      isDistributor: false,
      isActive,
      sellerId: sellerUser.id,
      user,
      profileName: sellerUser.full_name,
    };
  }

  // 3. Verificar si es distribuidor
  const { data: distributorUser } = await supabase
    .from("distributors")
    .select("id, company_name, contact_name, discount_percentage, is_active")
    .eq("user_id", user.id)
    .single();

  if (distributorUser) {
    const isActive = Boolean(distributorUser.is_active);
    return {
      isLoggedIn: true,
      isAdmin: false,
      isSeller: false,
      isDistributor: isActive,
      isActive,
      distributorId: distributorUser.id,
      discountPercentage: Number(distributorUser.discount_percentage || 0),
      user,
      profileName: distributorUser.company_name || distributorUser.contact_name,
    };
  }

  return {
    isLoggedIn: true,
    isAdmin: false,
    isSeller: false,
    isDistributor: false,
    isActive: false,
    user,
  };
}

/**
 * Protege las páginas y acciones de servidor.
 * Deniega el acceso si el usuario no tiene rol activo.
 */
export async function requireCommercialUser(): Promise<CommercialUserContext> {
  const ctx = await getCommercialUserContext();
  if (!ctx.isLoggedIn || !ctx.isActive || (!ctx.isAdmin && !ctx.isSeller && !ctx.isDistributor)) {
    redirect("/admin-comercial/login");
  }
  return ctx;
}

// =========================================================================
// GESTION DE VENDEDORES (Solo Admin)
// =========================================================================

export async function getSellers() {
  const ctx = await getCommercialUserContext();
  if (!ctx.isAdmin) throw new Error("No autorizado");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error getSellers:", error);
    throw new Error("No se pudieron cargar los vendedores");
  }
  return data;
}

export async function createSeller(username: string, fullName: string, email: string, userId: string) {
  const ctx = await getCommercialUserContext();
  if (!ctx.isAdmin) throw new Error("No autorizado");

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sellers")
    .insert([{ username, full_name: fullName, email, user_id: userId, is_active: true }])
    .select()
    .single();

  if (error) {
    console.error("Error createSeller:", error);
    throw new Error("Error al crear el perfil de vendedor");
  }
  return data;
}

export async function toggleSellerActive(sellerId: string, isActive: boolean) {
  const ctx = await getCommercialUserContext();
  if (!ctx.isAdmin) throw new Error("No autorizado");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("sellers")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", sellerId);

  if (error) {
    console.error("Error toggleSellerActive:", error);
    throw new Error("Error al actualizar estado del vendedor");
  }
}

// =========================================================================
// GESTION DE DISTRIBUIDORES (Solo Admin y Consulta Propia)
// =========================================================================

export async function getDistributors() {
  const ctx = await getCommercialUserContext();
  if (!ctx.isAdmin) throw new Error("No autorizado");

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("distributors")
    .select("*")
    .order("company_name", { ascending: true });

  if (error) {
    console.error("Error getDistributors:", error);
    throw new Error("No se pudieron cargar los distribuidores");
  }
  return data;
}

export async function getDistributorById(id: string) {
  const ctx = await requireCommercialUser();
  if (!ctx.isAdmin && (!ctx.isDistributor || ctx.distributorId !== id)) {
    throw new Error("No autorizado para ver este distribuidor");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("distributors")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error getDistributorById:", error);
    throw new Error("No se encontró el distribuidor");
  }
  return data;
}

export async function toggleDistributorActive(distributorId: string, isActive: boolean) {
  const ctx = await getCommercialUserContext();
  if (!ctx.isAdmin) throw new Error("No autorizado");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("distributors")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", distributorId);

  if (error) {
    console.error("Error toggleDistributorActive:", error);
    throw new Error("Error al cambiar estado del distribuidor");
  }
}

export async function updateDistributorDiscount(distributorId: string, discountPercentage: number) {
  const ctx = await getCommercialUserContext();
  if (!ctx.isAdmin) throw new Error("No autorizado");

  if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
    throw new Error("Porcentaje de descuento inválido");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("distributors")
    .update({ discount_percentage: discountPercentage, updated_at: new Date().toISOString() })
    .eq("id", distributorId);

  if (error) {
    console.error("Error updateDistributorDiscount:", error);
    throw new Error("Error al actualizar descuento del distribuidor");
  }
}

// =========================================================================
// GESTION DE CLIENTES (CRM)
// =========================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getPaginatedClients(params: PaginationParams = {}): Promise<PaginatedResult<any>> {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (ctx.isDistributor) {
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  let query = supabase
    .from("clients")
    .select("id, name, company_name, email, phone, status, seller_id, created_at, updated_at, sellers(id, full_name)", { count: "exact" });

  if (ctx.isSeller && ctx.sellerId) {
    query = query.eq("seller_id", ctx.sellerId);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(`name.ilike.${term},company_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error getPaginatedClients:", error);
    throw new Error("No se pudieron cargar los clientes paginados");
  }

  const total = count || 0;
  return {
    data: data || [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getClients(): Promise<any[]> {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("clients").select(`
    *,
    sellers(full_name)
  `);

  if (ctx.isSeller && ctx.sellerId) {
    query = query.eq("seller_id", ctx.sellerId);
  } else if (ctx.isDistributor) {
    return [];
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("Error getClients:", error);
    throw new Error("No se pudieron cargar los clientes");
  }
  return data || [];
}

export async function getClientById(id: string) {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      sellers(full_name, email, phone)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error getClientById:", error);
    throw new Error("Cliente no encontrado");
  }

  if (ctx.isSeller && data.seller_id !== ctx.sellerId) {
    throw new Error("No autorizado para ver este cliente");
  }

  return data;
}

export async function createClient(clientData: {
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}) {
  const ctx = await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  if (!clientData.name || !clientData.name.trim()) {
    return { error: "El nombre del cliente es obligatorio" };
  }

  try {
    const { data, error } = await supabase
      .from("clients")
      .insert([{
        name: clientData.name.trim(),
        company_name: clientData.company_name?.trim() || null,
        email: clientData.email?.trim() || null,
        phone: clientData.phone?.trim() || null,
        address: clientData.address?.trim() || null,
        notes: clientData.notes?.trim() || null,
        seller_id: ctx.isSeller ? ctx.sellerId : null,
        status: "nuevo",
      }])
      .select()
      .single();

    if (error) {
      console.error("Error createClient:", error);
      return { error: `Error en base de datos: ${error.message}` };
    }
    return { data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Exception in createClient:", errorMsg);
    return { error: errorMsg };
  }
}

export async function updateClient(
  id: string,
  clientData: {
    name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    status?: string;
    seller_id?: string;
    source?: string;
  }
) {
  const ctx = await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  // Validar autorización previa
  await getClientById(id);

  try {
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (clientData.name !== undefined) updateFields.name = clientData.name.trim();
    if (clientData.company_name !== undefined) updateFields.company_name = clientData.company_name?.trim() || null;
    if (clientData.email !== undefined) updateFields.email = clientData.email?.trim() || null;
    if (clientData.phone !== undefined) updateFields.phone = clientData.phone?.trim() || null;
    if (clientData.address !== undefined) updateFields.address = clientData.address?.trim() || null;
    if (clientData.notes !== undefined) updateFields.notes = clientData.notes?.trim() || null;
    if (clientData.status !== undefined) updateFields.status = clientData.status;
    if (clientData.source !== undefined) updateFields.source = clientData.source;

    if (ctx.isAdmin && clientData.seller_id !== undefined) {
      updateFields.seller_id = clientData.seller_id || null;
    }

    const { data, error } = await supabase
      .from("clients")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updateClient:", error);
      return { error: `Error en base de datos: ${error.message}` };
    }
    return { data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Exception in updateClient:", errorMsg);
    return { error: errorMsg };
  }
}

// =========================================================================
// GESTION DE ANOTACIONES (HISTORIAL Y SEGUIMIENTO CRM)
// =========================================================================

export async function getClientNotes(clientId: string) {
  await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  await getClientById(clientId);

  const { data, error } = await supabase
    .from("client_notes")
    .select(`
      *,
      sellers(full_name)
    `)
    .eq("client_id", clientId)
    .order("contacted_at", { ascending: false });

  if (error) {
    console.error("Error getClientNotes:", error);
    throw new Error("No se pudieron cargar las anotaciones");
  }
  return data;
}

export async function createClientNote(noteData: {
  client_id: string;
  content: string;
  contacted_at: string;
  next_contact_date?: string;
  note_type?: string;
  budget_id?: string;
  order_id?: string;
}) {
  const ctx = await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  await getClientById(noteData.client_id);

  const { data, error } = await supabase
    .from("client_notes")
    .insert([{
      client_id: noteData.client_id,
      seller_id: ctx.isSeller ? ctx.sellerId : null,
      content: noteData.content.trim(),
      contacted_at: noteData.contacted_at,
      next_contact_date: noteData.next_contact_date || null,
      note_type: noteData.note_type || "manual",
      budget_id: noteData.budget_id || null,
      order_id: noteData.order_id || null
    }])
    .select()
    .single();

  if (error) {
    console.error("Error createClientNote:", error);
    throw new Error("Error al registrar la anotación");
  }
  return data;
}

// =========================================================================
// GESTION DE PRESUPUESTOS (BUDGETS)
// =========================================================================

export async function getPaginatedBudgets(params: PaginationParams = {}): Promise<PaginatedResult<any>> {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("budgets")
    .select(`
      id,
      budget_number,
      status,
      total_amount,
      discounts,
      created_at,
      client_id,
      seller_id,
      distributor_id,
      clients(id, name, company_name, status),
      sellers(id, full_name),
      distributors(id, company_name)
    `, { count: "exact" });

  if (ctx.isSeller && ctx.sellerId) {
    query = query.eq("seller_id", ctx.sellerId);
  } else if (ctx.isDistributor && ctx.distributorId) {
    query = query.eq("distributor_id", ctx.distributorId);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error getPaginatedBudgets:", error);
    throw new Error("No se pudieron cargar los presupuestos paginados");
  }

  const total = count || 0;
  return {
    data: data || [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getBudgets(): Promise<any[]> {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("budgets").select(`
    *,
    clients(name, company_name, status),
    sellers(full_name),
    distributors(company_name, contact_name)
  `);

  if (ctx.isSeller && ctx.sellerId) {
    query = query.eq("seller_id", ctx.sellerId);
  } else if (ctx.isDistributor && ctx.distributorId) {
    query = query.eq("distributor_id", ctx.distributorId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("Error getBudgets:", error);
    throw new Error("No se pudieron cargar los presupuestos");
  }
  return data || [];
}

export async function getBudgetById(id: string) {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .select(`
      *,
      clients(name, company_name, email, phone, address),
      sellers(full_name, email, phone),
      distributors(company_name, contact_name, discount_percentage)
    `)
    .eq("id", id)
    .single();

  if (budgetError || !budget) {
    console.error("Error getBudgetById:", budgetError);
    throw new Error("No se encontró el presupuesto");
  }

  if (ctx.isSeller && budget.seller_id !== ctx.sellerId) {
    throw new Error("No autorizado para ver este presupuesto");
  }
  if (ctx.isDistributor && budget.distributor_id !== ctx.distributorId) {
    throw new Error("No autorizado para ver este presupuesto");
  }

  const { data: items, error: itemsError } = await supabase
    .from("budget_items")
    .select("*")
    .eq("budget_id", id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("Error getBudgetItems:", itemsError);
    throw new Error("Error al obtener los ítems del presupuesto");
  }

  // 1. Obtener órdenes activas (no canceladas) asociadas a este presupuesto
  const { data: linkedOrders } = await supabase
    .from("orders")
    .select("id, status, order_number")
    .eq("budget_id", id)
    .neq("status", "cancelled");

  const orderIds = (linkedOrders || []).map(o => o.id);
  const orderItemsByBudgetItemId: Record<string, number> = {};

  if (orderIds.length > 0) {
    const { data: linkedOrderItems } = await supabase
      .from("order_items")
      .select("budget_item_id, quantity")
      .in("order_id", orderIds);

    (linkedOrderItems || []).forEach(oi => {
      if (oi.budget_item_id) {
        orderItemsByBudgetItemId[oi.budget_item_id] =
          (orderItemsByBudgetItemId[oi.budget_item_id] || 0) + (Number(oi.quantity) || 0);
      }
    });
  }

  // 2. Detección de casos históricos ambiguos que requieren conciliación manual
  const isHistoricalAmbiguous =
    budget.id === "7d53d595-a05b-4faf-8c16-bfa55c0a658e" || // Presupuesto #38
    Boolean(budget.is_historical_reconciliation_pending);

  // 3. Fuente de verdad unificada para saldos de ítems:
  // - Si el presupuesto ya está en 'converted', el saldo restante es 0.
  // - Si tiene converted_quantity registrado en BD, se toma el valor consolidado.
  // - De lo contrario, se calcula sumando los ítems de órdenes activas vinculadas por budget_item_id.
  const enrichedItems = (items || []).map(item => {
    let converted = 0;

    if (budget.status === "converted" || budget.status === "distributor_sale") {
      converted = item.quantity;
    } else if (item.converted_quantity !== undefined && item.converted_quantity !== null && item.converted_quantity > 0) {
      converted = item.converted_quantity;
    } else if (orderItemsByBudgetItemId[item.id] !== undefined) {
      converted = orderItemsByBudgetItemId[item.id];
    }

    const remaining = Math.max(0, item.quantity - converted);
    return {
      ...item,
      converted_quantity: converted,
      remaining_quantity: remaining
    };
  });

  return {
    ...budget,
    items: enrichedItems,
    is_historical_reconciliation_pending: isHistoricalAmbiguous
  };
}

export interface BudgetInputItem {
  productId?: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  isManual?: boolean;
  manualPriceReason?: string;
  manualPriceAuthorizedBy?: string;
}

/**
 * Crea un nuevo presupuesto utilizando transacciones reales en PostgreSQL o fallback defensivo.
 * Incorpora idempotencia por usuario y clave, snapshots inmutables y trazabilidad de ítems manuales.
 */
export async function createBudget(
  clientId: string,
  items: BudgetInputItem[],
  notes?: string,
  discounts: number[] = [],
  options: {
    publicNotes?: string;
    idempotencyKey?: string;
  } = {}
) {
  const ctx = await requireCommercialUser();
  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Validar entrada mediante esquema estricto Zod
  const validation = CreateBudgetInputSchema.safeParse({
    clientId,
    items,
    notes,
    publicNotes: options.publicNotes,
    discounts,
    idempotencyKey: options.idempotencyKey
  });

  if (!validation.success) {
    const errorMsg = validation.error.issues.map(i => i.message).join(", ");
    throw new Error(`Datos inválidos para crear presupuesto: ${errorMsg}`);
  }

  // 1.1 Validación en servidor de precios oficiales administrables
  const { verifyOfficialPrice } = await import("@/lib/catalog-service");
  for (const item of items) {
    if (!item.isManual) {
      const check = verifyOfficialPrice(item.productName, item.unitPrice, undefined, item.variantName);
      if (!check.isOfficial) {
        throw new Error(
          `Precio no autorizado para '${item.productName}': el valor ingresado ($${item.unitPrice}) difiere de la lista oficial vigente${check.officialPrice !== undefined ? ` ($${check.officialPrice})` : ""}. Si corresponde a una excepción comercial o medida especial, debe indicarse expresamente como ítem manual con su debido motivo.`
        );
      }
    } else {
      if (!item.manualPriceReason || item.manualPriceReason.trim().length < 3) {
        throw new Error(
          `El ítem manual '${item.productName}' requiere un motivo o justificación comercial válido de al menos 3 caracteres.`
        );
      }
    }
  }

  // 2. Obtener cliente y verificar permisos
  const client = await getClientById(clientId);

  // 3. Calcular importes con motor matemático unificado
  const totals = calculateCommercialTotals(
    items.map(it => ({ quantity: it.quantity, unitPrice: it.unitPrice })),
    discounts,
    21.00
  );

  // 4. Preparar snapshots completos del documento
  const clientSnapshot = {
    name: client.name,
    company_name: client.company_name || null,
    email: client.email || null,
    phone: client.phone || null,
    address: client.address || null
  };

  const sellerSnapshot = {
    name: ctx.profileName || "Asesor Comercial Five Saint",
    seller_id: ctx.isSeller ? ctx.sellerId : client.seller_id
  };

  const calculationSnapshot = {
    rules: "five_saint_standard_v2",
    subtotal: totals.subtotal,
    discounts,
    discountAmount: totals.discountAmount,
    netTotal: totals.netTotal,
    taxRate: totals.taxRate,
    taxAmount: totals.taxAmount,
    currency: "ARS",
    rounding: "bankers_2_decimals"
  };

  const effectiveSellerId = ctx.isSeller ? ctx.sellerId : client.seller_id;
  const requestPayload = {
    clientId,
    items,
    discounts,
    notes,
    publicNotes: options.publicNotes,
    totals
  };
  const requestHash = hashPayload(requestPayload);

  // 4.1 Recuperación temprana con comparación estricta de hash desde Server Actions
  if (options.idempotencyKey) {
    try {
      const { data: existingIdemp } = await supabaseAdmin
        .from("idempotency_records")
        .select("status, response_body, request_hash")
        .eq("user_id", ctx.user!.id)
        .eq("operation_type", "create_budget")
        .eq("idempotency_key", options.idempotencyKey)
        .maybeSingle();

      if (existingIdemp) {
        if (existingIdemp.request_hash && existingIdemp.request_hash !== requestHash) {
          throw new Error("Conflicto de idempotencia: clave ya enviada con payload diferente.");
        }

        if (existingIdemp.status === "completed" && existingIdemp.response_body) {
          const resp = existingIdemp.response_body as any;
          return {
            ...resp,
            id: resp.budget_id || resp.id,
            budget_id: resp.budget_id || resp.id,
          };
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("Conflicto de idempotencia")) {
        throw err;
      }
      // Continuar al flujo transaccional
    }
  }

  // 5. Intentar ejecución mediante función RPC transaccional de PostgreSQL
  try {
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("create_budget_transactional", {
      p_user_id: ctx.user!.id,
      p_client_id: clientId,
      p_items: items,
      p_discounts: discounts,
      p_notes: notes?.trim() || null,
      p_public_notes: options.publicNotes?.trim() || null,
      p_idempotency_key: options.idempotencyKey || null,
      p_request_hash: requestHash,
      p_client_snapshot: clientSnapshot,
      p_seller_snapshot: sellerSnapshot,
      p_calculation_snapshot: calculationSnapshot,
      p_seller_id: effectiveSellerId,
      p_total_amount: totals.netTotal,
      p_subtotal_amount: totals.subtotal,
      p_discount_amount: totals.discountAmount,
      p_tax_amount: totals.taxAmount,
      p_tax_rate: totals.taxRate
    });

    if (!rpcError && rpcResult && rpcResult.success) {
      return {
        ...rpcResult,
        id: rpcResult.budget_id || rpcResult.id,
        budget_id: rpcResult.budget_id || rpcResult.id,
      };
    }

    if (rpcError) {
      if (options.idempotencyKey) {
        const { data: winningRec } = await supabaseAdmin
          .from("idempotency_records")
          .select("status, response_body, request_hash, error_message")
          .eq("user_id", ctx.user!.id)
          .eq("operation_type", "create_budget")
          .eq("idempotency_key", options.idempotencyKey)
          .maybeSingle();

        if (winningRec) {
          if (winningRec.request_hash && winningRec.request_hash !== requestHash) {
            throw new Error("Conflicto de idempotencia: clave ya enviada con payload diferente.");
          }
          if (winningRec.status === "completed" && winningRec.response_body) {
            const resp = winningRec.response_body as any;
            return {
              ...resp,
              id: resp.budget_id || resp.id,
              budget_id: resp.budget_id || resp.id,
            };
          }
          if (winningRec.status === "failed") {
            throw new Error(`La operación previa con esta clave falló: ${winningRec.error_message || "Error desconocido"}`);
          }
        }
      }

      console.error("Error en create_budget_transactional:", rpcError);
      throw new Error(`Incompatibilidad o fallo en transacción PostgreSQL: ${rpcError.message}. No se ejecutaron escrituras parciales.`);
    }

    throw new Error("La transacción de creación no devolvió confirmación exitosa.");
  } catch (rpcErr: unknown) {
    if (rpcErr instanceof Error && rpcErr.message.includes("Conflicto de idempotencia")) {
      throw rpcErr;
    }
    if (options.idempotencyKey) {
      try {
        const { data: winningRec } = await supabaseAdmin
          .from("idempotency_records")
          .select("status, response_body, request_hash, error_message")
          .eq("user_id", ctx.user!.id)
          .eq("operation_type", "create_budget")
          .eq("idempotency_key", options.idempotencyKey)
          .maybeSingle();

        if (winningRec) {
          if (winningRec.request_hash && winningRec.request_hash !== requestHash) {
            throw new Error("Conflicto de idempotencia: clave ya enviada con payload diferente.");
          }
          if (winningRec.status === "completed" && winningRec.response_body) {
            const resp = winningRec.response_body as any;
            return {
              ...resp,
              id: resp.budget_id || resp.id,
              budget_id: resp.budget_id || resp.id,
            };
          }
        }
      } catch (recoveryErr) {
        if (recoveryErr instanceof Error && recoveryErr.message.includes("Conflicto de idempotencia")) {
          throw recoveryErr;
        }
      }
    }
    const msg = rpcErr instanceof Error ? rpcErr.message : String(rpcErr);
    throw new Error(`Error en creación transaccional: ${msg}`);
  }
}

/**
 * Actualiza el estado comercial de un presupuesto validando transiciones permitidas.
 */
export async function updateBudgetStatus(id: string, status: string, rejectionReason?: string) {
  const ctx = await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  const budget = await getBudgetById(id);

  if (!isValidBudgetTransition(budget.status, status)) {
    throw new Error(`Transición de estado no permitida: de '${budget.status}' a '${status}'`);
  }

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === "rejected" && rejectionReason !== undefined) {
    updatePayload.rejection_reason = rejectionReason.trim();
  }

  if (status === "sent") {
    updatePayload.sent_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("budgets")
    .update(updatePayload)
    .eq("id", id)
    .eq("status", budget.status)
    .select()
    .single();

  if (error) {
    console.error("Error updateBudgetStatus:", error);
    throw new Error("El presupuesto cambió mientras lo editabas. Recargá la página y volvé a intentar.");
  }

  let noteType = "system";
  let content = "";
  const formattedAmount = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(budget.total_amount);

  if (status === "sent") {
    noteType = "budget_sent";
    content = `El presupuesto N° ${budget.budget_number} (${formattedAmount}) fue marcado como ENVIADO al cliente.`;
  } else if (status === "accepted") {
    noteType = "budget_accepted";
    content = `El cliente ACEPTÓ el presupuesto N° ${budget.budget_number} (${formattedAmount}).`;
  } else if (status === "rejected") {
    noteType = "budget_rejected";
    content = `El presupuesto N° ${budget.budget_number} (${formattedAmount}) fue RECHAZADO.`;
    if (rejectionReason && rejectionReason.trim()) {
      content += ` Motivo del rechazo: ${rejectionReason.trim()}`;
    }
  }

  if (content) {
    try {
      await supabase
        .from("client_notes")
        .insert([{
          client_id: budget.client_id,
          seller_id: ctx.isSeller ? ctx.sellerId : budget.seller_id,
          content,
          contacted_at: new Date().toISOString(),
          note_type: noteType,
          budget_id: budget.id
        }]);

      let newClientStatus = "";
      if (status === "sent") newClientStatus = "presupuestado";
      else if (status === "accepted") newClientStatus = "ganado";
      else if (status === "rejected") newClientStatus = "negociacion";

      if (newClientStatus) {
        await supabase
          .from("clients")
          .update({ status: newClientStatus, updated_at: new Date().toISOString() })
          .eq("id", budget.client_id);
      }
    } catch (noteErr) {
      console.error("Error al actualizar estado en CRM:", noteErr);
    }
  }

  return data;
}

/**
 * Revoca el acceso público a un presupuesto.
 */
export async function revokeBudget(id: string) {
  const ctx = await requireCommercialUser();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("revoke_budget_transactional", {
    p_user_id: ctx.user!.id, p_budget_id: id,
  });
  if (error) throw new Error("No se pudo revocar el enlace del presupuesto");
  return data;
}

/**
 * Publica o restablece el acceso público a un presupuesto.
 */
export async function publishBudget(id: string) {
  const ctx = await requireCommercialUser();
  await getBudgetById(id);

  const supabase = createSupabaseAdminClient();
  const { data: rpcResult, error: rpcError } = await supabase.rpc("publish_budget_transactional", {
    p_user_id: ctx.user!.id,
    p_budget_id: id,
  });

  if (rpcError) {
    console.error("Error publish_budget_transactional:", rpcError);
    if (rpcError.code === "42883") {
      throw new Error("Incompatibilidad de base de datos: publish_budget_transactional no disponible en el esquema actual.");
    }
    throw new Error(`Error al publicar presupuesto: ${rpcError.message}`);
  }

  return rpcResult;
}

// =========================================================================
// GESTION DE PEDIDOS (ORDERS)
// =========================================================================

export async function getPaginatedOrders(params: PaginationParams & { saleChannel?: string } = {}): Promise<PaginatedResult<any>> {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      total_amount,
      created_at,
      client_id,
      seller_id,
      distributor_id,
      budget_id,
      sale_channel,
      order_type,
      clients(id, name, company_name, status),
      sellers(id, full_name),
      distributors(id, company_name)
    `, { count: "exact" });

  if (ctx.isSeller && ctx.sellerId) {
    query = query.eq("seller_id", ctx.sellerId);
  } else if (ctx.isDistributor && ctx.distributorId) {
    query = query.eq("distributor_id", ctx.distributorId);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.saleChannel && params.saleChannel !== "all") {
    query = query.eq("sale_channel", params.saleChannel);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error getPaginatedOrders:", error);
    throw new Error("No se pudieron cargar los pedidos paginados");
  }

  const total = count || 0;
  const formattedData = (data || []).map((order: any) => ({
    ...order,
    sale_channel: order.sale_channel || (order.distributor_id ? "distributor" : "direct"),
    order_type: order.order_type || "standard",
  }));

  return {
    data: formattedData,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getOrders(): Promise<any[]> {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("orders").select(`
    *,
    clients(id, name, company_name, status),
    sellers(full_name),
    distributors(company_name, contact_name)
  `);

  if (ctx.isSeller && ctx.sellerId) {
    query = query.eq("seller_id", ctx.sellerId);
  } else if (ctx.isDistributor && ctx.distributorId) {
    query = query.eq("distributor_id", ctx.distributorId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("Error getOrders:", error);
    throw new Error("No se pudieron cargar los pedidos");
  }
  return data || [];
}

export async function getOrderById(id: string) {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      *,
      clients(name, company_name, email, phone, address),
      sellers(full_name),
      distributors(company_name, contact_name)
    `)
    .eq("id", id)
    .single();

  if (orderError || !order) {
    console.error("Error getOrderById:", orderError);
    throw new Error("No se encontró el pedido");
  }

  if (ctx.isSeller && order.seller_id !== ctx.sellerId) {
    throw new Error("No autorizado para ver este pedido");
  }
  if (ctx.isDistributor && order.distributor_id !== ctx.distributorId) {
    throw new Error("No autorizado para ver este pedido");
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("Error getOrderItems:", itemsError);
    throw new Error("Error al obtener los ítems del pedido");
  }

  return { ...order, items };
}

/**
 * Actualiza el estado de un pedido garantizando que la cancelación use la vía transaccional única.
 */
export async function updateOrderStatus(id: string, status: string) {
  await requireCommercialUser();

  if (status === "cancelled") {
    return cancelOrder(id, "Cancelado desde control de producción");
  }

  const order = await getOrderById(id);
  if (!isValidOrderTransition(order.status, status)) {
    throw new Error(`Transición de estado de pedido no permitida: de '${order.status}' a '${status}'`);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", order.status)
    .select()
    .single();

  if (error) {
    console.error("Error updateOrderStatus:", error);
    throw new Error("El pedido cambió mientras lo editabas. Recargá la página y volvé a intentar.");
  }
  return data;
}

/**
 * Convierte un presupuesto (parcial o totalmente) a pedido de fábrica o venta por distribuidor.
 * - Ejecuta transacción real en PostgreSQL con bloqueo condicional FOR UPDATE.
 * - Idempotencia estricta por usuario y hash de payload.
 * - Actualiza atómicamente 'converted_quantity' por ítem mediante 'budget_item_id'.
 * - Rechaza cantidades no válidas, duplicados que excedan saldo y presupuestos históricos ambiguos.
 */
export async function convertBudgetToOrder(
  budgetId: string,
  itemsToConvert: {
    budgetItemId: string;
    quantity: number;
    factoryNotes?: string;
  }[],
  notes?: string,
  saleType: "direct" | "distributor" = "direct",
  options: { idempotencyKey?: string } = {}
) {
  const ctx = await requireCommercialUser();
  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Validar entrada mediante esquema estricto Zod
  const validation = ConvertBudgetInputSchema.safeParse({
    budgetId,
    itemsToConvert,
    notes,
    saleType,
    idempotencyKey: options.idempotencyKey
  });

  if (!validation.success) {
    const errorMsg = validation.error.issues.map(i => i.message).join(", ");
    throw new Error(`Solicitud de conversión inválida: ${errorMsg}`);
  }

  // 1.1 Si se provee clave de idempotencia, recuperar resultado previo y validar hash antes de verificar estados o saldos
  const requestHash = hashPayload({
    budgetId,
    itemsToConvert,
    saleType,
    notes
  });

  if (options.idempotencyKey) {
    try {
      const { data: existingIdemp } = await supabaseAdmin
        .from("idempotency_records")
        .select("status, response_body, request_hash")
        .eq("user_id", ctx.user!.id)
        .eq("operation_type", "convert_budget")
        .eq("idempotency_key", options.idempotencyKey)
        .maybeSingle();

      if (existingIdemp) {
        if (existingIdemp.request_hash && existingIdemp.request_hash !== requestHash) {
          throw new Error("Conflicto de idempotencia: misma clave con diferente contenido de conversión.");
        }

        if (existingIdemp.status === "completed" && existingIdemp.response_body) {
          const resp = existingIdemp.response_body as any;
          return {
            ...resp,
            id: resp.order_id || resp.id,
            order_id: resp.order_id || resp.id,
            order_number: resp.order_number,
          };
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("Conflicto de idempotencia")) {
        throw err;
      }
      // Continuar al flujo transaccional
    }
  }

  // 2. Pre-validación de presupuesto original
  const budget = await getBudgetById(budgetId);

  if (budget.is_historical_reconciliation_pending) {
    throw new Error(
      "Presupuesto histórico pendiente de conciliación (Presupuesto N° 38). No se permiten conversiones automáticas hasta su conciliación formal con la administración."
    );
  }

  if (budget.status === "rejected") {
    throw new Error("No se puede convertir un presupuesto que fue rechazado.");
  }

  if (budget.status === "converted" && saleType !== "distributor") {
    throw new Error("Este presupuesto ya ha sido convertido en su totalidad previamente.");
  }

  // 3. Pre-validación agregada de saldos por ítem en el request
  const budgetItemsMap = new Map<string, any>((budget.items || []).map((bi: any) => [bi.id, bi]));
  const aggregatedRequest: Record<string, number> = {};

  for (const item of itemsToConvert) {
    const bi: any = budgetItemsMap.get(item.budgetItemId);
    if (!bi) {
      throw new Error(`El ítem '${item.budgetItemId}' no pertenece al presupuesto N° ${budget.budget_number}.`);
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Cantidad inválida para '${bi.product_name}'. Debe ser un número entero positivo.`);
    }

    aggregatedRequest[item.budgetItemId] = (aggregatedRequest[item.budgetItemId] || 0) + item.quantity;
    const availableQty = bi.remaining_quantity !== undefined ? bi.remaining_quantity : bi.quantity;

    if (aggregatedRequest[item.budgetItemId] > availableQty) {
      throw new Error(
        `Saldo insuficiente para '${bi.product_name}'. Solicitado acumulado: ${aggregatedRequest[item.budgetItemId]}, Saldo disponible: ${availableQty}`
      );
    }
  }


  // 4. Intentar ejecución mediante función RPC transaccional en PostgreSQL
  try {
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("convert_budget_transactional", {
      p_user_id: ctx.user!.id,
      p_budget_id: budgetId,
      p_items_to_convert: itemsToConvert,
      p_sale_channel: saleType,
      p_notes: notes?.trim() || null,
      p_idempotency_key: options.idempotencyKey || null,
      p_request_hash: requestHash
    });

    if (!rpcError && rpcResult && rpcResult.success) {
      return {
        ...rpcResult,
        id: rpcResult.order_id || rpcResult.id,
        order_id: rpcResult.order_id || rpcResult.id,
        order_number: rpcResult.order_number,
      };
    }

    if (rpcError) {
      if (options.idempotencyKey) {
        const { data: winningRec } = await supabaseAdmin
          .from("idempotency_records")
          .select("status, response_body, request_hash, error_message")
          .eq("user_id", ctx.user!.id)
          .eq("operation_type", "convert_budget")
          .eq("idempotency_key", options.idempotencyKey)
          .maybeSingle();

        if (winningRec) {
          if (winningRec.request_hash && winningRec.request_hash !== requestHash) {
            throw new Error("Conflicto de idempotencia: misma clave con diferente contenido de conversión.");
          }
          if (winningRec.status === "completed" && winningRec.response_body) {
            const resp = winningRec.response_body as any;
            return {
              ...resp,
              id: resp.order_id || resp.id,
              order_id: resp.order_id || resp.id,
              order_number: resp.order_number,
            };
          }
          if (winningRec.status === "failed") {
            throw new Error(`La conversión previa con esta clave falló: ${winningRec.error_message || "Error desconocido"}`);
          }
        }
      }

      console.error("Error en convert_budget_transactional:", rpcError);
      throw new Error(`Incompatibilidad o fallo en transacción PostgreSQL: ${rpcError.message}. No se ejecutaron escrituras parciales.`);
    }

    throw new Error("La transacción de conversión no devolvió confirmación exitosa.");
  } catch (rpcErr: unknown) {
    if (rpcErr instanceof Error && rpcErr.message.includes("Conflicto de idempotencia")) {
      throw rpcErr;
    }
    if (options.idempotencyKey) {
      try {
        const { data: winningRec } = await supabaseAdmin
          .from("idempotency_records")
          .select("status, response_body, request_hash, error_message")
          .eq("user_id", ctx.user!.id)
          .eq("operation_type", "convert_budget")
          .eq("idempotency_key", options.idempotencyKey)
          .maybeSingle();

        if (winningRec) {
          if (winningRec.request_hash && winningRec.request_hash !== requestHash) {
            throw new Error("Conflicto de idempotencia: misma clave con diferente contenido de conversión.");
          }
          if (winningRec.status === "completed" && winningRec.response_body) {
            const resp = winningRec.response_body as any;
            return {
              ...resp,
              id: resp.order_id || resp.id,
              order_id: resp.order_id || resp.id,
              order_number: resp.order_number,
            };
          }
        }
      } catch (recoveryErr) {
        if (recoveryErr instanceof Error && recoveryErr.message.includes("Conflicto de idempotencia")) {
          throw recoveryErr;
        }
      }
    }
    const msg = rpcErr instanceof Error ? rpcErr.message : String(rpcErr);
    throw new Error(`Error en conversión transaccional: ${msg}`);
  }
}

/**
 * Cancela un pedido existente y restaura el saldo pendiente en el presupuesto asociado
 * de forma atómica y sin duplicaciones ante reintentos.
 */
export async function cancelOrder(orderId: string, reason?: string, options: { idempotencyKey?: string } = {}) {
  const ctx = await requireCommercialUser();
  const supabaseAdmin = createSupabaseAdminClient();

  const validation = CancelOrderInputSchema.safeParse({
    orderId,
    reason,
    idempotencyKey: options.idempotencyKey
  });

  if (!validation.success) {
    const errorMsg = validation.error.issues.map(i => i.message).join(", ");
    throw new Error(`Solicitud de cancelación inválida: ${errorMsg}`);
  }

  const requestHash = hashPayload({ orderId, reason });

  // 1.1 Si se provee clave de idempotencia, recuperar resultado previo y validar hash antes de rechazar por estado
  if (options.idempotencyKey) {
    try {
      const { data: existingIdemp } = await supabaseAdmin
        .from("idempotency_records")
        .select("status, response_body, request_hash")
        .eq("user_id", ctx.user!.id)
        .eq("operation_type", "cancel_order")
        .eq("idempotency_key", options.idempotencyKey)
        .maybeSingle();

      if (existingIdemp) {
        if (existingIdemp.request_hash && existingIdemp.request_hash !== requestHash) {
          throw new Error("Conflicto de idempotencia: misma clave con diferente contenido.");
        }

        if (existingIdemp.status === "completed" && existingIdemp.response_body) {
          return existingIdemp.response_body;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("Conflicto de idempotencia")) {
        throw err;
      }
      // Continuar al flujo transaccional
    }
  }

  const order = await getOrderById(orderId);

  if (order.status === "cancelled") {
    throw new Error("El pedido ya se encuentra cancelado.");
  }

  if (order.status === "delivered") {
    throw new Error("No se puede cancelar un pedido que ya fue entregado al cliente.");
  }


  // 1. Intentar ejecución transaccional en PostgreSQL
  try {
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("cancel_order_transactional", {
      p_user_id: ctx.user!.id,
      p_order_id: orderId,
      p_cancellation_reason: reason?.trim() || null,
      p_idempotency_key: options.idempotencyKey || null,
      p_request_hash: requestHash
    });

    if (!rpcError && rpcResult && rpcResult.success) {
      return {
        ...rpcResult,
        id: rpcResult.order_id || rpcResult.id,
        order_id: rpcResult.order_id || rpcResult.id,
      };
    }

    if (rpcError) {
      if (options.idempotencyKey) {
        const { data: winningRec } = await supabaseAdmin
          .from("idempotency_records")
          .select("status, response_body, request_hash, error_message")
          .eq("user_id", ctx.user!.id)
          .eq("operation_type", "cancel_order")
          .eq("idempotency_key", options.idempotencyKey)
          .maybeSingle();

        if (winningRec) {
          if (winningRec.request_hash && winningRec.request_hash !== requestHash) {
            throw new Error("Conflicto de idempotencia: misma clave con diferente contenido.");
          }
          if (winningRec.status === "completed" && winningRec.response_body) {
            return {
              ...winningRec.response_body,
              id: (winningRec.response_body as any).order_id || (winningRec.response_body as any).id,
              order_id: (winningRec.response_body as any).order_id || (winningRec.response_body as any).id,
            };
          }
          if (winningRec.status === "failed") {
            throw new Error(`La cancelación previa con esta clave falló: ${winningRec.error_message || "Error desconocido"}`);
          }
        }
      }

      console.error("Error en cancel_order_transactional:", rpcError);
      throw new Error(`Incompatibilidad o fallo en transacción PostgreSQL: ${rpcError.message}. No se ejecutaron escrituras parciales.`);
    }

    throw new Error("La transacción de cancelación no devolvió confirmación exitosa.");
  } catch (rpcErr: unknown) {
    if (rpcErr instanceof Error && rpcErr.message.includes("Conflicto de idempotencia")) {
      throw rpcErr;
    }
    if (options.idempotencyKey) {
      try {
        const { data: winningRec } = await supabaseAdmin
          .from("idempotency_records")
          .select("status, response_body, request_hash, error_message")
          .eq("user_id", ctx.user!.id)
          .eq("operation_type", "cancel_order")
          .eq("idempotency_key", options.idempotencyKey)
          .maybeSingle();

        if (winningRec) {
          if (winningRec.request_hash && winningRec.request_hash !== requestHash) {
            throw new Error("Conflicto de idempotencia: misma clave con diferente contenido.");
          }
          if (winningRec.status === "completed" && winningRec.response_body) {
            return {
              ...winningRec.response_body,
              id: (winningRec.response_body as any).order_id || (winningRec.response_body as any).id,
              order_id: (winningRec.response_body as any).order_id || (winningRec.response_body as any).id,
            };
          }
        }
      } catch (recoveryErr) {
        if (recoveryErr instanceof Error && recoveryErr.message.includes("Conflicto de idempotencia")) {
          throw recoveryErr;
        }
      }
    }
    const msg = rpcErr instanceof Error ? rpcErr.message : String(rpcErr);
    throw new Error(`Error en cancelación transaccional: ${msg}`);
  }
}

// =========================================================================
// ACCESO PUBLICO A PRESUPUESTOS (VISTA DIGITAL)
// =========================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Obtiene un presupuesto para consulta pública digital.
 * - Impide enumeración por números correlativos. Solo acepta tokens no enumerables o UUIDs históricos.
 * - Verifica revocación y estados de borrador.
 * - Consume snapshots inmutables del documento original.
 */
const loadPublicBudget = cache(async (identifier: string): Promise<IssuedBudget> => {
  if (!UUID_REGEX.test(identifier)) throw new Error("Enlace no disponible");
  const admin = createSupabaseAdminClient();
  // No historical links existed: internal IDs are never accepted as public tokens.
  // Fail closed if publication columns or the published token are unavailable.
  const { data: budget, error } = await admin.from("budgets").select(`
    id, budget_number, status, total_amount, tax_rate, discounts, created_at,
    public_notes, client_snapshot, seller_snapshot, calculation_snapshot,
    clients(name, company_name, address), sellers(full_name, email, phone)
  `).eq("public_token", identifier).eq("public_status", "published").maybeSingle();
  if (error || !budget) throw new Error("Enlace no disponible");
  const { data: items, error: itemsError } = await admin.from("budget_items")
    .select("id, product_name, variant_name, quantity, unit_price, total_price")
    .eq("budget_id", budget.id).order("created_at", { ascending: true });
  if (itemsError) throw new Error("No se pudieron cargar los ítems del presupuesto");
  return { ...budget, items: items || [] } as unknown as IssuedBudget;
});

export async function getPublicBudgetById(identifier: string): Promise<IssuedBudget> {
  return loadPublicBudget(identifier);
}

/**
 * Incrementa el contador de visitas de forma atómica mediante RPC.
 * Garantiza que las aperturas del enlace no modifiquen las fechas de seguimiento en el CRM.
 */
export async function incrementBudgetViewCount(token: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return null;
  const admin = createSupabaseAdminClient();
  const { data: budget, error } = await admin.from("budgets")
    .select("id").eq("public_token", token).eq("public_status", "published").maybeSingle();
  if (error || !budget) return null;
  const { data, error: rpcError } = await admin.rpc("increment_budget_view", { p_budget_id: budget.id });
  return rpcError ? null : data;
}

/**
 * Obtiene agregaciones y métricas comerciales livianas para el Dashboard
 * seleccionando exclusivamente las columnas de cálculo necesarias sin descargar
 * tablas completas, snapshots JSONB ni ítems.
 */
export async function getDashboardAggregations() {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  let budgetsQuery = supabase
    .from("budgets")
    .select("id, client_id, budget_number, status, total_amount, sale_channel, created_at, updated_at");

  let ordersQuery = supabase
    .from("orders")
    .select("id, client_id, order_number, status, total_amount, distributor_id, budget_id, sale_channel, order_type, created_at, updated_at");

  let clientsQuery = supabase
    .from("clients")
    .select("id, name, company_name, email, phone, status, created_at, updated_at");

  if (ctx.isSeller && ctx.sellerId) {
    budgetsQuery = budgetsQuery.eq("seller_id", ctx.sellerId);
    ordersQuery = ordersQuery.eq("seller_id", ctx.sellerId);
    clientsQuery = clientsQuery.eq("seller_id", ctx.sellerId);
  } else if (ctx.isDistributor && ctx.distributorId) {
    budgetsQuery = budgetsQuery.eq("distributor_id", ctx.distributorId);
    ordersQuery = ordersQuery.eq("distributor_id", ctx.distributorId);
    clientsQuery = clientsQuery.eq("id", "00000000-0000-0000-0000-000000000000"); // Distribuidores no ven clientes CRM
  }

  const [bRes, oRes, cRes] = await Promise.all([
    budgetsQuery.order("created_at", { ascending: false }),
    ordersQuery.order("created_at", { ascending: false }),
    clientsQuery.order("created_at", { ascending: false }),
  ]);

  if (bRes.error || oRes.error || cRes.error) {
    console.error("Error en getDashboardAggregations:", { bErr: bRes.error, oErr: oRes.error, cErr: cRes.error });
    throw new Error("No se pudieron cargar las agregaciones comerciales");
  }

  return {
    budgets: bRes.data || [],
    orders: (oRes.data || []).map((o: any) => ({
      ...o,
      sale_channel: o.sale_channel || (o.distributor_id ? "distributor" : "direct"),
      order_type: o.order_type || "standard",
    })),
    clients: cRes.data || [],
  };
}
