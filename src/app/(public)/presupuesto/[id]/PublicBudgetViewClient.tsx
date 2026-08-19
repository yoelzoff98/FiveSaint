"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { BudgetPrintPdf } from "@/components/pdf/BudgetPrintPdf";
import { Button } from "@/components/ui/Button";
import { Download, Info } from "lucide-react";

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
  discounts: number[];
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
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
  items: BudgetItem[];
}

interface PublicBudgetViewClientProps {
  budget: Budget;
}

export function PublicBudgetViewClient({ budget }: PublicBudgetViewClientProps) {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Presupuesto-FiveSaint-P-${budget.budget_number}`,
  });

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Barra superior de acciones para el cliente */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-xs px-4 sm:px-6 py-3.5">
        <div className="max-w-[210mm] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <img 
              src="/LOGO.svg" 
              alt="Five Saint Logo" 
              className="h-8 sm:h-10 object-contain" 
            />
            <div className="border-l border-stone-300 pl-3 text-right sm:text-left">
              <h1 className="text-xs sm:text-sm font-bold text-stone-850">Presupuesto Digital</h1>
              <p className="text-[9px] sm:text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                N° FS-P-{budget.budget_number}
              </p>
            </div>
          </div>

          <Button 
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent-deep hover:bg-accent-hover text-white font-bold cursor-pointer transition-colors shadow-sm text-xs sm:text-sm py-2.5"
          >
            <Download className="w-4 h-4" />
            Descargar Presupuesto (PDF)
          </Button>
        </div>
      </header>

      {/* Cuerpo principal */}
      <main className="flex-grow py-4 sm:py-8 px-2 sm:px-4 flex flex-col items-center w-full">
        {/* Banner informativo de bienvenida */}
        <div className="w-full max-w-[210mm] mb-4 sm:mb-6 bg-blue-50 border border-blue-200 p-3.5 sm:p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-blue-900 shadow-2xs">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">Estimado/a {budget.clients?.name}:</span>
            Ponemos a tu disposición esta cotización oficial digital. Podés visualizarla en línea en cualquier momento o descargar una copia en formato PDF oficial para tus archivos haciendo click en el botón superior.
          </div>
        </div>

        {/* Contenedor adaptativo del Presupuesto */}
        <div className="w-full max-w-[210mm] overflow-x-auto shadow-xl bg-white rounded-xl border border-stone-200 print:border-none print:shadow-none">
          <div className="min-w-[210mm] sm:min-w-0">
            <BudgetPrintPdf ref={printRef} budget={budget} />
          </div>
        </div>
      </main>
    </div>
  );
}
