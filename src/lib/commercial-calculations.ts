/**
 * Motor centralizado y unificado de cálculos comerciales para FiveSaint.
 * Garantiza que pantalla, datos guardados, vista pública y PDF coincidan al centavo.
 */

export interface CalculationItem {
  quantity: number;
  unitPrice: number;
}

/** Only pre-upgrade distributor sales without any order use the budget total. */
export function getUnlinkedLegacyDistributorBudgets<T extends { id: string; status: string }>(
  budgets: T[], orders: { budget_id?: string | null }[],
): T[] {
  const linked = new Set(orders.map(order => order.budget_id).filter(Boolean));
  return budgets.filter(budget => budget.status === 'distributor_sale' && !linked.has(budget.id));
}

/** Preserve issued amounts, including legacy budgets without a snapshot. */
export function resolveIssuedBudgetTotals(budget: {
  total_amount: number;
  tax_rate?: number | null;
  calculation_snapshot?: Partial<CommercialBreakdown> | null;
  items: { quantity: number; unit_price: number }[];
}) {
  const snapshot = budget.calculation_snapshot;
  const netTotal = Number(snapshot?.netTotal ?? budget.total_amount);
  const subtotal = Number(snapshot?.subtotal ?? budget.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0));
  const taxRate = Number(snapshot?.taxRate ?? budget.tax_rate ?? 21);
  const taxAmount = Number(snapshot?.taxAmount ?? roundCurrency(netTotal * taxRate / 100));
  return {
    subtotal,
    discountAmount: Number(snapshot?.discountAmount ?? Math.max(0, subtotal - netTotal)),
    netTotal, taxRate, taxAmount,
    totalWithTax: Number(snapshot?.totalWithTax ?? roundCurrency(netTotal + taxAmount)),
  };
}

export interface CommercialBreakdown {
  subtotal: number;        // Suma de (cantidad * precio unitario)
  discountPercentage: number; // Porcentaje de descuento total efectivo
  discountAmount: number;  // Monto total descontado
  netTotal: number;        // Total neto final (base imponible)
  taxRate: number;         // Tasa de IVA (ej. 21)
  taxAmount: number;       // Monto estimado de IVA
  totalWithTax: number;    // Total con IVA incluido
}

/**
 * Redondea un valor monetario a 2 decimales estándar.
 */
export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Aplica una lista de descuentos en cascada a un monto base.
 * Ejemplo: base 100 con descuentos [35, 10, 10]:
 * Paso 1: 100 * (1 - 0.35) = 65
 * Paso 2: 65 * (1 - 0.10) = 58.5
 * Paso 3: 58.5 * (1 - 0.10) = 52.65
 */
export function calculateCascadeDiscount(baseAmount: number, discounts: number[]): { finalAmount: number; discountAmount: number } {
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
    return { finalAmount: 0, discountAmount: 0 };
  }

  let current = baseAmount;
  const validDiscounts = (discounts || []).filter(d => Number.isFinite(d) && d > 0 && d <= 100);

  for (const d of validDiscounts) {
    current = current * (1 - d / 100);
  }

  const finalAmount = roundCurrency(current);
  const discountAmount = roundCurrency(baseAmount - finalAmount);

  return { finalAmount, discountAmount };
}

/**
 * Calcula el desglose comercial completo para una lista de ítems y descuentos.
 */
export function calculateCommercialTotals(
  items: CalculationItem[],
  discounts: number[] = [],
  taxRate: number = 21.00
): CommercialBreakdown {
  // 1. Calcular subtotal bruto sumando cada ítem redondeado
  const subtotal = roundCurrency(
    items.reduce((acc, item) => {
      const q = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0;
      const p = Number.isFinite(item.unitPrice) && item.unitPrice > 0 ? item.unitPrice : 0;
      return acc + (q * p);
    }, 0)
  );

  // 2. Aplicar descuentos en cascada
  const { finalAmount: netTotal, discountAmount } = calculateCascadeDiscount(subtotal, discounts);

  // 3. Porcentaje efectivo de descuento
  const discountPercentage = subtotal > 0 ? roundCurrency((discountAmount / subtotal) * 100) : 0;

  // 4. Calcular impuestos (IVA 21%) sobre la base imponible neta
  const validTaxRate = Number.isFinite(taxRate) && taxRate >= 0 ? taxRate : 21.00;
  const taxAmount = roundCurrency(netTotal * (validTaxRate / 100));
  const totalWithTax = roundCurrency(netTotal + taxAmount);

  return {
    subtotal,
    discountPercentage,
    discountAmount,
    netTotal,
    taxRate: validTaxRate,
    taxAmount,
    totalWithTax
  };
}

/**
 * Formatea un número como moneda argentina oficial (ARS).
 */
export function formatCurrencyARS(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(safeAmount);
}
