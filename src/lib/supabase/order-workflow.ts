"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdministrationUser } from "./administration";
import { createSupabaseAdminClient } from "./server";
import {
  calculateRequiredSupplies,
  validateOptionCompatibility,
  validateSingleA4Capacity,
  type SupplyItem,
} from "@/lib/manufacturing-calculations";
import { matchingRecipes, type WorkflowData } from "@/lib/order-workflow";
import { readAdministrationWorkflowCounts } from "@/lib/administration-workflow-counts";

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

const inputSchema = z
  .object({
    orderId: z.string().uuid().optional(),
    requestId: z.string().uuid().optional(),
    key: z.string().uuid(),
    primaryId: z.string().uuid(),
    notes: z.string().trim().max(350),
    lines: z
      .array(
        z.object({
          id: z.string().uuid(),
          productId: z.string().uuid(),
          variantId: z.string().uuid().nullable(),
          bomId: z.string().uuid(),
          quantity: z.number().int().positive().max(1000),
          configuration: z.record(z.string(), z.unknown()),
        }),
      )
      .min(1)
      .max(50),
  })
  .refine(
    (x) => Boolean(x.orderId) !== Boolean(x.requestId),
    "Indicá el pedido o la solicitud.",
  );

export async function getOrderWorkflow(input: {
  orderId?: string;
  requestId?: string;
}): Promise<WorkflowData> {
  await requireAdministrationUser();
  const db = createSupabaseAdminClient();
  let context: Omit<
    WorkflowData,
    "products" | "variants" | "recipes" | "options"
  >;
  if (input.requestId) {
    const { data: request, error } = await db
      .from("order_requests")
      .select("*,budgets(budget_number,clients(name,company_name,email,phone))")
      .eq("id", z.string().uuid().parse(input.requestId))
      .single();
    if (error || !request) throw new Error("No se encontró la solicitud.");
    if (request.status === "approved" && request.order_id)
      return getOrderWorkflow({ orderId: request.order_id });
    const snapshot = request.commercial_snapshot;
    context = {
      requestId: request.id,
      budgetNumber: request.budgets?.budget_number,
      clientName: request.budgets?.clients?.name || "Cliente",
      clientContact: [
        request.budgets?.clients?.company_name,
        request.budgets?.clients?.email,
        request.budgets?.clients?.phone,
      ]
        .filter(Boolean)
        .join(" · "),
      sellerName: request.submitted_by_name,
      status: request.status,
      approval: "pending",
      total: snapshot.total_amount,
      notes: request.notes,
      documents: [],
      lines: request.items.map(
        (line: {
          budgetItemId: string;
          quantity: number;
          factoryNotes?: string;
        }) => {
          const item = snapshot.items.find(
            (x: { id: string }) => x.id === line.budgetItemId,
          );
          if (!item)
            throw new Error("La solicitud contiene un artículo inválido.");
          return {
            ...item,
            quantity: line.quantity,
            factory_notes: line.factoryNotes || null,
            configuration: item.configuration || {},
          };
        },
      ),
    };
  } else {
    const { data: order, error } = await db
      .from("orders")
      .select(
        "id,order_number,status,commercial_approval_status,total_amount,notes,accepted_at,recorded_by_name,clients(name,company_name,email,phone),sellers(full_name),sale_channel,budgets(budget_number)",
      )
      .eq("id", z.string().uuid().parse(input.orderId))
      .single();
    if (error || !order) throw new Error("No se encontró el pedido.");
    if (order.sale_channel !== "direct")
      throw new Error("Las ventas por distribuidor no se envían a fábrica.");
    const [items, docs] = await Promise.all([
      db
        .from("order_items")
        .select(
          "id,product_name,variant_name,quantity,unit_price,total_price,product_id,variant_id,configuration,factory_notes,manufacturing_issued_quantity",
        )
        .eq("order_id", order.id)
        .order("created_at"),
      db
        .from("manufacturing_orders")
        .select("id,order_number")
        .eq("order_id", order.id)
        .neq("status", "cancelled")
        .order("issued_at", { ascending: false }),
    ]);
    if (items.error || docs.error)
      throw new Error("No se pudo cargar la preparación del pedido.");
    context = {
      orderId: order.id,
      orderNumber: order.order_number,
      budgetNumber: one(order.budgets)?.budget_number,
      clientName: one(order.clients)?.name || "Cliente",
      clientContact: [
        one(order.clients)?.company_name,
        one(order.clients)?.email,
        one(order.clients)?.phone,
      ]
        .filter(Boolean)
        .join(" · "),
      acceptedAt: order.accepted_at,
      acceptedBy: order.recorded_by_name,
      sellerName: one(order.sellers)?.full_name || "Administración",
      status: order.status,
      approval: order.commercial_approval_status,
      total: order.total_amount,
      notes: order.notes,
      documents: docs.data || [],
      allLines: (items.data || []).map((x) => ({
        ...x,
        configuration: x.configuration || {},
      })),
      lines: (items.data || [])
        .filter((x) => x.quantity > (x.manufacturing_issued_quantity || 0))
        .map((x) => ({
          ...x,
          quantity: x.quantity - (x.manufacturing_issued_quantity || 0),
          configuration: x.configuration || {},
        })),
    };
  }
  const [products, variants, recipes, options] = await Promise.all([
    db.from("products").select("id,name").eq("is_active", true).order("name"),
    db
      .from("product_variants")
      .select("id,name,product_id")
      .eq("is_active", true)
      .order("name"),
    db
      .from("product_compositions")
      .select("id,name,product_id,variant_id,version,status,technical_notes")
      .in("status", ["published", "draft"]),
    db
      .from("configurable_options")
      .select("code,name,product_id,is_required,allowed_values")
      .eq("is_active", true)
      .order("sort_order"),
  ]);
  if ([products, variants, recipes, options].some((r) => r.error))
    throw new Error("No se pudo cargar la información técnica.");
  return {
    ...context,
    products: products.data || [],
    variants: variants.data || [],
    recipes: recipes.data || [],
    options: options.data || [],
  };
}

