import { AccountingDocuments } from "@/components/contable/AccountingDocuments";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; page?: string }>;
}) {
  return (
    <AccountingDocuments section="presupuestos" searchParams={searchParams} />
  );
}
