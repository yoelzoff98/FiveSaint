import { z } from "zod";

/**
 * Validaciones estrictas con Zod para el módulo de Administración y Fabricación.
 */

// 1. Reasignación de clientes
export const ReassignClientInputSchema = z.object({
  clientId: z.string().uuid("Identificador de cliente no válido"),
  newSellerId: z.string().uuid("Debe seleccionar un asesor comercial válido"),
  reason: z
    .string()
    .min(3, "El motivo de reasignación debe tener al menos 3 caracteres")
    .max(500, "El motivo no puede exceder los 500 caracteres")
    .trim(),
});

export type ValidatedReassignClientInput = z.infer<typeof ReassignClientInputSchema>;

// 2. Creación / Edición de Insumos
export const SupplyInputSchema = z.object({
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(50, "El código no puede superar los 50 caracteres")
    .regex(/^[A-Za-z0-9\-_. ]+$/, "El código solo puede contener letras, números, espacios, guiones y puntos")
    .trim(),
  name: z
    .string()
    .min(2, "El nombre del insumo debe tener al menos 2 caracteres")
    .max(200, "El nombre no puede exceder los 200 caracteres")
    .trim(),
  description: z.string().max(500).optional().nullable(),
  unitOfMeasure: z.enum(['un', 'm', 'kg', 'l', 'm2', 'm3', 'g', 'cm'], {
    message: "Unidad de medida no válida (permitidas: un, m, kg, l, m2, m3, g, cm)",
  }),
  isActive: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
});

export type ValidatedSupplyInput = z.infer<typeof SupplyInputSchema>;

// 3. Ítem de Composición
export const CompositionItemInputSchema = z.object({
  supplyId: z.string().uuid("Identificador de insumo inválido"),
  quantity: z
    .number({ message: "La cantidad debe ser un número" })
    .positive("La cantidad debe ser mayor a cero")
    .max(100000, "Cantidad excede el límite permitido"),
  notes: z.string().max(300).optional().nullable(),
});

export const CreateCompositionInputSchema = z.object({
  productId: z.string().uuid("Identificador de producto inválido"),
  variantId: z.string().uuid("Identificador de variante inválido").optional().nullable(),
  name: z
    .string()
    .min(3, "El nombre de la composición debe tener al menos 3 caracteres")
    .max(200)
    .trim(),
  technicalNotes: z.string().max(2000).optional().nullable(),
  wastePercentage: z
    .number()
    .min(0, "La merma no puede ser negativa")
    .max(100, "La merma no puede superar el 100%")
    .default(0),
  items: z
    .array(CompositionItemInputSchema)
    .min(1, "La composición debe incluir al menos un insumo"),
});

export type ValidatedCreateCompositionInput = z.infer<typeof CreateCompositionInputSchema>;

// 4. Opciones Configurables
export const AllowedOptionValueSchema = z.object({
  value: z.string().min(1).max(50).trim(),
  label: z.string().min(1).max(100).trim(),
});

export const MaterialsEffectSchema = z.object({
  ifValue: z.string().min(1).trim(),
  effects: z.array(z.object({
    action: z.enum(['add', 'replace', 'adjust']),
    supplyCode: z.string().min(1).trim(),
    supplyName: z.string().optional(),
    unitOfMeasure: z.string().optional(),
    quantity: z.number().positive(),
    targetSupplyCode: z.string().optional(),
  })),
});

export const ConfigurableOptionInputSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  code: z
    .string()
    .min(2, "El código de opción debe tener al menos 2 caracteres")
    .max(50)
    .regex(/^[a-z0-9_]+$/, "El código debe contener solo letras minúsculas, números y guiones bajos (ej: jets_count)")
    .trim(),
  name: z.string().min(2).max(150).trim(),
  description: z.string().max(500).optional().nullable(),
  isRequired: z.boolean().default(false),
  defaultValue: z.string().max(50).optional().nullable(),
  allowedValues: z.array(AllowedOptionValueSchema).min(1, "Debe definir al menos un valor permitido"),
  manufacturingInstructions: z.record(z.string(), z.string()).optional().default({}),
  compatibilityRules: z.array(z.any()).optional().default([]),
  materialsEffect: z.array(MaterialsEffectSchema).optional().default([]),
  changesMaterials: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type ValidatedConfigurableOptionInput = z.infer<typeof ConfigurableOptionInputSchema>;

// 5. Emisión de Orden de Fabricación
export const IssueManufacturingOrderInputSchema = z.object({
  orderId: z.string().uuid("Identificador de pedido inválido"),
  orderItemId: z.string().uuid("Identificador de ítem de pedido inválido"),
  quantity: z
    .number()
    .int("La cantidad a emitir debe ser entera")
    .positive("La cantidad debe ser mayor a cero")
    .max(1000, "Cantidad excede el límite operativo"),
  bomId: z.string().uuid("Identificador de composición inválido"),
  configurationSnapshot: z.record(z.string(), z.any()).default({}),
  notes: z.string().max(500, "Las observaciones no pueden exceder 500 caracteres").optional().nullable(),
  idempotencyKey: z.string().max(100).optional().nullable(),
});

export type ValidatedIssueManufacturingOrderInput = z.infer<typeof IssueManufacturingOrderInputSchema>;

// 6. Revisión de Orden Emitida
export const ReviseManufacturingOrderInputSchema = z.object({
  manufacturingOrderId: z.string().uuid("Identificador de orden inválido"),
  reason: z
    .string()
    .min(3, "Debe justificar la revisión con al menos 3 caracteres")
    .max(500)
    .trim(),
  notes: z.string().max(500).optional().nullable(),
  newConfigurationSnapshot: z.record(z.string(), z.any()).optional(),
  newInstructionsSnapshot: z.array(z.string()).optional(),
  newSuppliesSnapshot: z.array(z.any()).optional(),
});

export type ValidatedReviseManufacturingOrderInput = z.infer<typeof ReviseManufacturingOrderInputSchema>;

// 7. Detección de duplicados
export const CheckDuplicatesInputSchema = z.object({
  name: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  excludeId: z.string().uuid().optional().nullable(),
});

export type ValidatedCheckDuplicatesInput = z.infer<typeof CheckDuplicatesInputSchema>;
