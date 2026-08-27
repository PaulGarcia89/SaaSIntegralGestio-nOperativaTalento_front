"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { candidateNavigation } from "@/lib/navigation";
import { usePathname } from "next/navigation";
import { LanguageSelector } from "@/components/language-selector";

export function CandidateNav({ vacanciesHref = "/jobs" }: { vacanciesHref?: string }) {
  const pathname = usePathname();
  const labels: Record<string, string> = {
    "/": "Volver al sitio público",
    "/jobs": "Vacantes",
    "/apply": "Iniciar postulación",
    "/application-status": "Mis postulaciones",
    "/candidate/portal": "Centro del candidato",
    "/candidate/profile": "Perfil y privacidad",
  };
  return (
    <nav
      aria-label="Navegación del candidato"
      className="relative left-1/2 flex w-screen max-w-none -translate-x-1/2 flex-nowrap gap-2 overflow-x-auto px-[max(1rem,calc((100vw-1440px)/2))] py-3"
    >
      {candidateNavigation.filter((item) => item.available).map((item) => { const href = item.href === "/jobs" ? vacanciesHref : item.href; return <Link key={item.href} aria-current={pathname === href ? "page" : undefined} href={href} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${pathname === href ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border/70 bg-card/80 hover:bg-secondary"}`}>{item.href === "/" ? <ArrowLeft className="size-4" aria-hidden="true" /> : null}{labels[item.href] ?? item.label}</Link>; })}
      <span className="ml-auto shrink-0"><LanguageSelector compact /></span>
    </nav>
  );
}
