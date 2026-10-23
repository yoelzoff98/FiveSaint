import { redirect } from "next/navigation";
import { requireAdministrationUser } from "@/lib/supabase/administration";

// Preserve old bookmarks without keeping a second approval circuit.
export default async function ManufacturingRevisionPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  await requireAdministrationUser();
  const { orderId } = await searchParams;
  redirect(orderId ? `/administracion/pedidos/${encodeURIComponent(orderId)}` : "/administracion/fabricacion");
}
