import { AccountingDocuments } from "@/components/contable/AccountingDocuments";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; page?: string }>;
}) {
  return <AccountingDocuments section="pedidos" searchParams={searchParams} />;
}
