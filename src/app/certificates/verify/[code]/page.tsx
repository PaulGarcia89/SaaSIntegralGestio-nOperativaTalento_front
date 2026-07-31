import { TrainingCertificateVerification } from "@/components/training-certificate-verification";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <TrainingCertificateVerification code={code} />;
}
