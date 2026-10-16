import { requireAdministrationUser } from "@/lib/supabase/administration";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { getPendingOrderItemsForManufacturing, getProductCompositions, getConfigurableOptions } from "@/lib/supabase/manufacturing";
import { RevisionClient } from "./RevisionClient";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default async function ManufacturingRevisionPage() {
  await requireAdministrationUser();

  const [pendingItems, compositions, options] = await Promise.all([
    getPendingOrderItemsForManufacturing(),
    getProductCompositions({ status: "published" }),
    getConfigurableOptions({ isActiveOnly: true })
  ]);

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
              Revisión y Aprobación de Configuración Técnica
            </h1>
            <p className="text-xs text-stone-500">
              Validación administrativa previa a la emisión de órdenes de fabricación. Los pedidos sin configuración o con observaciones libres requieren aprobación formal antes de emitirse a planta.
            </p>
          </div>
        </div>

        <RevisionClient
          pendingItems={pendingItems}
          compositions={compositions}
          options={options}
        />
      </div>
    </AdministrationShell>
  );
}
