import { redirect } from "next/navigation";
import { AdministrationShell } from "@/components/administracion/AdministrationShell";
import { OrderWorkspace } from "@/components/administracion/OrderWorkspace";
import { getOrderWorkflow } from "@/lib/supabase/order-workflow";

export default async function RequestWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getOrderWorkflow({ requestId: id });
  if (data.orderId) redirect(`/administracion/pedidos/${data.orderId}`);
  return (
    <AdministrationShell>
      <OrderWorkspace key={id} data={data} />
    </AdministrationShell>
  );
}
