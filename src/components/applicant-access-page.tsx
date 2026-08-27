"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { CandidateNav } from "@/components/candidate-nav";
import { useCareerPortal } from "@/components/portal-context";

function safeReturnPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function ApplicantAccessPage({ title = "Acceso de postulantes", defaultMode = "login", returnPath = "/applicant/dashboard" }: { title?: string; defaultMode?: "login" | "register"; returnPath?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { portal } = useCareerPortal();
  const destination = safeReturnPath(params.get("returnUrl"), returnPath);
  const portalLabel = portal?.company?.name ? `el portal de ${portal.company.name}` : "nuestro portal de talento";
  return <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col gap-6 px-4 py-6"><CandidateNav /><header className="mx-auto w-full max-w-lg space-y-2"><p className="text-sm font-medium text-primary">{title}</p><h1 className="text-3xl font-semibold tracking-tight">Continúa tu proceso</h1></header><CandidateAuthCard returnPath={destination} portalLabel={portalLabel} defaultMode={defaultMode} onAuthenticated={() => router.replace(destination)} /></main>;
}
