import { PortalContextProvider } from "@/components/portal-context";
import { PortalThemeProvider } from "@/components/portal-theme";
import { CareerVacancyDetailLoader } from "@/components/career-vacancy-detail";

export default async function JobDetailPage({ params }: { params: Promise<{ jobSlug: string }> }) {
  const { jobSlug } = await params;
  return <PortalContextProvider><PortalThemeProvider><CareerVacancyDetailLoader jobSlug={jobSlug} /></PortalThemeProvider></PortalContextProvider>;
}
