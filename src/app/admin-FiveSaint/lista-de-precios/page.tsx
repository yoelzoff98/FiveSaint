'use client';

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PriceListPdf } from '@/components/pdf/PriceListPdf';
import { PrinterIcon } from 'lucide-react'; // Asumiendo que lucide-react está disponible, es común en Next.js

export default function PriceListPage() {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Lista-de-Precios-Five-Saint',
  });

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Generador de Lista de Precios</h1>
          <p className="text-slate-500">Visualiza y descarga la lista en formato PDF.</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg shadow-md transition-colors"
        >
          <PrinterIcon className="w-5 h-5" />
          <span>Imprimir / Guardar PDF</span>
        </button>
      </div>

      {/* Contenedor que simula el papel A4 en pantalla, y oculta sombras al imprimir */}
      <div className="flex justify-center bg-slate-200 p-4 rounded-xl print:p-0 print:bg-transparent">
        <div className="overflow-x-auto w-full flex justify-center">
          {/* El componente a imprimir */}
          <PriceListPdf ref={componentRef} />
        </div>
      </div>
    </div>
  );
}
