import { PortalContextProvider } from "@/components/portal-context";
import { PortalThemeProvider } from "@/components/portal-theme";
import { CareerPortalShell } from "@/components/career-portal-shell";

export default function CareersPage() {
  return <PortalContextProvider><PortalThemeProvider><CareerPortalShell basePath="/careers/jobs" /></PortalThemeProvider></PortalContextProvider>;
}

