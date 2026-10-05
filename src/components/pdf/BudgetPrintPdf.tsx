import React, { forwardRef } from 'react';
import { resolveIssuedBudgetTotals, formatCurrencyARS, type CommercialBreakdown } from '@/lib/commercial-calculations';

interface BudgetItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Budget {
  id: string;
  budget_number: number;
  status: string;
  total_amount: number;
  tax_rate?: number | null;
  calculation_snapshot?: Partial<CommercialBreakdown> | null;
  notes?: string | null;
  public_notes?: string | null;
  discounts: number[];
  created_at: string;
  creator_role?: string | null;
  created_by_user_id?: string | null;
  author_snapshot?: {
    user_id?: string;
    name?: string;
    role?: string;
    email?: string | null;
  } | null;
  client_snapshot?: {
    name: string;
    company_name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  clients?: {
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  seller_snapshot?: {
    name: string;
    full_name?: string;
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
  sellers?: {
    full_name: string;
    email: string;
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
  items: BudgetItem[];
}

interface BudgetPrintPdfProps {
  budget: Budget;
}

export const BudgetPrintPdf = forwardRef<HTMLDivElement, BudgetPrintPdfProps>(
  ({ budget }, ref) => {
    // Usar snapshot guardado si existe para preservar la emisión original
    const client = budget.client_snapshot || budget.clients;
    const seller = budget.seller_snapshot || budget.sellers;

    const breakdown = resolveIssuedBudgetTotals(budget);

    const date = new Date(budget.created_at);
    // Mostrar notas públicas para el cliente si existen
    const conditionsText = budget.public_notes ?? (budget.calculation_snapshot ? null : budget.notes);

    return (
      <div
        ref={ref}
        className="bg-white text-slate-800 font-sans p-4 sm:p-8 print:p-[10mm] w-full sm:w-[210mm] min-h-auto sm:min-h-[297mm] flex flex-col justify-between shadow-none sm:shadow-lg print:shadow-none mx-auto box-border"
      >
        {/* Cabecera del Presupuesto */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-accent-deep pb-4 sm:pb-5 mb-4 sm:mb-6 gap-4 sm:gap-0">
            <div className="flex flex-col">
              <img
                src="/LOGO.svg"
                alt="Five Saint Logo"
                className="h-12 sm:h-16 object-contain object-left mb-2"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Sistemas Hidroterapéuticos & Spas
              </span>
              <span className="text-[9px] text-slate-500 mt-1 leading-normal">
                Fábrica y Administración | Buenos Aires, Argentina<br />
                info@fivesaint.com | www.fivesaint.com
              </span>
            </div>

            <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto">
              <h1 className="text-base sm:text-lg font-black text-accent-deep tracking-wider uppercase">
                Presupuesto
              </h1>
              <div className="bg-stone-100 font-mono text-xs sm:text-sm font-bold text-stone-850 py-1 px-3 rounded mt-1 sm:mt-2 border border-stone-200 inline-block">
                N° FS-P-{budget.budget_number}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 sm:mt-2">
                Fecha de Emisión: {date.toLocaleDateString("es-AR")}
              </div>
            </div>
          </div>

          {/* Bloque de Metadatos (Cliente y Vendedor) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-stone-50 border border-stone-200 p-4 rounded-lg text-xs leading-relaxed mb-4 sm:mb-6">
            <div>
              <span className="font-bold text-stone-500 uppercase tracking-widest text-[9px] block mb-2">
                Presupuestado a:
              </span>
              <p className="font-bold text-stone-900 text-sm mb-1">{client?.name || "Cliente"}</p>
              {client?.company_name && (
                <p className="font-semibold text-stone-700 mb-0.5">{client.company_name}</p>
              )}
              {client?.email && <p className="text-stone-600 mb-0.5">{client.email}</p>}
              {client?.phone && <p className="text-stone-600 mb-0.5">Tel: {client.phone}</p>}
              {client?.address && (
                <p className="text-stone-500 mt-1 italic max-w-full sm:max-w-[280px]">
                  Dirección: {client.address}
                </p>
              )}
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-stone-200 pt-4 sm:pt-0 sm:pl-6">
              {budget.creator_role === "administration" || budget.creator_role === "admin" ? (
                <>
                  <span className="font-bold text-stone-500 uppercase tracking-widest text-[9px] block mb-2">
                    Asesor Comercial Asignado:
                  </span>
                  <p className="font-bold text-stone-900 text-sm mb-1">
                    {seller?.full_name || ("name" in (seller || {}) ? (seller as any).name : null) || "Sin asesor comercial asignado"}
                  </p>
                  {seller && (seller.whatsapp || (seller as any).phone) && (
                    <p className="text-stone-600 mb-1">
                      WhatsApp: {seller.whatsapp || (seller as any).phone}
                    </p>
                  )}

                  <div className="mt-2 pt-2 border-t border-stone-200">
                    <span className="font-bold text-stone-500 uppercase tracking-widest text-[9px] block mb-0.5">
                      Emitido por:
                    </span>
                    <p className="font-medium text-stone-800 text-xs">
                      {budget.author_snapshot?.name || (budget.creator_role === "admin" ? "Administración Central Five Saint" : "Portal de Administración Five Saint")}
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-2 rounded text-[10px] text-amber-800 font-semibold inline-block mt-2">
                    Validez de cotización: 7 días corridos.
                  </div>
                </>
              ) : (
                <>
                  <span className="font-bold text-stone-500 uppercase tracking-widest text-[9px] block mb-2">
                    Asesor Comercial:
                  </span>
                  <p className="font-bold text-stone-900 text-sm mb-1">
                    {seller?.full_name || ("name" in (seller || {}) ? budget.seller_snapshot?.name : null) || "Five Saint (Administración)"}
                  </p>
                  <p className="text-stone-600 mb-2">
                    WhatsApp: {seller?.whatsapp || seller?.phone || "+54 9 11 3816-1492"}
                  </p>

                  <div className="bg-amber-50 border border-amber-200 p-2 rounded text-[10px] text-amber-800 font-semibold inline-block mt-1">
                    Validez de cotización: 7 días corridos.
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="border border-stone-200 rounded-lg overflow-x-auto mb-4 sm:mb-6">
            <table className="w-full text-left border-collapse text-xs min-w-[500px] sm:min-w-0">
              <thead>
                <tr className="bg-stone-100 text-stone-600 border-b border-stone-200 font-bold uppercase text-[10px]">
                  <th className="px-3 sm:px-4 py-2.5">Producto / Configuración</th>
                  <th className="px-3 sm:px-4 py-2.5 text-right w-16 sm:w-20">Cant.</th>
                  <th className="px-3 sm:px-4 py-2.5 text-right w-28 sm:w-32">P. Unitario</th>
                  <th className="px-3 sm:px-4 py-2.5 text-right w-28 sm:w-36">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-850">
                {budget.items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-3 sm:px-4 py-3 font-medium">
                      <div className="font-bold text-stone-900">{item.product_name}</div>
                      {item.variant_name && (
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {item.variant_name}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right font-bold text-stone-900">{item.quantity}</td>
                    <td className="px-3 sm:px-4 py-3 text-right">{formatCurrencyARS(item.unit_price)}</td>
                    <td className="px-3 sm:px-4 py-3 text-right font-bold text-stone-950">
                      {formatCurrencyARS(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desglose Unificado de Totales e Impuestos */}
          <div className="flex justify-end sm:pr-2 mb-6 sm:mb-8">
            <div className="text-right bg-stone-50 border border-stone-200 p-4 rounded-lg w-full sm:w-auto min-w-full sm:min-w-[280px]">
              <div className="flex justify-between items-center text-[11px] font-bold text-stone-600 uppercase mb-1.5">
                <span>Subtotal Bruto:</span>
                <span>{formatCurrencyARS(breakdown.subtotal)}</span>
              </div>

              {budget.discounts && budget.discounts.length > 0 && (
                <div className="flex justify-between items-center text-[11px] font-bold text-green-700 uppercase mb-2 pb-2 border-b border-stone-200">
                  <span>Desc. ({budget.discounts.join("% + ")}%):</span>
                  <span>-{formatCurrencyARS(breakdown.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs font-bold text-stone-900 pt-1">
                <span>Subtotal Neto:</span>
                <span>{formatCurrencyARS(breakdown.netTotal)}</span>
              </div>

              {/* Impuesto IVA (21%) discriminado */}
              <div className="flex justify-between items-center text-[11px] font-semibold text-stone-600 mt-1 pb-2 border-b border-stone-200">
                <span>IVA ({breakdown.taxRate}%):</span>
                <span>+{formatCurrencyARS(breakdown.taxAmount)}</span>
              </div>

              <div className="mt-2.5 flex justify-between items-baseline">
                <span className="text-xs font-black text-stone-850 uppercase tracking-wider">
                  Total Final:
                </span>
                <span className="text-xl sm:text-2xl font-black text-accent-deep">
                  {formatCurrencyARS(breakdown.totalWithTax)}
                </span>
              </div>

              <span className="text-[9px] text-stone-400 block mt-2 uppercase font-medium">
                * Los precios no incluyen costo de flete ni descarga en obra
              </span>
            </div>
          </div>

          {/* Condiciones Comerciales Destinadas al Cliente */}
          {conditionsText && (
            <div className="border border-stone-200 rounded-lg p-4 bg-stone-50/50 text-[11px] leading-relaxed">
              <span className="font-bold text-stone-600 uppercase tracking-wider block mb-1.5 text-[9px]">
                Condiciones & Notas Comerciales:
              </span>
              <p className="text-stone-700 whitespace-pre-line font-normal">
                {conditionsText}
              </p>
            </div>
          )}
        </div>

        {/* Footer del A4 */}
        <div className="border-t border-stone-200 pt-4 text-center text-[10px] text-slate-400 font-medium">
          <p className="mb-1 leading-normal">
            Gracias por elegir Five Saint. Trabajamos para brindarte el máximo confort y calidad.
          </p>
          <p className="text-[9px] text-slate-350">
            Five Saint S.A. | Todos los derechos reservados.
          </p>
        </div>
      </div>
    );
  }
);

BudgetPrintPdf.displayName = 'BudgetPrintPdf';
