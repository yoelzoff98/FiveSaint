import React, { forwardRef } from 'react';

interface BudgetItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Budget {
  id: string;
  budget_number: number;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  clients: {
    name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  sellers: {
    full_name: string;
    email: string;
  } | null;
  items: BudgetItem[];
}

interface BudgetPrintPdfProps {
  budget: Budget;
}

export const BudgetPrintPdf = forwardRef<HTMLDivElement, BudgetPrintPdfProps>(
  ({ budget }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(amount);
    };

    const date = new Date(budget.created_at);

    return (
      <div 
        ref={ref} 
        className="bg-white text-slate-800 font-sans p-[15mm] w-[210mm] min-h-[297mm] flex flex-col justify-between shadow-lg print:shadow-none print:p-[10mm] mx-auto box-border"
      >
        {/* Cabecera del Presupuesto */}
        <div>
          <div className="flex justify-between items-start border-b-2 border-accent-deep pb-5 mb-6">
            <div className="flex flex-col">
              <img 
                src="/LOGO.svg" 
                alt="Five Saint Logo" 
                className="h-16 object-contain object-left mb-2" 
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Sistemas Hidroterapéuticos & Spas
              </span>
              <span className="text-[9px] text-slate-500 mt-1 leading-normal">
                Fábrica y Administración | Buenos Aires, Argentina<br />
                info@fivesaint.com | www.fivesaint.com
              </span>
            </div>
            
            <div className="text-right flex flex-col items-end">
              <h1 className="text-lg font-black text-accent-deep tracking-wider uppercase">
                Presupuesto
              </h1>
              <div className="bg-stone-100 font-mono text-sm font-bold text-stone-800 py-1 px-3 rounded mt-2 border border-stone-200">
                N° FS-P-{budget.budget_number}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-2">
                Fecha: {date.toLocaleDateString("es-AR")}
              </div>
            </div>
          </div>

          {/* Bloque de Metadatos (Cliente y Vendedor) */}
          <div className="grid grid-cols-2 gap-6 bg-stone-50 border border-stone-200 p-4 rounded-lg text-xs leading-relaxed mb-6">
            <div>
              <span className="font-bold text-stone-500 uppercase tracking-widest text-[9px] block mb-2">
                Presupuestado a:
              </span>
              <p className="font-bold text-stone-900 text-sm mb-1">{budget.clients?.name}</p>
              {budget.clients?.company_name && (
                <p className="font-semibold text-stone-700 mb-0.5">{budget.clients.company_name}</p>
              )}
              {budget.clients?.email && <p className="text-stone-600 mb-0.5">{budget.clients.email}</p>}
              {budget.clients?.phone && <p className="text-stone-600 mb-0.5">Tel: {budget.clients.phone}</p>}
              {budget.clients?.address && (
                <p className="text-stone-500 mt-1 italic max-w-[280px]">
                  Dirección: {budget.clients.address}
                </p>
              )}
            </div>

            <div className="border-l border-stone-200 pl-6">
              <span className="font-bold text-stone-500 uppercase tracking-widest text-[9px] block mb-2">
                Asesor Comercial:
              </span>
              <p className="font-bold text-stone-900 text-sm mb-1">
                {budget.sellers?.full_name || "Five Saint (Administración)"}
              </p>
              {budget.sellers?.email && (
                <p className="text-stone-600 mb-2">{budget.sellers.email}</p>
              )}
              
              <div className="bg-amber-50 border border-amber-200 p-2 rounded text-[10px] text-amber-800 font-semibold inline-block mt-1">
                Validez de cotización: 15 días corridos.
              </div>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="border border-stone-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100 text-stone-600 border-b border-stone-200 font-bold uppercase text-[10px]">
                  <th className="px-4 py-2.5">Producto / Configuración</th>
                  <th className="px-4 py-2.5 text-right w-20">Cant.</th>
                  <th className="px-4 py-2.5 text-right w-32">P. Unitario</th>
                  <th className="px-4 py-2.5 text-right w-36">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-850">
                {budget.items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-3 font-medium">
                      <div className="font-bold text-stone-900">{item.product_name}</div>
                      {item.variant_name && (
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {item.variant_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-stone-900">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-bold text-stone-950">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total del Presupuesto */}
          <div className="flex justify-end pr-2 mb-8">
            <div className="text-right bg-stone-50 border border-stone-200 p-4 rounded-lg min-w-[220px]">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">
                Total Presupuestado
              </span>
              <span className="text-xl font-bold text-accent-deep mt-1 block">
                {formatCurrency(budget.total_amount)}
              </span>
              <span className="text-[9px] text-stone-400 block mt-1 uppercase">
                Los precios no incluyen IVA ni envío
              </span>
            </div>
          </div>

          {/* Notas / Observaciones Comerciales */}
          {budget.notes && (
            <div className="border border-stone-200 rounded-lg p-4 bg-stone-50/50 text-[11px] leading-relaxed">
              <span className="font-bold text-stone-600 uppercase tracking-wider block mb-1.5 text-[9px]">
                Condiciones & Notas Comerciales:
              </span>
              <p className="text-stone-700 whitespace-pre-line font-normal">
                {budget.notes}
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
