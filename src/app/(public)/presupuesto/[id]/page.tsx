import { getPublicBudgetById, incrementBudgetViewCount } from "@/lib/supabase/comercial";
import { PublicBudgetViewClient } from "./PublicBudgetViewClient";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const budget = await getPublicBudgetById(id).catch(() => null);
  return {
    title: budget ? `Presupuesto N° ${budget.budget_number} | Five Saint` : "Presupuesto | Five Saint",
    description: "Cotización oficial digital.",
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function PublicBudgetPage({ params }: PageProps) {
  const { id } = await params;
  const budget = await getPublicBudgetById(id).catch(() => null);
  if (!budget) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-lg max-w-md">
          <h1 className="text-xl font-bold text-stone-900 mb-2">Cotización no disponible</h1>
          <p className="text-sm text-stone-600 mb-6">Verificá el enlace o comunicate con tu asesor de Five Saint.</p>
          <Link href="/" className="text-sm font-semibold underline">Ir al Sitio Principal</Link>
        </div>
      </div>
    );
  }
  await incrementBudgetViewCount(id).catch(() => null);
  return <PublicBudgetViewClient budget={budget} />;
}
