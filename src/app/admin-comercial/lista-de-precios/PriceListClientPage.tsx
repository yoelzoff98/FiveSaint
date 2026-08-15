'use client';

import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PriceListPdf } from '@/components/pdf/PriceListPdf';
import { PrinterIcon } from 'lucide-react';

interface PriceListClientPageProps {
  isDistributor?: boolean;
  discountPercentage?: number;
  profileName?: string;
}

export default function PriceListClientPage({ 
  isDistributor = false, 
  discountPercentage = 0, 
  profileName 
}: PriceListClientPageProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const [hidePrices, setHidePrices] = useState(false);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: hidePrices 
      ? 'Catalogo-Five-Saint' 
      : isDistributor 
        ? `Lista-Precios-Distribuidor-${profileName || ''}` 
        : 'Lista-de-Precios-Five-Saint',
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide flex items-center gap-2">
            Lista de Precios {isDistributor && <span className="text-accent-deep">({discountPercentage}% OFF Distribuidor)</span>}
          </h1>
          <p className="text-stone-500 text-sm">
            {isDistributor 
              ? `Bienvenido ${profileName || ''}. Los precios reflejan automáticamente tu ${discountPercentage}% de descuento asignado.`
              : "Visualizá y exportá la lista oficial o el catálogo en formato PDF."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-stone-250 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setHidePrices(false)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                !hidePrices
                  ? 'bg-accent-deep text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              Lista de Precios
            </button>
            <button
              onClick={() => setHidePrices(true)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                hidePrices
                  ? 'bg-accent-deep text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              Catálogo (Sin Precios)
            </button>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-accent-deep hover:bg-accent-deep/90 text-white px-6 py-2 rounded-lg shadow-md transition-colors cursor-pointer text-sm font-semibold"
          >
            <PrinterIcon className="w-5 h-5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      <div className="flex justify-center bg-stone-200 p-4 rounded-xl print:p-0 print:bg-transparent">
        <div className="overflow-x-auto w-full flex justify-center">
          <PriceListPdf 
            ref={componentRef} 
            hidePrices={hidePrices} 
            isDistributor={isDistributor}
            discountPercentage={discountPercentage}
          />
        </div>
      </div>
    </div>
  );
}
