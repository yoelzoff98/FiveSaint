import { getPublicBudgetById, incrementBudgetViewCount } from "@/lib/supabase/comercial";
import { PublicBudgetViewClient } from "./PublicBudgetViewClient";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const budget = await getPublicBudgetById(id);
    return {
      title: `Presupuesto N° ${budget.budget_number} | Five Saint`,
      description: `Cotización oficial digital emitida para ${budget.clients?.name || 'Cliente'}.`
    };
  } catch {
    return {
      title: "Presupuesto | Five Saint",
      description: "Cotización oficial digital."
    };
  }
}

export default async function PublicBudgetPage({ params }: PageProps) {
  const { id } = await params;

  try {
    // 1. Registrar la visualización por parte del cliente (falla de forma segura si no se corrió la migración de las columnas)
    try {
      await incrementBudgetViewCount(id);
    } catch (e) {
      console.error("Error al registrar visualización:", e);
    }

    // 2. Obtener los datos del presupuesto
    const budget = await getPublicBudgetById(id);

    return <PublicBudgetViewClient budget={budget as any} />;
  } catch (err: any) {
    console.error("Error en PublicBudgetPage:", err);
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-md max-w-md w-full">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-stone-900 mb-2">No se pudo cargar la cotización</h2>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            Ocurrió un error al consultar el presupuesto en el servidor. 
            Asegurate de que las variables de entorno de Supabase en Vercel y las columnas en la base de datos estén configuradas.
          </p>
          <div className="text-[10px] text-stone-400 bg-stone-50 p-2.5 rounded border border-stone-250 font-mono text-left break-words">
            Detalle del error: {err.message || String(err)}
          </div>
        </div>
      </div>
    );
  }
}
