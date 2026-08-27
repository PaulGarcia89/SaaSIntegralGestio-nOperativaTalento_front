"use client";

import { Suspense } from "react";
import { ApplicantAccessPage } from "@/components/applicant-access-page";
import { PortalContextProvider } from "@/components/portal-context";
import { PortalThemeProvider } from "@/components/portal-theme";

export default function CompanyApplicantLoginPage() {
  return <PortalContextProvider><PortalThemeProvider><Suspense fallback={null}><ApplicantAccessPage title="Acceso privado de postulantes" /></Suspense></PortalThemeProvider></PortalContextProvider>;
}
