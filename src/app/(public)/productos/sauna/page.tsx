import type { Metadata } from "next";
import { SaunaPriceListDetails } from "@/components/products/SaunaPriceListDetails";
export const metadata: Metadata = {
  title: "Sauna a medida | Five Saint",
  description:
    "Saunas a medida para 3 a 4, 5 a 6 y 6 a 7 personas. Cabina, revestimiento interior y opcionales de la lista Five Saint. Cotización a pedido.",
  alternates: { canonical: "/productos/sauna" },
};
export default function Page() {
  return <SaunaPriceListDetails />;
}
