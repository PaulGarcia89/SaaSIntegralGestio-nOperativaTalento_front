"use client";

import { useUiText } from "@/components/ui-copy";

import { Suspense } from "react";
import { ApplicantAccessPage } from "@/components/applicant-access-page";
import { PortalContextProvider } from "@/components/portal-context";
import { PortalThemeProvider } from "@/components/portal-theme";

export default function CompanyApplicantLoginPage() {
  const uiText = useUiText();
  return <PortalContextProvider><PortalThemeProvider><Suspense fallback={null}><ApplicantAccessPage title={uiText("Acceso privado de postulantes")} /></Suspense></PortalThemeProvider></PortalContextProvider>;
}
