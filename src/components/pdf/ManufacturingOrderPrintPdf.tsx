import React, { forwardRef } from 'react';
import { formatSupplyQuantity } from '@/lib/manufacturing-calculations';

export interface TechnicalManufacturingOrderPrintProps {
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
    } | null;
    // Identificador explícito de versión de plantilla para garantizar retrocompatibilidad
    template_version?: string | null;
  };
}

const PRODUCTION_STAGES = [
  'TERMOFORMADO',
  'ENFIBRADO',
  'CORTE Y PERFORADO',
  'ARMADO',
  'PRUEBA',
  'PULIDO-EMBALADO',
  'CONTROL FINAL',
];

/**
 * Plantilla de Taller (v2 - Hoja técnica basada en formato de planta real)
 * - Exclusivamente datos técnicos (sin datos de clientes, teléfonos, precios ni márgenes).
 * - Tabla limpia de Componentes e Insumos con Código, Descripción, Cantidad y Unidad.
 * - Tabla de 7 etapas de control para firma y fecha manuscrita del operario.
 * - Formato compacto en escala de grises / blanco y negro para hoja única A4.
 */
export const ManufacturingOrderWorkshopTemplateV2 = forwardRef<
  HTMLDivElement,
  TechnicalManufacturingOrderPrintProps
