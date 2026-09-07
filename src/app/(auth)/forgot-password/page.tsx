"use client";

import Link from "next/link";
import { IntegrationUnavailable } from "@/components/integration-state";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { useLocale } from "@/components/locale-provider";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  return <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-5 p-6"><div className="flex justify-end"><LanguageSelector /></div><IntegrationUnavailable title={t("auth.recovery.title")} description={t("auth.recovery.description")} /><Button asChild variant="secondary"><Link href="/login">{t("auth.backToSignIn")}</Link></Button></main>;
}
