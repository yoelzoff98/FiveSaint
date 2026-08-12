import React, { forwardRef } from 'react';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  factory_notes: string | null;
}

interface Order {
  id: string;
  order_number: number;
  status: string;
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
  } | null;
  items: OrderItem[];
}

interface OrderPrintPdfProps {
  order: Order;
}

export const OrderPrintPdf = forwardRef<HTMLDivElement, OrderPrintPdfProps>(
  ({ order }, ref) => {
    const date = new Date(order.created_at);

    return (
      <div 
        ref={ref} 
        className="bg-white text-slate-800 font-sans p-[15mm] w-[210mm] min-h-[297mm] flex flex-col justify-between shadow-lg print:shadow-none print:p-[10mm] mx-auto box-border"
      >
        {/* Cabecera del Pedido */}
        <div>
          <div className="flex justify-between items-start border-b-2 border-green-700 pb-5 mb-6">
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
              <h1 className="text-lg font-black text-green-700 tracking-wider uppercase">
                Ficha de Pedido
              </h1>
              <div className="bg-stone-100 font-mono text-sm font-bold text-stone-800 py-1 px-3 rounded mt-2 border border-stone-200">
                N° FS-O-{order.order_number}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-2">
                Fecha de Confirmación: {date.toLocaleDateString("es-AR")}
              </div>
            </div>
          </div>

          {/* Bloque de Metadatos (Cliente y Vendedor) */}
          <div className="grid grid-cols-2 gap-6 bg-stone-50 border border-stone-200 p-4 rounded-lg text-xs leading-relaxed mb-6">
            <div>
              <span className="font-bold text-stone-500 uppercase tracking-widest text-[9px] block mb-2">
                Cliente Destinatario:
              </span>
              <p className="font-bold text-stone-900 text-sm mb-1">{order.clients?.name}</p>
              {order.clients?.company_name && (
                <p className="font-semibold text-stone-700 mb-0.5">{order.clients.company_name}</p>
              )}
              {order.clients?.email && <p className="text-stone-600 mb-0.5">{order.clients.email}</p>}
              {order.clients?.phone && <p className="text-stone-600 mb-0.5">Tel: {order.clients.phone}</p>}
              {order.clients?.address && (
                <p className="text-stone-500 mt-1 italic max-w-[280px]">
                  Dirección de Entrega: {order.clients.address}
                </p>
              )}
            </div>

            <div className="border-l border-stone-200 pl-6">
              <span className="font-bold text-stone-500 uppercase tracking-widest text-[9px] block mb-2">
                Vendedor Registrante:
              </span>
              <p className="font-bold text-stone-900 text-sm mb-1">
                {order.sellers?.full_name || "Five Saint (Administración)"}
              </p>
              
              <div className="bg-green-50 border border-green-200 p-2 rounded text-[10px] text-green-800 font-semibold inline-block mt-2">
                Ficha interna para seguimiento y producción de fábrica.
              </div>
            </div>
          </div>

          {/* Tabla de Productos sin precios */}
          <div className="border border-stone-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100 text-stone-600 border-b border-stone-200 font-bold uppercase text-[10px]">
                  <th className="px-4 py-2.5">Producto / Especificación</th>
                  <th className="px-4 py-2.5 text-right w-24">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-855">
                {order.items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-3 font-medium">
                      <div className="font-bold text-stone-900 text-sm">{item.product_name}</div>
                      {item.variant_name && (
                        <div className="text-[11px] text-slate-650 font-semibold mt-1">
                          Configuración: {item.variant_name}
                        </div>
                      )}
                      {item.factory_notes && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-900 font-medium">
                          <span className="font-bold block text-[10px] text-amber-700 uppercase tracking-wide">Aclaración Fábrica / Notas de Producción:</span>
                          {item.factory_notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-stone-900 text-sm">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notas / Observaciones de Fabricación / Logística */}
          {order.notes && (
            <div className="border border-stone-200 rounded-lg p-4 bg-stone-50/50 text-[11px] leading-relaxed">
              <span className="font-bold text-stone-600 uppercase tracking-wider block mb-1.5 text-[9px]">
                Notas de Fabricación & Logística:
              </span>
              <p className="text-stone-700 whitespace-pre-line font-normal text-xs">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer del A4 */}
        <div className="border-t border-stone-200 pt-4 text-center text-[10px] text-slate-400 font-medium">
          <p className="mb-1 leading-normal">
            Five Saint S.A. | Ficha de Producción y Logística de Fábrica.
          </p>
          <p className="text-[9px] text-slate-350">
            Todos los derechos reservados.
          </p>
        </div>
      </div>
    );
  }
);

OrderPrintPdf.displayName = 'OrderPrintPdf';
