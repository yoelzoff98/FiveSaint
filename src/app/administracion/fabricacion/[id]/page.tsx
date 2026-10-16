import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getManufacturingOrderById } from "@/lib/supabase/manufacturing";
import { ManufacturingOrderDetailClient } from "./ManufacturingOrderDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AdminMfgDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminMfgDetailPage({ params }: AdminMfgDetailPageProps) {
  await requireAdministrationUser();
  const resolvedParams = await params;
  const order = await getManufacturingOrderById(resolvedParams.id);

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/administracion/fabricacion"
            className="p-2 rounded-lg hover:bg-stone-200/60 text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Orden de Fabricación {order.order_number}
            </h1>
            <p className="text-xs text-stone-500">
              Documento oficial de planta en hoja única A4. Trazabilidad inmutable de configuración e insumos.
            </p>
          </div>
        </div>

        <ManufacturingOrderDetailClient initialOrder={order} />
      </div>
    </AdministrationShell>
  );
}
