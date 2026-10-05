import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getOrderById } from "@/lib/supabase/comercial";
import { OrderDetailClient } from "@/app/admin-comercial/pedidos/[id]/OrderDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdministrationOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdministrationUser();
  const resolvedParams = await params;
  const order = await getOrderById(resolvedParams.id);

  return (
    <AdministrationShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/administracion/pedidos"
            className="p-2 rounded-lg hover:bg-stone-200/60 text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Control de Pedido #{order.order_number}
            </h1>
            <p className="text-xs text-stone-500">
              Supervisión de fabricación, control de entrega y cancelación
            </p>
          </div>
        </div>

        <OrderDetailClient initialOrder={order} />
      </div>
    </AdministrationShell>
  );
}
