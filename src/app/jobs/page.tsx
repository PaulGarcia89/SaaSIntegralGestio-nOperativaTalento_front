import { PortalContextProvider } from "@/components/portal-context";
import { PortalThemeProvider } from "@/components/portal-theme";
import { CareerPortalShell } from "@/components/career-portal-shell";

export default function JobsPortalPage() {
  return <PortalContextProvider resolve={false}><PortalThemeProvider><CareerPortalShell basePath="/jobs" /></PortalThemeProvider></PortalContextProvider>;
}