>(({ order }, ref) => {
  const issuedDate = new Date(order.issued_at);
  const formattedDate = issuedDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = issuedDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const supplies = order.supplies_snapshot || [];
  const instructions = order.manufacturing_instructions_snapshot || [];
  const config = order.configuration_snapshot || {};

  const configEntries = Object.entries(config).filter(
    ([k, v]) => v !== undefined && v !== null && v !== ''
  );

  return (
    <div
      ref={ref}
      id="manufacturing-order-a4-sheet"
      className="bg-white text-black font-sans w-[210mm] h-[297mm] p-[10mm] flex flex-col justify-between box-border select-text print:p-[10mm] print:m-0 mx-auto"
      style={{
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
        pageBreakAfter: 'auto',
      }}
    >
      <div className="flex flex-col flex-1 justify-between">
        {/* =========================================================================
            1. CABECERA: LOGO, TÍTULO Y ORDEN DE FABRICACIÓN
           ========================================================================= */}
        <div className="shrink-0">
          <div className="flex justify-between items-center pb-2 border-b-2 border-black">
            <div className="flex items-center gap-3">
              <img
                src="/LOGO.svg"
                alt="Five Saint Logo"
                className="h-9 object-contain object-left filter grayscale"
              />
              <div className="border-l border-black pl-2.5">
                <span className="text-[10.5px] font-bold tracking-tight uppercase block leading-none">
                  FIVESAINT
                </span>
                <span className="text-[8px] uppercase tracking-wider text-neutral-600 block mt-0.5">
                  PLANTA INDUSTRIAL
                </span>
              </div>
            </div>

            <div className="text-center">
              <span className="text-sm font-black uppercase tracking-widest block">
                ORDEN DE FABRICACIÓN
              </span>
              <span className="text-[8.5px] font-mono text-neutral-600">
                HOJA DE TALLER
              </span>
            </div>

            <div className="text-right">
              <div className="border-2 border-black px-2.5 py-1 text-right">
                <span className="text-[8.5px] font-bold uppercase block text-neutral-700 leading-none">
                  ORDEN DE FAB. NRO.:
                </span>
                <span className="text-sm font-black font-mono leading-tight block">
                  {order.order_number}
                  {order.revision_number && order.revision_number > 1 && (
                    <span className="ml-1 text-[10px] font-bold">
                      (R{order.revision_number})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Subcabecera técnica con Referencia Interna y Fecha */}
          <div className="grid grid-cols-3 border-b border-black text-[9px] py-1 px-1 bg-neutral-100 font-medium">
            <div>
              <span className="font-bold">FECHA EMISIÓN: </span>
              <span>{formattedDate} {formattedTime}</span>
            </div>
            <div className="text-center">
              <span className="font-bold">PEDIDO REF.: </span>
              <span className="font-mono font-bold">
                {order.orders?.order_number ? `FS-O-${order.orders.order_number}` : 'S/D'}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold">EMITIDO POR: </span>
              <span>{order.issued_by_name} (BOM v{order.bom_version || 1})</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. PRODUCTO A FABRICAR Y EQUIPAMIENTO OPCIONAL / CONFIGURACIÓN
           ========================================================================= */}
        <div className="shrink-0 my-2 border border-black p-2 bg-neutral-50/50">
          <div className="flex justify-between items-start border-b border-neutral-300 pb-1.5 mb-1.5">
            <div className="flex-1 pr-3">
              <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-600 block">
                PRODUCTO / ARTÍCULO:
              </span>
              <h1 className="text-xs font-black uppercase text-black leading-snug">
                {order.product_name}
                {order.variant_name ? ` — ${order.variant_name}` : ''}
              </h1>
            </div>
            <div className="border border-black bg-white px-3 py-1 text-center shrink-0">
              <span className="text-[7.5px] font-bold uppercase block text-neutral-600">
                CANT. A FABRICAR
              </span>
              <span className="text-sm font-black font-mono">
                {order.quantity} {order.quantity === 1 ? 'UNIDAD' : 'UNIDADES'}
              </span>
            </div>
          </div>

          {/* Configuración técnica y detalles de equipamiento */}
          <div className="grid grid-cols-2 gap-3 text-[9px]">
            <div>
              <span className="font-black text-[8px] uppercase tracking-wider block mb-0.5 text-neutral-800">
                CONFIGURACIÓN TÉCNICA APROBADA:
              </span>
              {configEntries.length === 0 ? (
                <span className="text-neutral-500 italic text-[8.5px]">
                  Configuración estándar base de catálogo.
                </span>
              ) : (
                <div className="grid grid-cols-1 gap-0.5">
                  {configEntries.map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-neutral-200 py-0.5">
                      <span className="font-bold text-neutral-700 capitalize text-[8.5px]">
                        {k.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-black text-black uppercase text-[8.5px] text-right">
                        {Array.isArray(v) ? v.join(', ') : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-l border-neutral-300 pl-3">
              <span className="font-black text-[8px] uppercase tracking-wider block mb-0.5 text-neutral-800">
                INDICACIONES TÉCNICAS / MONTAJE:
              </span>
              {instructions.length === 0 ? (
                <span className="text-neutral-500 italic text-[8.5px]">
                  Proceder según manual de montaje y especificación estándar.
                </span>
              ) : (
                <ul className="list-disc list-inside space-y-0.5 text-[8.5px] text-neutral-900 leading-tight">
                  {instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. TABLA DE COMPONENTES E INSUMOS (ESTRICTAMENTE TÉCNICA)
           ========================================================================= */}
        <div className="shrink-0 mb-2">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-black">
              COMPONENTES E INSUMOS REQUERIDOS:
            </span>
            <span className="text-[8px] text-neutral-600 font-mono">
              TOTAL ÍTEMS: {supplies.length} (MÁX: 16)
            </span>
          </div>

          <table className="w-full text-left border-collapse border border-black text-[9px]">
            <thead>
              <tr className="bg-neutral-200 text-black text-[8.5px] font-black uppercase">
                <th className="py-1 px-2 w-28 border border-black">CÓDIGO</th>
                <th className="py-1 px-2 border border-black">DESCRIPCIÓN</th>
                <th className="py-1 px-2 w-24 text-right border border-black">CANTIDAD</th>
                <th className="py-1 px-2 w-16 text-center border border-black">UNIDAD</th>
              </tr>
            </thead>
            <tbody>
              {supplies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-2 text-center text-neutral-500 italic border border-black">
                    Sin insumos explosivos en esta orden.
                  </td>
                </tr>
              ) : (
                supplies.map((s, idx) => (
                  <tr key={s.code || idx} className="border-b border-neutral-300">
                    <td className="py-0.5 px-2 font-mono font-bold text-black border-r border-neutral-300">
                      {s.code}
                    </td>
                    <td className="py-0.5 px-2 text-black font-medium border-r border-neutral-300 break-words">
                      {s.name}
                    </td>
                    <td className="py-0.5 px-2 text-right font-mono font-bold text-black border-r border-neutral-300">
                      {typeof s.quantity === 'number'
                        ? formatSupplyQuantity(s.quantity, s.unitOfMeasure).replace(` ${s.unitOfMeasure}`, '')
                        : s.quantity}
                    </td>
                    <td className="py-0.5 px-2 text-center font-bold text-neutral-700 uppercase border-r border-neutral-300 text-[8px]">
                      {s.unitOfMeasure}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            4. CONTROL DE ETAPAS (TABLA DE FIRMA Y FECHA PARA OPERARIOS)
           ========================================================================= */}
        <div className="shrink-0 mb-2">
          <div className="mb-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-black">
              CONTROL DE ETAPAS DE PRODUCCIÓN:
            </span>
          </div>

          <table className="w-full text-left border-collapse border-2 border-black text-[9px]">
            <thead>
              <tr className="bg-neutral-200 text-black text-[8.5px] font-black uppercase">
                <th className="py-1 px-2 w-44 border border-black">PROCESO</th>
                <th className="py-1 px-2 border border-black text-center">FIRMA DEL OPERARIO</th>
                <th className="py-1 px-2 w-32 border border-black text-center">FECHA</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTION_STAGES.map((stage) => (
                <tr key={stage} className="border-b border-black h-6">
                  <td className="py-0.5 px-2 font-bold uppercase text-[8.5px] border-r border-black bg-neutral-50/50">
                    {stage}
                  </td>
                  <td className="border-r border-black"></td>
                  <td className="text-center font-mono text-[8px] text-neutral-400">
                    &nbsp;
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            5. OBSERVACIONES TÉCNICAS DE PLANTA
           ========================================================================= */}
        <div className="shrink-0 border border-black p-2 bg-neutral-50/30">
          <span className="text-[8px] font-black uppercase tracking-wider text-neutral-700 block mb-0.5">
            OBSERVACIONES TÉCNICAS / ANOTACIONES DE PLANTA:
          </span>
          <div className="min-h-[22px] text-[8.5px] text-neutral-900 leading-snug">
            {order.notes ? (
              <p>{order.notes}</p>
            ) : (
              <span className="text-neutral-400 italic">
                Espacio reservado para observaciones técnicas y anotaciones manuscritas del personal de taller.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. PIE DE PÁGINA (ESTRICTAMENTE 1 HOJA A4)
         ========================================================================= */}
      <div className="flex justify-between items-center text-[7.5px] text-neutral-500 pt-1 mt-1 border-t border-neutral-400 shrink-0">
        <span className="font-bold tracking-wider">
          FIVESAINT — PLANTA INDUSTRIAL — ORDEN DE FABRICACIÓN (USO INTERNO EXCLUSIVO)
        </span>
        <span className="font-mono font-bold">PÁGINA 1 DE 1</span>
      </div>
    </div>
  );
});

ManufacturingOrderWorkshopTemplateV2.displayName = 'ManufacturingOrderWorkshopTemplateV2';

/**
 * Plantilla Histórica (v1) para órdenes previas.
 * Garantiza retrocompatibilidad total con documentos preexistentes.
 */
export const ManufacturingOrderLegacyTemplateV1 = forwardRef<
  HTMLDivElement,
  TechnicalManufacturingOrderPrintProps
>(({ order }, ref) => {
  const issuedDate = new Date(order.issued_at);
  const supplies = order.supplies_snapshot || [];
  const instructions = order.manufacturing_instructions_snapshot || [];
  const config = order.configuration_snapshot || {};
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

        <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-stone-200 text-[10px] bg-stone-50 p-2 rounded">
          <div>
            <span className="text-stone-500 font-bold uppercase text-[8.5px] block">Pedido Comercial:</span>
            <span className="font-bold text-stone-900">
              {order.orders?.order_number ? `FS-O-${order.orders.order_number}` : 'S/D'}
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

      <div className="shrink-0 flex flex-col justify-start">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9.5px] font-black uppercase tracking-wider text-stone-900">
            Requerimiento de Insumos y Componentes:
          </span>
          <span className="text-[9px] text-stone-500">
            Total ítems consolidados: {supplies.length}
          </span>
        </div>

        <table className="w-full text-left border-collapse border border-stone-300 text-[10px]">
          <thead>
            <tr className="bg-stone-800 text-white text-[9px] uppercase tracking-wider">
              <th className="py-0.5 px-2 w-24 border border-stone-700">Código</th>
              <th className="py-0.5 px-2 border border-stone-700">Descripción del Insumo</th>
              <th className="py-0.5 px-2 w-28 text-right border border-stone-700">Cantidad Total</th>
              <th className="py-0.5 px-2 w-16 text-center border border-stone-700">Unidad</th>
            </tr>
          </thead>
          <tbody>
            {supplies.map((s, idx) => (
              <tr key={s.code || idx} className="border-b border-stone-200">
                <td className="py-0.5 px-2 font-mono font-bold text-stone-800 text-[9.5px]">{s.code}</td>
                <td className="py-0.5 px-2 text-stone-900 font-medium break-words">{s.name}</td>
                <td className="py-0.5 px-2 text-right font-mono font-bold text-stone-900">
                  {typeof s.quantity === 'number' ? formatSupplyQuantity(s.quantity, s.unitOfMeasure) : s.quantity}
                </td>
                <td className="py-0.5 px-2 text-center font-semibold text-stone-600 uppercase text-[9px]">{s.unitOfMeasure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t-2 border-stone-800 pt-2 shrink-0">
        <div className="mb-2 bg-stone-50 border border-stone-200 p-2 rounded text-[9.5px]">
          <span className="font-bold text-stone-700 uppercase tracking-wider block text-[8.5px] mb-0.5">
            Observaciones de Planta / Notas Especiales:
          </span>
          <p className="text-stone-800 leading-tight">
            {order.notes || "Fabricación conforme a normas técnicas internas FiveSaint."}
          </p>
        </div>
        <div className="flex justify-between items-center text-[8px] text-stone-400 pt-1 border-t border-stone-100">
          <span>FIVESAINT SISTEMAS HIDROTERAPÉUTICOS — HOJA ÚNICA DE PLANTA A4</span>
          <span className="font-mono">PÁGINA 1 DE 1</span>
        </div>
      </div>
    </div>
  );
});

ManufacturingOrderLegacyTemplateV1.displayName = 'ManufacturingOrderLegacyTemplateV1';

/**
 * Componente principal despachador:
 * Determina qué plantilla utilizar garantizando retrocompatibilidad:
 * - Si order.template_version === 'v1' o fue emitida antes de esta actualización -> usa V1 legacy.
 * - Por defecto o si template_version === 'v2_workshop' -> usa la nueva plantilla de taller V2.
 */
export const ManufacturingOrderPrintPdf = forwardRef<
  HTMLDivElement,
  TechnicalManufacturingOrderPrintProps
>(({ order }, ref) => {
  if (order.template_version === 'v1') {
    return <ManufacturingOrderLegacyTemplateV1 ref={ref} order={order} />;
  }
  return <ManufacturingOrderWorkshopTemplateV2 ref={ref} order={order} />;
});

ManufacturingOrderPrintPdf.displayName = 'ManufacturingOrderPrintPdf';
