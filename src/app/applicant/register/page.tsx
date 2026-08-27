"use client";

import { Suspense } from "react";
import { ApplicantAccessPage } from "@/components/applicant-access-page";
import { PortalContextProvider } from "@/components/portal-context";
import { PortalThemeProvider } from "@/components/portal-theme";

export default function ApplicantRegisterPage() {
  return <PortalContextProvider><PortalThemeProvider><Suspense fallback={null}><ApplicantAccessPage title="Registro de postulantes" defaultMode="register" /></Suspense></PortalThemeProvider></PortalContextProvider>;
}
