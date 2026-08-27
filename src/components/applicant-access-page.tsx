"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CandidateAuthCard } from "@/components/candidate-auth-card";
import { CandidateNav } from "@/components/candidate-nav";
import { useCareerPortal } from "@/components/portal-context";
import { useLocale } from "@/components/locale-provider";

function safeReturnPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function ApplicantAccessPage({ title, defaultMode = "login", returnPath = "/applicant/dashboard" }: { title?: string; defaultMode?: "login" | "register"; returnPath?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { portal } = useCareerPortal();
  const { t } = useLocale();
  const destination = safeReturnPath(params.get("returnUrl"), returnPath);
  const portalLabel = portal?.company?.name ? portal.company.name : t("applicant.portalFallback");
  const resolvedTitle = title ?? (defaultMode === "register" ? t("applicant.registerTitle") : t("applicant.accessTitle"));
  return <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col gap-6 px-4 py-6"><CandidateNav /><header className="mx-auto w-full max-w-lg space-y-2"><p className="text-sm font-medium text-primary">{resolvedTitle}</p><h1 className="text-3xl font-semibold tracking-tight">{t("applicant.continueProcess")}</h1></header><CandidateAuthCard returnPath={destination} portalLabel={portalLabel} defaultMode={defaultMode} onAuthenticated={() => router.replace(destination)} /></main>;
}
