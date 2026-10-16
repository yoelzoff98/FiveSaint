import React, { forwardRef } from 'react';
import { formatSupplyQuantity } from '@/lib/manufacturing-calculations';

export interface ManufacturingOrderPrintProps {
  order: {
    order_number: string;
    product_name: string;
    variant_name?: string | null;
    quantity: number;
    status: string;
    issued_at: string;
    issued_by_name: string;
    bom_version?: number;
    revision_number?: number;
    revision_reason?: string | null;
    notes?: string | null;
    configuration_snapshot?: Record<string, any>;
    manufacturing_instructions_snapshot?: string[];
    supplies_snapshot?: Array<{
      code: string;
      name: string;
      quantity: number;
      unitOfMeasure: string;
      notes?: string;
    }>;
    orders?: {
      order_number: number;
      created_at: string;
      clients?: {
        name: string;
        company_name?: string | null;
        phone?: string | null;
        address?: string | null;
      } | null;
      sellers?: {
        full_name: string;
      } | null;
    } | null;
  };
}

export const ManufacturingOrderPrintPdf = forwardRef<HTMLDivElement, ManufacturingOrderPrintProps>(
  ({ order }, ref) => {
    const issuedDate = new Date(order.issued_at);
    const supplies = order.supplies_snapshot || [];
    const instructions = order.manufacturing_instructions_snapshot || [];
    const config = order.configuration_snapshot || {};

    // Formatear configuración legible
    const configEntries = Object.entries(config).filter(
      ([k, v]) => v !== undefined && v !== null && v !== ''
    );

    return (
      <div
        ref={ref}
        id="manufacturing-order-a4-sheet"
        className="bg-white text-stone-900 font-sans p-[10mm] w-[210mm] h-[297mm] flex flex-col justify-between shadow-none print:shadow-none print:p-[10mm] print:m-0 mx-auto box-border select-text"
        style={{
          boxSizing: 'border-box',
          pageBreakInside: 'avoid',
          pageBreakAfter: 'auto'
        }}
      >
        {/* =========================================================================
            1. CABECERA: NÚMERO, FECHAS Y REFERENCIAS
           ========================================================================= */}
        <div className="border-b-2 border-stone-800 pb-3 mb-2 shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <img
                src="/LOGO.svg"
                alt="Five Saint Logo"
                className="h-10 object-contain object-left"
              />
              <div className="border-l border-stone-300 pl-3">
                <span className="text-[12px] font-black uppercase tracking-wider text-stone-900 block">
                  Planta de Fabricación FiveSaint
                </span>
                <span className="text-[9px] text-stone-500 block">
                  Sistemas Hidroterapéuticos & Spas | Control de Producción
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-stone-900 text-white font-mono text-xs font-bold px-2.5 py-1 rounded">
                <span>ORDEN: {order.order_number}</span>
                {order.revision_number && order.revision_number > 1 && (
                  <span className="bg-amber-500 text-stone-950 px-1 text-[10px] rounded font-black">
                    REV {order.revision_number}
                  </span>
                )}
              </div>
              <div className="text-[9.5px] text-stone-600 font-medium mt-1">
                Emisión: {issuedDate.toLocaleDateString("es-AR")} {issuedDate.toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Fila de Referencias Cruzadas */}
          <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-stone-200 text-[10px] bg-stone-50 p-2 rounded">
            <div>
              <span className="text-stone-500 font-bold uppercase text-[8.5px] block">Pedido Comercial:</span>
              <span className="font-bold text-stone-900">
                {order.orders?.order_number ? `FS-O-${order.orders.order_number}` : 'S/D'}
              </span>
            </div>
            <div>
              <span className="text-stone-500 font-bold uppercase text-[8.5px] block">Cliente Destino:</span>
              <span className="font-semibold text-stone-800 break-words block">
                {order.orders?.clients?.name || 'Cliente Particular'}
                {order.orders?.clients?.company_name ? ` (${order.orders.clients.company_name})` : ''}
              </span>
            </div>
            <div>
              <span className="text-stone-500 font-bold uppercase text-[8.5px] block">Asesor Comercial:</span>
              <span className="text-stone-700 break-words block">
                {order.orders?.sellers?.full_name || 'Venta Central'}
              </span>
            </div>
            <div>
              <span className="text-stone-500 font-bold uppercase text-[8.5px] block">Emitido Por:</span>
              <span className="text-stone-700 break-words block">
                {order.issued_by_name} (BOM v{order.bom_version || 1})
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. PRODUCTO Y CONFIGURACIÓN COMERCIAL CONFIRMADA
           ========================================================================= */}
        <div className="border border-stone-300 rounded p-2.5 mb-2 bg-stone-50/50 shrink-0">
          <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-stone-200">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-stone-500 block">
                Artículo a Fabricar:
              </span>
              <h2 className="text-sm font-black text-stone-900">
                {order.product_name}
                {order.variant_name ? ` — ${order.variant_name}` : ''}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider font-bold text-stone-500 block">
                Cantidad de Orden:
              </span>
              <span className="text-base font-black text-stone-900 font-mono">
                {order.quantity} {order.quantity === 1 ? 'UNIDAD' : 'UNIDADES'}
              </span>
            </div>
          </div>

          {/* Opciones Configuradas & Instrucciones */}
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <span className="font-bold text-stone-700 text-[9px] uppercase tracking-wider block mb-0.5">
                Configuración Homogénea Confirmada:
              </span>
              {configEntries.length === 0 ? (
                <span className="text-stone-500 italic text-[9.5px]">
                  Configuración estándar base de fábrica.
                </span>
              ) : (
                <ul className="space-y-0.5">
                  {configEntries.map(([key, value]) => (
                    <li key={key} className="grid grid-cols-[minmax(70px,0.7fr)_minmax(0,1.3fr)] gap-2 text-stone-800 border-b border-stone-100 py-0.5">
                      <span className="capitalize font-medium text-stone-600">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <strong className="font-bold uppercase text-stone-900 text-right break-words min-w-0">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-l border-stone-200 pl-3">
              <span className="font-bold text-stone-700 text-[9px] uppercase tracking-wider block mb-0.5">
                Instrucciones Técnicas de Montaje:
              </span>
              {instructions.length === 0 ? (
                <span className="text-stone-500 italic text-[9.5px]">
                  Seguir protocolo y diagrama estándar de ingeniería.
                </span>
              ) : (
                <ul className="list-disc list-inside space-y-0.5 text-stone-800 text-[9.5px]">
                  {instructions.map((inst, idx) => (
                    <li key={idx} className="leading-tight">{inst}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. TABLA DE INSUMOS Y MATERIALES CONSOLIDADOS
           ========================================================================= */}
        <div className="shrink-0 flex flex-col justify-start">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-stone-900">
              Requerimiento de Insumos y Componentes:
            </span>
            <span className="text-[9px] text-stone-500">
              Total ítems consolidados: {supplies.length} (Capacidad máx: 16)
            </span>
          </div>

          <table className="w-full text-left border-collapse border border-stone-300 text-[10px]">
            <thead>
              <tr className="bg-stone-800 text-white text-[9px] uppercase tracking-wider">
                <th className="py-0.5 px-2 w-24 border border-stone-700">Código</th>
                <th className="py-0.5 px-2 border border-stone-700">Descripción del Insumo</th>
                <th className="py-0.5 px-2 w-28 text-right border border-stone-700">Cantidad Total</th>
                <th className="py-0.5 px-2 w-16 text-center border border-stone-700">Unidad</th>
                <th className="py-0.5 px-2 w-20 text-center border border-stone-700">Verificado</th>
              </tr>
            </thead>
            <tbody>
              {supplies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-stone-400 italic">
                    Sin insumos explosivos en esta orden.
                  </td>
                </tr>
              ) : (
                supplies.map((s, idx) => (
                  <tr
                    key={s.code || idx}
                    className={`border-b border-stone-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/70'}`}
                  >
                    <td className="py-0.5 px-2 font-mono font-bold text-stone-800 text-[9.5px]">
                      {s.code}
                    </td>
                    <td className="py-0.5 px-2 text-stone-900 font-medium break-words">
                      {s.name}
                    </td>
                    <td className="py-0.5 px-2 text-right font-mono font-bold text-stone-900">
                      {typeof s.quantity === 'number'
                        ? formatSupplyQuantity(s.quantity, s.unitOfMeasure)
                        : s.quantity}
                    </td>
                    <td className="py-0.5 px-2 text-center font-semibold text-stone-600 uppercase text-[9px]">
                      {s.unitOfMeasure}
                    </td>
                    <td className="py-0.5 px-2 text-center text-stone-300 font-mono text-[9px]">
                      [  ]
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            4. OBSERVACIONES, CONTROL DE CALIDAD Y FIRMAS
           ========================================================================= */}
        <div className="border-t-2 border-stone-800 pt-2 shrink-0">
          {/* Observaciones */}
          <div className="mb-2 bg-stone-50 border border-stone-200 p-2 rounded text-[9.5px]">
            <span className="font-bold text-stone-700 uppercase tracking-wider block text-[8.5px] mb-0.5">
              Observaciones de Planta / Notas Especiales:
            </span>
            <p className="text-stone-800 leading-tight">
              {order.notes || "Fabricación conforme a normas técnicas internas FiveSaint. Sin observaciones adicionales."}
            </p>
          </div>

          {/* Grilla de Controles de Calidad y Firmas */}
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-stone-200 text-[9px]">
            <div className="border border-stone-300 rounded p-1.5 flex flex-col justify-between h-14 bg-stone-50/40">
              <span className="font-bold text-stone-700 uppercase text-[8px] block">
                1. Casco & Fibra
              </span>
              <div className="flex justify-between items-center text-stone-500 text-[8.5px]">
                <span>Espesor / Clic: [ ]</span>
                <span className="border-b border-stone-400 w-12 text-center">Firma</span>
              </div>
            </div>

            <div className="border border-stone-300 rounded p-1.5 flex flex-col justify-between h-14 bg-stone-50/40">
              <span className="font-bold text-stone-700 uppercase text-[8px] block">
                2. Hidráulica & Jets
              </span>
              <div className="flex justify-between items-center text-stone-500 text-[8.5px]">
                <span>Hermeticidad: [ ]</span>
                <span className="border-b border-stone-400 w-12 text-center">Firma</span>
              </div>
            </div>

            <div className="border border-stone-300 rounded p-1.5 flex flex-col justify-between h-14 bg-stone-50/40">
              <span className="font-bold text-stone-700 uppercase text-[8px] block">
                3. Motor & Eléctrica
              </span>
              <div className="flex justify-between items-center text-stone-500 text-[8.5px]">
                <span>Prueba viva: [ ]</span>
                <span className="border-b border-stone-400 w-12 text-center">Firma</span>
              </div>
            </div>

            <div className="border border-stone-300 rounded p-1.5 flex flex-col justify-between h-14 bg-stone-50/40">
              <span className="font-bold text-stone-700 uppercase text-[8px] block">
                4. Cierre & Embalaje
              </span>
              <div className="flex justify-between items-center text-stone-500 text-[8.5px]">
                <span>Aprobado: [ ]</span>
                <span className="border-b border-stone-400 w-12 text-center">Control Calidad</span>
              </div>
            </div>
          </div>

          {/* Pie de página estricto A4 */}
          <div className="flex justify-between items-center text-[8px] text-stone-400 pt-1 mt-1 border-t border-stone-100">
            <span>FIVESAINT SISTEMAS HIDROTERAPÉUTICOS — HOJA ÚNICA DE PLANTA A4</span>
            <span className="font-mono">PÁGINA 1 DE 1</span>
          </div>
        </div>
      </div>
    );
  }
);

ManufacturingOrderPrintPdf.displayName = 'ManufacturingOrderPrintPdf';
