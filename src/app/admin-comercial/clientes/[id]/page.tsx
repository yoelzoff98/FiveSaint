import { requireCommercialUser, getClientById } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import { ClientDetailClient } from "./ClientDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  await requireCommercialUser();
  const { id } = await params;
  const client = await getClientById(id);

  return (
    <CommercialShell>
      <div className="flex flex-col gap-6">
        <div>
          <Button variant="ghost" asChild className="mb-4 -ml-4 cursor-pointer">
            <Link href="/admin-comercial/clientes" className="flex items-center gap-2 text-stone-500 hover:text-stone-900">
              <ArrowLeft className="w-4 h-4" />
              Volver a Clientes
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-stone-900 tracking-wide">Ficha de Cliente</h1>
          <p className="text-stone-500 text-sm">Historial comercial y notas de seguimiento.</p>
        </div>

        <ClientDetailClient client={client} />
      </div>
    </CommercialShell>
  );
}
