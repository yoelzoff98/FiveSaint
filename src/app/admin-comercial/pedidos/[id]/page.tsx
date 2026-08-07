import { requireCommercialUser, getOrderById } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { OrderDetailClient } from "./OrderDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  await requireCommercialUser();
  const { id } = await params;
  const order = await getOrderById(id);

  return (
    <CommercialShell>
      <div className="flex flex-col gap-6">
        <div>
          <Button variant="ghost" asChild className="mb-4 -ml-4 cursor-pointer">
            <Link href="/admin-comercial/pedidos" className="flex items-center gap-2 text-stone-500 hover:text-stone-900">
              <ArrowLeft className="w-4 h-4" />
              Volver a Pedidos
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Ficha de Pedido</h1>
          <p className="text-stone-500 text-sm">Controlá el estado y producción de este pedido.</p>
        </div>

        <OrderDetailClient initialOrder={order} />
      </div>
    </CommercialShell>
  );
}
