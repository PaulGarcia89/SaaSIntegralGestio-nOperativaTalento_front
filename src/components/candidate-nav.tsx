"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { candidateNavigation } from "@/lib/navigation";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

export function CandidateNav() {
  const pathname = usePathname();
  const lang = useSyncExternalStore<"es" | "en">(
    (callback) => { window.addEventListener("popstate", callback); return () => window.removeEventListener("popstate", callback); },
    () => new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "es",
    () => "es",
  );
  const labels: Record<string, [string, string]> = {
    "/": ["Volver al sitio público", "Back to public site"],
    "/jobs": ["Vacantes", "Jobs"],
    "/apply": ["Iniciar postulación", "Apply"],
    "/application-status": ["Mis postulaciones", "My applications"],
    "/candidate/portal": ["Centro del candidato", "Candidate center"],
    "/candidate/profile": ["Perfil y privacidad", "Profile and privacy"],
  };
  return (
    <nav aria-label={lang === "en" ? "Candidate navigation" : "Navegación del candidato"} className="mx-auto flex w-full max-w-[1440px] flex-wrap gap-2 px-1 py-3">
      {candidateNavigation.filter((item) => item.available).map((item) => <Link key={item.href} aria-current={pathname === item.href ? "page" : undefined} href={item.href + "?lang=" + lang} className={`flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${pathname === item.href ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border/70 bg-card/80 hover:bg-secondary"}`}>{item.href === "/" ? <ArrowLeft className="size-4" aria-hidden="true" /> : null}{labels[item.href]?.[lang === "en" ? 1 : 0] ?? item.label}</Link>)}
      <Link className="ml-auto flex min-h-11 items-center rounded-full border px-4 text-sm font-medium" href={pathname + "?lang=" + (lang === "en" ? "es" : "en")} hrefLang={lang === "en" ? "es" : "en"}>{lang === "en" ? "Español" : "English"}</Link>
    </nav>
  );
}
