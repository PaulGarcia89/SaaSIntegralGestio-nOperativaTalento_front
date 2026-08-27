import { PortalContextProvider } from "@/components/portal-context";
import { PortalThemeProvider } from "@/components/portal-theme";
import { CareerPortalShell } from "@/components/career-portal-shell";

export default async function CompanyJobsPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params;
  return <PortalContextProvider><PortalThemeProvider><CareerPortalShell basePath={`/company/${encodeURIComponent(companySlug)}/jobs`} /></PortalThemeProvider></PortalContextProvider>;
}
