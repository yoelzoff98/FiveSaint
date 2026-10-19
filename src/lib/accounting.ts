export function accountingPeriod(value?: string) {
  const month =
    value ??
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
    })
      .format(new Date())
      .slice(0, 7);
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
    Number(month.slice(0, 4)) < 2000 ||
    Number(month.slice(0, 4)) > 2100
  )
    throw new Error("Período inválido");
  const [year, m] = month.split("-").map(Number);
  return {
    month,
    start: `${month}-01`,
    end: `${m === 12 ? year + 1 : year}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`,
  };
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export const fiscalDocumentLabels: Record<number, string> = {
  1: "Factura A",
  2: "Nota de débito A",
  3: "Nota de crédito A",
  6: "Factura B",
  7: "Nota de débito B",
  8: "Nota de crédito B",
  11: "Factura C",
  12: "Nota de débito C",
  13: "Nota de crédito C",
};

export interface AccountingSourceItem {
  id: string;
  product_name: string;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  factory_notes?: string | null;
  configuration?: Record<string, unknown>;
}
export interface AccountingSourceSnapshot {
  currency: string;
  document: {
    id: string;
    budget_number?: number;
    order_number?: number;
    total_amount: number;
    status: string;
    created_at: string;
    notes?: string | null;
    discounts?: number[];
    tax_amount?: number;
    subtotal_amount?: number;
    public_notes?: string | null;
    client_snapshot?: {
      name?: string;
      company_name?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
    } | null;
    seller_snapshot?: {
      name?: string;
      full_name?: string;
      phone?: string | null;
    } | null;
  };
  items: AccountingSourceItem[];
}
export function accountingMoney(value: unknown, currency: string) {
  return `${currency} ${Number(value ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
