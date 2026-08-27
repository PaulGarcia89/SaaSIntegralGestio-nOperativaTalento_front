import { redirect } from "next/navigation";

export default async function CompanyPrivateJobsPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params;
  redirect(`/company/${encodeURIComponent(companySlug)}/jobs`);
}
