"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { candidateNavigation } from "@/lib/navigation";
import { usePathname } from "next/navigation";

export function CandidateNav() {
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
    <nav aria-label="Navegación del candidato" className="mx-auto flex w-full max-w-[1440px] flex-wrap gap-2 px-1 py-3">
      {candidateNavigation.filter((item) => item.available).map((item) => <Link key={item.href} aria-current={pathname === item.href ? "page" : undefined} href={item.href} className={`flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${pathname === item.href ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border/70 bg-card/80 hover:bg-secondary"}`}>{item.href === "/" ? <ArrowLeft className="size-4" aria-hidden="true" /> : null}{labels[item.href] ?? item.label}</Link>)}
    </nav>
  );
}
