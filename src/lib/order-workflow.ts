export type WorkflowLine = {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  product_id: string | null;
  variant_id: string | null;
  configuration: Record<string, unknown>;
  factory_notes: string | null;
  unit_price?: number;
  total_price?: number;
};
export type WorkflowProduct = { id: string; name: string };
export type WorkflowVariant = WorkflowProduct & { product_id: string };
export type WorkflowRecipe = {
  id: string;
  name: string;
  product_id: string;
  variant_id: string | null;
  version: number;
};
export type WorkflowOption = {
  code: string;
  name: string;
  product_id: string | null;
  is_required: boolean;
  allowed_values: { value: string; label: string }[];
};
export type WorkflowData = {
  orderId?: string;
  requestId?: string;
  orderNumber?: number;
  budgetNumber?: number;
  clientName: string;
  sellerName: string;
  status: string;
  approval: string;
  total: number;
  notes: string | null;
  lines: WorkflowLine[];
  allLines?: WorkflowLine[];
  clientContact?: string;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  documents: { id: string; order_number: string }[];
  products: WorkflowProduct[];
  variants: WorkflowVariant[];
  recipes: WorkflowRecipe[];
  options: WorkflowOption[];
};

/** Shared wording; a commercial acceptance is independent of the production state. */
export function orderStatusLabel(order: {
  status: string;
  commercial_approval_status?: string;
  manufacturing_orders?: { status: string }[];
}) {
  if (order.status === "delivered") return "Entregado";
  if (order.status === "cancelled") return "Cancelado";
  if (order.status === "completed") return "Venta confirmada";
  if (order.commercial_approval_status === "pending")
    return "Pendiente de aceptación";
  if (
    order.commercial_approval_status === "approved" &&
    order.manufacturing_orders &&
    !order.manufacturing_orders.some((m) => m.status !== "cancelled")
  )
    return "Aceptado · en preparación";
  return order.status === "processing"
    ? "En fabricación"
    : "Aceptado · en preparación";
}

export function orderWorkflowStage(
  order: Parameters<typeof orderStatusLabel>[0],
) {
  if (["delivered", "cancelled", "completed"].includes(order.status))
    return order.status;
  if (order.commercial_approval_status === "pending") return "acceptance";
  if (orderStatusLabel(order) === "Aceptado · en preparación")
    return "preparation";
  return "production";
}

export function matchingRecipes(
  recipes: WorkflowRecipe[],
  productId: string,
  variantId: string | null,
) {
  const exact = recipes.filter(
    (r) =>
      r.product_id === productId &&
      (r.variant_id || null) === (variantId || null),
  );
  return exact.length
    ? exact
    : recipes.filter((r) => r.product_id === productId && !r.variant_id);
}