export async function emitOrderFromWorkspace(raw: z.input<typeof inputSchema>) {
  const actor = await requireAdministrationUser();
  const input = inputSchema.parse(raw);
  const db = createSupabaseAdminClient();
  const payloadHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  // A lost response must remain retryable even after the available balance becomes zero.
  const previous = await db
    .from("idempotency_records")
    .select("request_hash,status,response_body")
    .eq("user_id", actor.user!.id)
    .eq("operation_type", "prepare_and_issue")
    .eq("idempotency_key", input.key)
    .maybeSingle();
  if (previous.error)
    throw new Error("No se pudo verificar el reintento de emisión.");
  if (previous.data) {
    if (previous.data.request_hash !== payloadHash)
      throw new Error("Conflicto de idempotencia.");
    if (previous.data.status === "completed")
      return previous.data.response_body;
  }
  const workspace = await getOrderWorkflow(input);
  if (input.requestId && workspace.orderId)
    throw new Error(
      "La solicitud ya fue aceptada. Abrí el pedido para preparar su fabricación.",
    );
  if (
    workspace.requestId
      ? workspace.status !== "pending"
      : !["pending", "processing"].includes(workspace.status)
  )
    throw new Error("Este pedido ya no admite fabricación.");
  if (
    workspace.lines.length !== input.lines.length ||
    new Set(input.lines.map((l) => l.id)).size !== input.lines.length
  )
    throw new Error("Incluí todos los renglones pendientes una sola vez.");
  const [recipes, options] = await Promise.all([
    db
      .from("product_compositions")
      .select(
        "*,items:composition_items(supply_id,quantity,notes,supplies(id,code,name,unit_of_measure,is_active))",
      )
      .in(
        "id",
        input.lines.map((l) => l.bomId),
      )
      .eq("status", "published"),
    db
      .from("configurable_options")
      .select("*")
      .eq("is_active", true)
      .or(
        `product_id.is.null,product_id.in.(${[...new Set(input.lines.map((l) => l.productId))].join(",")})`,
      ),
  ]);
  if (recipes.error || options.error)
    throw new Error("No se pudieron validar las recetas y opciones.");
  const supplies = new Map<string, SupplyItem>();
  const instructions: string[] = [];
  const lines = input.lines.map((line) => {
    const source = workspace.lines.find((x) => x.id === line.id);
    if (!source || line.quantity > source.quantity)
      throw new Error("Las cantidades cambiaron. Recargá el pedido.");
    if (
      source.product_id &&
      (source.product_id !== line.productId ||
        source.variant_id !== line.variantId)
    )
      throw new Error(
        "No se puede cambiar un producto técnico ya identificado.",
      );
    const recipe = recipes.data?.find((r) => r.id === line.bomId);
    if (
      !recipe ||
      !matchingRecipes(workspace.recipes, line.productId, line.variantId).some(
        (r) => r.id === recipe.id,
      )
    )
      throw new Error(
        `Falta una receta compatible para ${source.product_name}.`,
      );
    if (
      !recipe.items.length ||
      recipe.items.some(
        (i: { supplies: { is_active: boolean } }) => !i.supplies?.is_active,
      )
    )
      throw new Error("La receta debe tener componentes activos.");
    const definitions = (options.data || [])
      .filter((o) => !o.product_id || o.product_id === line.productId)
      .map((o) => ({
        code: o.code,
        name: o.name,
        allowedValues: o.allowed_values || [],
        defaultValue: o.default_value,
        isRequired: o.is_required,
        manufacturingInstructions: o.manufacturing_instructions || {},
        compatibilityRules: o.compatibility_rules || [],
        materialsEffect: o.materials_effect || [],
        changesMaterials: o.changes_materials,
      }));
    if (
      Object.keys(line.configuration).some(
        (k) => !definitions.some((o) => o.code === k),
      )
    )
      throw new Error(
        "La configuración contiene opciones no definidas para el producto.",
      );
    const validation = validateOptionCompatibility(
      line.configuration,
      definitions,
    );
    if (!validation.valid) throw new Error(validation.errors.join(" "));
    const calculated = calculateRequiredSupplies({
      baseItems: recipe.items.map(
        (i: {
          supply_id: string;
          quantity: number;
          notes: string;
          supplies: { code: string; name: string; unit_of_measure: string };
        }) => ({
          supplyId: i.supply_id,
          code: i.supplies.code,
          name: i.supplies.name,
          unitOfMeasure: i.supplies.unit_of_measure,
          baseQuantity: i.quantity,
          notes: i.notes,
        }),
      ),
      quantity: line.quantity,
      wastePercentage: recipe.waste_percentage || 0,
      configuration: line.configuration,
      options: definitions,
    });
    if (line.id !== input.primaryId)
      instructions.push(`Adicional: ${source.product_name} × ${line.quantity}`);
    if (recipe.technical_notes) instructions.push(recipe.technical_notes);
    if (source.factory_notes) instructions.push(source.factory_notes);
    instructions.push(...calculated.instructions);
    for (const supply of calculated.supplies) {
      const key = JSON.stringify([
        supply.code,
        supply.unitOfMeasure,
        supply.notes || "",
      ]);
      supplies.set(key, {
        ...supply,
        quantity: supply.quantity + (supplies.get(key)?.quantity || 0),
      });
    }
    return {
      source_id: line.id,
      quantity: line.quantity,
      product_id: line.productId,
      variant_id: line.variantId,
      bom_id: line.bomId,
      recipe_updated_at: recipe.updated_at,
      configuration: line.configuration,
      expected_configuration: source.configuration,
      expected_product_id: source.product_id,
      expected_variant_id: source.variant_id,
    };
  });
  const primary = lines.find((l) => l.source_id === input.primaryId);
  if (!primary) throw new Error("Seleccioná el producto principal.");
  const capacity = validateSingleA4Capacity({
    supplies: [...supplies.values()],
    instructions,
    configuration: primary.configuration,
    notes: input.notes,
  });
  if (!capacity.fitsInSingleA4) throw new Error(capacity.reason);
  const { data, error } = await db.rpc("prepare_and_issue_order", {
    p_user_id: actor.user!.id,
    p_request_id: input.requestId || null,
    p_order_id: input.orderId || null,
    p_primary_source_id: input.primaryId,
    p_lines: lines,
    p_supplies: [...supplies.values()],
    p_instructions: instructions,
    p_notes: input.notes,
    p_key: input.key,
    p_hash: payloadHash,
  });
  if (error)
    throw new Error(
      error.message.includes("prepare_and_issue_order")
        ? "Falta aplicar la migración del flujo simplificado de fabricación."
        : error.message,
    );
  for (const route of [
    "/administracion",
    "/administracion/solicitudes",
    "/administracion/pedidos",
    "/administracion/fabricacion",
    "/admin-comercial/pedidos",
    "/admin-comercial/presupuestos",
  ])
    revalidatePath(route);
  revalidatePath(`/administracion/pedidos/${data.orderId}`);
  return data;
}

export async function getAdministrationWorkflowCounts(): Promise<{
  requests: number;
  preparation: number;
  production: number;
}> {
  await requireAdministrationUser();
  try {
    return await readAdministrationWorkflowCounts(createSupabaseAdminClient());
  } catch (error) {
    console.error("Error al calcular pendientes de Administración:", error);
    throw new Error(
      "No se pudieron calcular los pendientes de Administración.",
    );
  }
}
