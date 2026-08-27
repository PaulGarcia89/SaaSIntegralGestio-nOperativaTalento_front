import { PortalContextProvider } from "@/components/portal-context";
import { PortalThemeProvider } from "@/components/portal-theme";
import { CareerVacancyDetailLoader } from "@/components/career-vacancy-detail";

export default async function CompanyJobDetailPage({ params }: { params: Promise<{ companySlug: string; jobSlug: string }> }) {
  const { companySlug, jobSlug } = await params;
  return <PortalContextProvider><PortalThemeProvider><CareerVacancyDetailLoader jobSlug={jobSlug} vacanciesHref={`/company/${encodeURIComponent(companySlug)}/jobs`} /></PortalThemeProvider></PortalContextProvider>;
}
