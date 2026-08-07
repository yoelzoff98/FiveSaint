import { requireCommercialUser } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import PriceListClientPage from "./PriceListClientPage";

export default async function CommercialPriceListPage() {
  await requireCommercialUser();

  return (
    <CommercialShell>
      <PriceListClientPage />
    </CommercialShell>
  );
}
