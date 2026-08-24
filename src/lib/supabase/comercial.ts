"use server";

import { createSupabaseServerClient, createSupabaseAdminClient } from "./server";
import { getCurrentUser } from "./admin";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export interface CommercialUserContext {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isDistributor: boolean;
  sellerId?: string; // id from public.sellers table
  distributorId?: string; // id from public.distributors table
  discountPercentage?: number;
  user?: User;
  profileName?: string;
}

/**
 * Obtiene el contexto comercial del usuario logueado.
 * Determina si es administrador global, vendedor activo o distribuidor activo.
 */
export async function getCommercialUserContext(): Promise<CommercialUserContext> {
  const user = await getCurrentUser();
  if (!user) {
    return { isLoggedIn: false, isAdmin: false, isSeller: false, isDistributor: false };
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
      isDistributor: false,
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
      isDistributor: false,
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

  if (distributorUser && distributorUser.is_active) {
    return {
      isLoggedIn: true,
      isAdmin: false,
      isSeller: false,
      isDistributor: true,
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
    user,
  };
}

/**
 * Protege las páginas y redirecciona si el usuario no tiene permisos comerciales.
 */
export async function requireCommercialUser(): Promise<CommercialUserContext> {
  const ctx = await getCommercialUserContext();
  if (!ctx.isLoggedIn || (!ctx.isAdmin && !ctx.isSeller && !ctx.isDistributor)) {
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
// GESTION DE DISTRIBUIDORES (Solo Admin)
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
  const ctx = await getCommercialUserContext();
  if (!ctx.isAdmin && !(ctx.isDistributor && ctx.distributorId === id)) {
    throw new Error("No autorizado a ver este distribuidor");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("distributors")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error getDistributorById:", error);
    throw new Error("Distribuidor no encontrado");
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
    throw new Error("Error al actualizar estado del distribuidor");
  }
}

export async function updateDistributorDiscount(distributorId: string, discountPercentage: number) {
  const ctx = await getCommercialUserContext();
  if (!ctx.isAdmin) throw new Error("No autorizado");

  if (discountPercentage < 0 || discountPercentage > 100) {
    throw new Error("El porcentaje debe ser entre 0 y 100");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("distributors")
    .update({ discount_percentage: discountPercentage, updated_at: new Date().toISOString() })
    .eq("id", distributorId);

  if (error) {
    console.error("Error updateDistributorDiscount:", error);
    throw new Error("Error al actualizar el descuento del distribuidor");
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
  status?: string;
  source?: string;
  seller_id?: string;
}) {
  try {
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
        status: clientData.status || "nuevo",
        source: clientData.source || "manual"
      }])
      .select()
      .single();

    if (error) {
      console.error("Error createClient:", error);
      return { error: `DB Error: ${error.message} - ${error.details}` };
    }
    return { data };
  } catch (err: any) {
    console.error("Exception in createClient:", err);
    return { error: err.message || String(err) };
  }
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
    source?: string;
    seller_id?: string;
  }
) {
  const ctx = await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  try {
    // Validar propiedad si es vendedor
    if (ctx.isSeller) {
      const existing = await getClientById(id);
      if (existing.seller_id !== ctx.sellerId) {
        return { error: "No autorizado para editar este cliente" };
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
    source: clientData.source || "manual",
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
      return { error: `DB Error: ${error.message} - ${error.details}` };
    }
    return { data };
  } catch (err: any) {
    console.error("Exception in updateClient:", err);
    return { error: err.message || String(err) };
  }
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
  note_type?: string;
  budget_id?: string;
  order_id?: string;
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
      next_contact_date: noteData.next_contact_date || null,
      note_type: noteData.note_type || "manual",
      budget_id: noteData.budget_id || null,
      order_id: noteData.order_id || null
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
    throw new Error("No autorizado a ver este presupuesto");
  }
  if (ctx.isDistributor && budget.distributor_id !== ctx.distributorId) {
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
  notes?: string,
  discounts: number[] = []
) {
  const ctx = await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  const client = await getClientById(clientId);
  let totalAmount = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  // Aplicar descuentos en cascada
  if (discounts && discounts.length > 0) {
    discounts.forEach(discount => {
      if (discount > 0) {
        totalAmount = totalAmount * (1 - discount / 100);
      }
    });
  }

  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .insert([{
      client_id: clientId,
      seller_id: ctx.isSeller ? ctx.sellerId : client.seller_id,
      status: "draft",
      total_amount: totalAmount,
      notes: notes || null,
      discounts: discounts || []
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

  // Registrar nota automática de creación de presupuesto en el CRM
  try {
    const formattedAmount = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(totalAmount);

    await supabase
      .from("client_notes")
      .insert([{
        client_id: clientId,
        seller_id: ctx.isSeller ? ctx.sellerId : client.seller_id,
        content: `Se creó el presupuesto borrador N° ${budget.budget_number} por un monto total de ${formattedAmount}.`,
        contacted_at: new Date().toISOString(),
        note_type: "budget_created",
        budget_id: budget.id
      }]);
  } catch (noteErr) {
    console.error("Error al registrar nota automática de presupuesto:", noteErr);
  }

  return budget;
}

export async function updateBudgetStatus(id: string, status: string) {
  const ctx = await requireCommercialUser();
  const supabase = createSupabaseAdminClient();

  const budget = await getBudgetById(id);

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

  // Registrar en el CRM según el nuevo estado
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
  } else if (status === "converted") {
    noteType = "order_created";
    content = `El presupuesto N° ${budget.budget_number} fue CONVERTIDO a pedido de fábrica.`;
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

      // Cambiar automáticamente el estado del cliente en el CRM
      let newClientStatus = "";
      if (status === "sent") {
        newClientStatus = "presupuestado";
      } else if (status === "converted" || status === "accepted") {
        newClientStatus = "ganado";
      } else if (status === "rejected") {
        newClientStatus = "negociacion";
      }

      if (newClientStatus) {
        await supabase
          .from("clients")
          .update({ status: newClientStatus, updated_at: new Date().toISOString() })
          .eq("id", budget.client_id);
      }
    } catch (noteErr) {
      console.error("Error al registrar nota automática al actualizar presupuesto:", noteErr);
    }
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
    throw new Error("No autorizado a ver este pedido");
  }
  if (ctx.isDistributor && order.distributor_id !== ctx.distributorId) {
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
  const discounts = budget.discounts || [];

  // Aplicar los descuentos del presupuesto en cascada a cada ítem para obtener los valores finales del pedido
  const orderItemsToInsert = itemsToConvert.map(item => {
    let unitPrice = item.unitPrice;
    if (discounts && discounts.length > 0) {
      discounts.forEach((discount: number) => {
        if (discount > 0) {
          unitPrice = unitPrice * (1 - discount / 100);
        }
      });
    }
    // Redondear a 2 decimales
    unitPrice = Math.round(unitPrice * 100) / 100;
    const totalPrice = Math.round(item.quantity * unitPrice * 100) / 100;

    return {
      product_id: item.productId || null,
      variant_id: item.variantId || null,
      product_name: item.productName,
      variant_name: item.variantName || null,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      factory_notes: item.factoryNotes || null
    };
  });

  const totalAmount = orderItemsToInsert.reduce((acc, item) => acc + item.total_price, 0);

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

  // Asociar el order_id a cada ítem
  const orderItems = orderItemsToInsert.map(item => ({
    ...item,
    order_id: order.id
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Error convertBudgetToOrder - inserting items:", itemsError);
    await supabase.from("orders").delete().eq("id", order.id);
    throw new Error(`Error al guardar ítems del pedido: ${itemsError.message} - ${itemsError.details}`);
  }

  await supabase
    .from("budgets")
    .update({ status: "converted", updated_at: new Date().toISOString() })
    .eq("id", budgetId);

  // Registrar nota automática de pedido generado y cambiar estado del cliente a ganado en el CRM
  try {
    const formattedAmount = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(totalAmount);

    await supabase
      .from("client_notes")
      .insert([{
        client_id: budget.client_id,
        seller_id: budget.seller_id,
        content: `Se generó el pedido de fábrica N° ${order.order_number} desde el presupuesto N° ${budget.budget_number} por un monto total de ${formattedAmount}.`,
        contacted_at: new Date().toISOString(),
        note_type: "order_created",
        budget_id: budget.id,
        order_id: order.id
      }]);

    await supabase
      .from("clients")
      .update({ status: "ganado", updated_at: new Date().toISOString() })
      .eq("id", budget.client_id);
  } catch (noteErr) {
    console.error("Error al registrar notas automáticas en convertBudgetToOrder:", noteErr);
  }

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
      sellers(full_name, email, phone)
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
          contacted_at: new Date().toISOString(),
          note_type: "budget_viewed",
          budget_id: id
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

