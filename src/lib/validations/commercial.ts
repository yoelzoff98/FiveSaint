import { z } from "zod";

/**
 * Validaciones estrictas en servidor para el módulo comercial.
 */

// Ítem individual para presupuesto o pedido
export const BudgetItemInputSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  variantId: z.string().uuid().optional().nullable(),
  productName: z
    .string()
    .min(1, "El nombre del producto es obligatorio")
    .max(250, "El nombre del producto excede los 250 caracteres")
    .trim(),
  variantName: z
    .string()
    .max(250, "El nombre de la variante excede los 250 caracteres")
    .optional()
    .nullable(),
  quantity: z
    .number({ message: "La cantidad debe ser un número" })
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor a cero")
    .max(10000, "La cantidad excede el límite operativo permitido"),
  unitPrice: z
    .number({ message: "El precio unitario debe ser un número" })
    .finite("El precio unitario debe ser un valor finito")
    .nonnegative("El precio unitario no puede ser negativo")
    .max(1000000000, "El precio unitario excede el límite permitido"),
  isManual: z.boolean().optional().default(false),
  manualPriceReason: z.string().max(500, "El motivo no puede exceder 500 caracteres").optional().nullable(),
  manualPriceAuthorizedBy: z.string().max(200).optional().nullable(),
  factoryNotes: z.string().max(1000).optional().nullable()
}).refine(data => {
  if (data.isManual) {
    return Boolean(data.manualPriceReason && data.manualPriceReason.trim().length >= 3);
  }
  return true;
}, {
  message: "Los ítems con precio manual o excepcional requieren especificar un motivo explícito.",
  path: ["manualPriceReason"]
});

export type ValidatedBudgetItemInput = z.infer<typeof BudgetItemInputSchema>;

// Entrada completa para crear presupuesto
export const CreateBudgetInputSchema = z.object({
  clientId: z.string().uuid("El identificador del cliente no es válido"),
  items: z
    .array(BudgetItemInputSchema)
    .min(1, "El presupuesto debe incluir al menos un producto"),
  notes: z.string().max(2000, "Las notas internas no pueden exceder 2000 caracteres").optional().nullable(),
  publicNotes: z.string().max(2000, "Las notas para el cliente no pueden exceder 2000 caracteres").optional().nullable(),
  discounts: z
    .array(
      z.number().finite().min(0, "El descuento no puede ser negativo").max(100, "El descuento no puede superar el 100%")
    )
    .max(5, "No se permiten más de 5 niveles de descuento en cascada")
    .optional()
    .default([]),
  idempotencyKey: z.string().max(100).optional().nullable()
});

export type ValidatedCreateBudgetInput = z.infer<typeof CreateBudgetInputSchema>;

// Ítem seleccionado para conversión a pedido
export const ConvertBudgetItemSchema = z.object({
  budgetItemId: z.string().uuid("El identificador del ítem de presupuesto es obligatorio"),
  quantity: z
    .number({ message: "La cantidad debe ser numérica" })
    .finite("La cantidad debe ser un número finito")
    .int("La cantidad a convertir debe ser un número entero")
    .positive("La cantidad a convertir debe ser mayor a cero")
    .max(10000, "Cantidad excede el límite permitido"),
  factoryNotes: z.string().max(1000).optional().nullable()
});

export const ConvertBudgetInputSchema = z.object({
  budgetId: z.string().uuid("El identificador de presupuesto es inválido"),
  itemsToConvert: z
    .array(ConvertBudgetItemSchema)
    .min(1, "Debe seleccionar al menos un ítem para convertir"),
  notes: z.string().max(2000).optional().nullable(),
  saleType: z.enum(["direct", "distributor"]).default("direct"),
  distributorId: z.string().uuid("Identificador de distribuidor inválido").optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  distributorReference: z.string().max(200).optional().nullable(),
  idempotencyKey: z.string().max(100).optional().nullable()
}).refine((data) => {
  if (data.saleType === "distributor") {
    return Boolean(data.distributorId);
  }
  return true;
}, {
  message: "Debe seleccionar obligatoriamente un distribuidor para registrar la compra",
  path: ["distributorId"]
});

export type ValidatedConvertBudgetInput = z.infer<typeof ConvertBudgetInputSchema>;

// Esquema para registro de envío comercial
export const RecordShipmentInputSchema = z.object({
  budgetId: z.string().uuid("Identificador de presupuesto inválido"),
  medium: z.enum(["whatsapp", "digital_link", "email", "printed_pdf", "other"], {
    message: "Medio de envío no válido"
  }),
  sentAt: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
});

export type ValidatedRecordShipmentInput = z.infer<typeof RecordShipmentInputSchema>;

// Esquema para cancelación de pedido
export const CancelOrderInputSchema = z.object({
  orderId: z.string().uuid("El identificador de pedido es inválido"),
  reason: z.string().max(500, "El motivo no puede exceder 500 caracteres").optional().nullable(),
  idempotencyKey: z.string().max(100).optional().nullable()
});

export type ValidatedCancelOrderInput = z.infer<typeof CancelOrderInputSchema>;

// Transiciones de estado permitidas
export const VALID_BUDGET_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "accepted", "rejected", "converted", "distributor_sale", "partially_converted"],
  sent: ["accepted", "rejected", "converted", "distributor_sale", "partially_converted"],
  accepted: ["converted", "distributor_sale", "partially_converted", "rejected"],
  partially_converted: ["converted", "partially_converted", "rejected", "distributor_sale"],
  distributor_sale: [], // Estado final
  converted: [],        // Estado final
  rejected: ["draft", "sent"] // Permite reabrir a borrador o enviado para registrar venta
};

export function isValidBudgetTransition(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_BUDGET_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(nextStatus));
}

// Transiciones de pedidos
export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["delivered", "cancelled"],
  delivered: [], // Entregado es irreversible salvo intervención de superadmin
  completed: ["cancelled"], // Venta de distribuidor: permite reversión comercial.
  cancelled: []  // Cancelado es irreversible
};

export function isValidOrderTransition(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_ORDER_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(nextStatus));
}
