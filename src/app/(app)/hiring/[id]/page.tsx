import { HiringContractDetailPage } from "@/components/hiring-contract-workspace";

export default async function HiringCaseRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HiringContractDetailPage contractId={id} />;
}
