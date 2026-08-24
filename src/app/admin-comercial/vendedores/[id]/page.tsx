import { requireCommercialUser } from "@/lib/supabase/comercial";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SellerPerformanceClient } from "./SellerPerformanceClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SellerPerformancePage({ params }: PageProps) {
  await requireCommercialUser();
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  // 1. Obtener datos del vendedor
  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", id)
    .single();

  if (sellerError || !seller) {
    return (
      <CommercialShell>
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">
          Vendedor no encontrado.
        </div>
      </CommercialShell>
    );
  }

  // 2. Obtener presupuestos (para métricas y cálculos)
  const { data: budgets } = await supabase
    .from("budgets")
    .select("id, budget_number, total_amount, status, created_at, clients(name, company_name, status)")
    .eq("seller_id", id)
    .order("created_at", { ascending: false });

  // 3. Obtener pedidos cerrados de este vendedor (para referencias directas)
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, status, created_at, clients(name, company_name, status)")
    .eq("seller_id", id)
    .order("created_at", { ascending: false });

  return (
    <CommercialShell>
      <div className="flex flex-col gap-6">
        <div>
          <Button variant="ghost" asChild className="mb-4 -ml-4 cursor-pointer">
            <Link href="/admin-comercial/vendedores" className="flex items-center gap-2 text-stone-500 hover:text-stone-900">
              <ArrowLeft className="w-4 h-4" />
              Volver a Vendedores
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">
            Desempeño de Vendedor: {seller.full_name}
          </h1>
          <p className="text-stone-500 text-sm">Analizá métricas, tasas de conversión y liquidá comisiones.</p>
        </div>

        <SellerPerformanceClient 
          seller={seller} 
          budgets={(budgets as any) || []} 
          orders={(orders as any) || []} 
        />
      </div>
    </CommercialShell>
  );
}
