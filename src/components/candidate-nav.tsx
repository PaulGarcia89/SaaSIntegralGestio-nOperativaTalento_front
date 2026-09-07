"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { candidateNavigation } from "@/lib/navigation";
import { usePathname } from "next/navigation";
import { LanguageSelector } from "@/components/language-selector";
import { useLocale } from "@/components/locale-provider";

export function CandidateNav({ vacanciesHref = "/jobs" }: { vacanciesHref?: string }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const labels: Record<string, string> = {
    "/": t("auth.backToPublicSite"),
    "/jobs": t("candidateNav.vacancies"),
    "/apply": t("candidateNav.apply"),
    "/application-status": t("candidateNav.myApplications"),
    "/candidate/portal": t("candidateNav.hub"),
    "/candidate/profile": t("candidateNav.profile"),
  };
  return (
    <nav
      aria-label={t("candidateNav.label")}
      className="min-w-0 relative left-1/2 flex w-screen max-w-none -translate-x-1/2 flex-nowrap gap-2 overflow-x-auto px-[max(1rem,calc((100vw-1440px)/2))] py-3"
    >
      {candidateNavigation.filter((item) => item.available).map((item) => { const href = item.href === "/jobs" ? vacanciesHref : item.href; return <Link key={item.href} aria-current={pathname === href ? "page" : undefined} href={href} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${pathname === href ? "border-action bg-action text-on-action" : "border-line bg-surface-1 text-ink-2 hover:border-line-strong hover:text-ink-1"}`}>{item.href === "/" ? <ArrowLeft className="size-4" aria-hidden="true" /> : null}{labels[item.href] ?? item.label}</Link>; })}
      <span className="ml-auto shrink-0"><LanguageSelector compact /></span>
    </nav>
  );
}
