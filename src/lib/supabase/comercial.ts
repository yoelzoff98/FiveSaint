"use server";

import { createSupabaseServerClient, createSupabaseAdminClient } from "./server";
import { getCurrentUser } from "./admin";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export interface CommercialUserContext {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  sellerId?: string; // id from public.sellers table
  user?: User;
  profileName?: string;
}

/**
 * Obtiene el contexto comercial del usuario logueado.
 * Determina si es administrador global o vendedor activo.
 */
export async function getCommercialUserContext(): Promise<CommercialUserContext> {
  const user = await getCurrentUser();
  if (!user) {
    return { isLoggedIn: false, isAdmin: false, isSeller: false };
  }

  const supabase = await createSupabaseServerClient();

  // 1. Verificar si es admin
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id, full_name, is_active")
    .eq("user_id", user.id)
    .single();

  if (adminUser && adminUser.is_active) {
    return {
      isLoggedIn: true,
      isAdmin: true,
      isSeller: false,
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

  if (sellerUser && sellerUser.is_active) {
    return {
      isLoggedIn: true,
      isAdmin: false,
      isSeller: true,
      sellerId: sellerUser.id,
      user,
      profileName: sellerUser.full_name,
    };
  }

  return {
    isLoggedIn: true,
    isAdmin: false,
    isSeller: false,
    user,
  };
}

/**
 * Protege las páginas y redirecciona si el usuario no tiene permisos comerciales.
 */
export async function requireCommercialUser(): Promise<CommercialUserContext> {
  const ctx = await getCommercialUserContext();
  if (!ctx.isLoggedIn || (!ctx.isAdmin && !ctx.isSeller)) {
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
    .insert([{ username, full_name: fullName, email, user_id: userId }])
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
// GESTION DE CLIENTES
// =========================================================================

export async function getClients() {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("clients").select(`
    *,
    sellers(full_name)
  `);

  if (ctx.isSeller && ctx.sellerId) {
    query = query.eq("seller_id", ctx.sellerId);
  }

  const { data, error } = await query.order("name", { ascending: true });
  if (error) {
    console.error("Error getClients:", error);
    throw new Error("No se pudieron cargar los clientes");
  }
  return data;
}

export async function getClientById(id: string) {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      sellers(full_name)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error getClientById:", error);
    throw new Error("No se encontró el cliente");
  }

  // Restringir si es vendedor y no es su cliente
  if (ctx.isSeller && data.seller_id !== ctx.sellerId) {
    throw new Error("No autorizado a ver este cliente");
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
  seller_id?: string;
}) {
  const ctx = await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  // Si es vendedor, el cliente se le asigna automáticamente a sí mismo
  const sellerId = ctx.isSeller ? ctx.sellerId : clientData.seller_id;

  const { data, error } = await supabase
    .from("clients")
    .insert([{
      name: clientData.name,
      company_name: clientData.company_name || null,
      email: clientData.email || null,
      phone: clientData.phone || null,
      address: clientData.address || null,
      notes: clientData.notes || null,
      seller_id: sellerId || null,
      status: "active"
    }])
    .select()
    .single();

  if (error) {
    console.error("Error createClient:", error);
    throw new Error("Error al crear cliente");
  }
  return data;
}

export async function updateClient(
  id: string,
  clientData: {
    name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    status: string;
    seller_id?: string;
  }
) {
  const ctx = await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  // Validar propiedad si es vendedor
  if (ctx.isSeller) {
    const existing = await getClientById(id);
    if (existing.seller_id !== ctx.sellerId) {
      throw new Error("No autorizado para editar este cliente");
    }
  }

  const updateFields: Record<string, unknown> = {
    name: clientData.name,
    company_name: clientData.company_name || null,
    email: clientData.email || null,
    phone: clientData.phone || null,
    address: clientData.address || null,
    notes: clientData.notes || null,
    status: clientData.status,
    updated_at: new Date().toISOString()
  };

  // Solo el admin puede reasignar vendedores
  if (ctx.isAdmin && clientData.hasOwnProperty("seller_id")) {
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
    throw new Error("Error al actualizar cliente");
  }
  return data;
}

// =========================================================================
// GESTION DE ANOTACIONES (HISTORIAL DE SEGUIMIENTO)
// =========================================================================

export async function getClientNotes(clientId: string) {
  await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  // Validar acceso del cliente
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
}) {
  const ctx = await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  // Validar propiedad del cliente
  await getClientById(noteData.client_id);

  const { data, error } = await supabase
    .from("client_notes")
    .insert([{
      client_id: noteData.client_id,
      seller_id: ctx.isSeller ? ctx.sellerId : null,
      content: noteData.content,
      contacted_at: noteData.contacted_at,
      next_contact_date: noteData.next_contact_date || null
    }])
    .select()
    .single();

  if (error) {
    console.error("Error createClientNote:", error);
    throw new Error("Error al crear la anotación");
  }
  return data;
}

// =========================================================================
// GESTION DE PRESUPUESTOS (BUDGETS)
// =========================================================================

export async function getBudgets() {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("budgets").select(`
    *,
    clients(name, company_name),
    sellers(full_name)
  `);

  if (ctx.isSeller && ctx.sellerId) {
    query = query.eq("seller_id", ctx.sellerId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("Error getBudgets:", error);
    throw new Error("No se pudieron cargar los presupuestos");
  }
  return data;
}

export async function getBudgetById(id: string) {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .select(`
      *,
      clients(name, company_name, email, phone, address),
      sellers(full_name, email)
    `)
    .eq("id", id)
    .single();

  if (budgetError || !budget) {
    console.error("Error getBudgetById:", budgetError);
    throw new Error("No se encontró el presupuesto");
  }

  if (ctx.isSeller && budget.seller_id !== ctx.sellerId) {
    throw new Error("No autorizado a ver este presupuesto");
  }

  const { data: items, error: itemsError } = await supabase
    .from("budget_items")
    .select("*")
    .eq("budget_id", id);

  if (itemsError) {
    console.error("Error getBudgetItems:", itemsError);
    throw new Error("Error al obtener los ítems del presupuesto");
  }

  return { ...budget, items };
}

export interface BudgetInputItem {
  productId?: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
}

export async function createBudget(
  clientId: string,
  items: BudgetInputItem[],
  notes?: string
) {
  const ctx = await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  const client = await getClientById(clientId);
  const totalAmount = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .insert([{
      client_id: clientId,
      seller_id: ctx.isSeller ? ctx.sellerId : client.seller_id,
      status: "draft",
      total_amount: totalAmount,
      notes: notes || null
    }])
    .select()
    .single();

  if (budgetError || !budget) {
    console.error("Error createBudget:", budgetError);
    throw new Error("Error al crear presupuesto");
  }

  const budgetItems = items.map(item => ({
    budget_id: budget.id,
    product_id: item.productId || null,
    variant_id: item.variantId || null,
    product_name: item.productName,
    variant_name: item.variantName || null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.quantity * item.unitPrice
  }));

  const { error: itemsError } = await supabase
    .from("budget_items")
    .insert(budgetItems);

  if (itemsError) {
    console.error("Error inserting budget items:", itemsError);
    await supabase.from("budgets").delete().eq("id", budget.id);
    throw new Error("Error al guardar ítems del presupuesto");
  }

  return budget;
}

export async function updateBudgetStatus(id: string, status: string) {
  await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  await getBudgetById(id);

  const { data, error } = await supabase
    .from("budgets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updateBudgetStatus:", error);
    throw new Error("Error al actualizar estado del presupuesto");
  }
  return data;
}

// =========================================================================
// GESTION DE PEDIDOS (ORDERS)
// =========================================================================

export async function getOrders() {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("orders").select(`
    *,
    clients(name, company_name),
    sellers(full_name)
  `);

  if (ctx.isSeller && ctx.sellerId) {
    query = query.eq("seller_id", ctx.sellerId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("Error getOrders:", error);
    throw new Error("No se pudieron cargar los pedidos");
  }
  return data;
}

export async function getOrderById(id: string) {
  const ctx = await requireCommercialUser();
  const supabase = await createSupabaseServerClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      *,
      clients(name, company_name, email, phone, address),
      sellers(full_name)
    `)
    .eq("id", id)
    .single();

  if (orderError || !order) {
    console.error("Error getOrderById:", orderError);
    throw new Error("No se encontró el pedido");
  }

  if (ctx.isSeller && order.seller_id !== ctx.sellerId) {
    throw new Error("No autorizado a ver este pedido");
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  if (itemsError) {
    console.error("Error getOrderItems:", itemsError);
    throw new Error("Error al obtener los ítems del pedido");
  }

  return { ...order, items };
}

export async function updateOrderStatus(id: string, status: string) {
  await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  await getOrderById(id);

  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updateOrderStatus:", error);
    throw new Error("Error al actualizar estado del pedido");
  }
  return data;
}

/**
 * Convierte un presupuesto (parcial o totalmente) en un pedido.
 */
export async function convertBudgetToOrder(
  budgetId: string,
  itemsToConvert: {
    productId?: string;
    variantId?: string;
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    factoryNotes?: string;
  }[],
  notes?: string
) {
  await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  const budget = await getBudgetById(budgetId);
  const totalAmount = itemsToConvert.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([{
      budget_id: budgetId,
      client_id: budget.client_id,
      seller_id: budget.seller_id,
      status: "pending",
      total_amount: totalAmount,
      notes: notes || `Pedido generado desde el presupuesto #${budget.budget_number}.`
    }])
    .select()
    .single();

  if (orderError || !order) {
    console.error("Error convertBudgetToOrder - creating order:", orderError);
    throw new Error("Error al crear el pedido");
  }

  const orderItems = itemsToConvert.map(item => ({
    order_id: order.id,
    product_id: item.productId || null,
    variant_id: item.variantId || null,
    product_name: item.productName,
    variant_name: item.variantName || null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.quantity * item.unitPrice,
    factory_notes: item.factoryNotes || null
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Error convertBudgetToOrder - inserting items:", itemsError);
    await supabase.from("orders").delete().eq("id", order.id);
    throw new Error("Error al guardar ítems del pedido");
  }

  await supabase
    .from("budgets")
    .update({ status: "converted", updated_at: new Date().toISOString() })
    .eq("id", budgetId);

  return order;
}

/**
 * Obtiene un presupuesto de forma pública utilizando su ID único (UUID seguro).
 * No requiere que el usuario sea administrador o vendedor.
 */
export async function getPublicBudgetById(id: string) {
  const supabase = createSupabaseAdminClient();

  const { data: budget, error } = await supabase
    .from("budgets")
    .select(`
      *,
      clients(name, company_name, email, phone, address),
      sellers(full_name, email)
    `)
    .eq("id", id)
    .single();

  if (error || !budget) {
    console.error("Error getPublicBudgetById:", error);
    throw new Error("Presupuesto no encontrado");
  }

  const { data: items, error: itemsError } = await supabase
    .from("budget_items")
    .select("*")
    .eq("budget_id", id);

  if (itemsError) {
    console.error("Error getPublicBudgetItems:", itemsError);
    throw new Error("Error al cargar los ítems del presupuesto");
  }

  return { ...budget, items };
}

/**
 * Incrementa el contador de visitas de un presupuesto, registra la fecha de primera vista
 * y añade una anotación de seguimiento automática en el CRM.
 */
export async function incrementBudgetViewCount(id: string) {
  try {
    const supabase = createSupabaseAdminClient();

    // 1. Obtener datos actuales del presupuesto
    const { data: current, error: getErr } = await supabase
      .from("budgets")
      .select("view_count, viewed_at, client_id, seller_id, budget_number")
      .eq("id", id)
      .single();

    if (getErr || !current) {
      console.error("Error al consultar vistas de presupuesto:", getErr);
      return null;
    }

    const nextCount = (current.view_count || 0) + 1;
    const firstViewedAt = current.viewed_at || new Date().toISOString();

    // 2. Actualizar analíticas del presupuesto
    const { data: updated, error: updateErr } = await supabase
      .from("budgets")
      .update({
        view_count: nextCount,
        viewed_at: firstViewedAt,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      console.error("Error al actualizar vistas de presupuesto:", updateErr);
      return null;
    }

    try {
      // 3. Registrar nota de seguimiento automática en el CRM
      await supabase
        .from("client_notes")
        .insert([{
          client_id: current.client_id,
          seller_id: current.seller_id,
          content: `El cliente visualizó el presupuesto online N° ${current.budget_number} (Visita #${nextCount}).`,
          contacted_at: new Date().toISOString()
        }]);
    } catch (noteErr) {
      console.error("Error al guardar nota automática de visualización:", noteErr);
    }

    return updated;
  } catch (err) {
    console.error("Error catastrófico en incrementBudgetViewCount:", err);
    return null;
  }
}

