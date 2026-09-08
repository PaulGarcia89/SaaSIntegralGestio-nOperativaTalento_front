"use client";

import { useUiText } from "@/components/ui-copy";

import { Suspense } from "react";
import { ApplicantAccessPage } from "@/components/applicant-access-page";
import { PortalContextProvider } from "@/components/portal-context";
import { PortalThemeProvider } from "@/components/portal-theme";

export default function CareersApplicantLoginPage() {
  const uiText = useUiText();
  return <PortalContextProvider><PortalThemeProvider><Suspense fallback={null}><ApplicantAccessPage title={uiText("Acceso al portal de talento")} /></Suspense></PortalThemeProvider></PortalContextProvider>;
}
