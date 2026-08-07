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

  // 1. Registrar la visualización por parte del cliente
  await incrementBudgetViewCount(id);

  // 2. Obtener los datos del presupuesto
  const budget = await getPublicBudgetById(id);

  return <PublicBudgetViewClient budget={budget as any} />;
}
