import { redirect } from "next/navigation";

export default async function CompanyPrivateJobDetailPage({ params }: { params: Promise<{ companySlug: string; jobSlug: string }> }) {
  const { companySlug, jobSlug } = await params;
  redirect(`/company/${encodeURIComponent(companySlug)}/jobs/${encodeURIComponent(jobSlug)}`);
}
