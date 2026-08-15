import { requireCommercialUser } from "@/lib/supabase/comercial";
import { CommercialShell } from "@/components/comercial/CommercialShell";
import PriceListClientPage from "./PriceListClientPage";

export default async function CommercialPriceListPage() {
  const ctx = await requireCommercialUser();

  return (
    <CommercialShell>
      <PriceListClientPage 
        isDistributor={ctx.isDistributor}
        discountPercentage={ctx.discountPercentage || 0}
        profileName={ctx.profileName}
      />
    </CommercialShell>
  );
}
