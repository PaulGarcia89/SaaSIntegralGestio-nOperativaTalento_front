import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { candidateNavigation } from "@/lib/navigation";

export function CandidateNav() {
  return (
    <nav aria-label="Navegación del candidato" className="mx-auto flex w-full max-w-[1440px] flex-wrap gap-2 px-1 py-3">
      {candidateNavigation.map((item) => (
        item.available ? <Link key={item.href} href={item.href} className={`flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${item.href === "/" ? "border-primary/30 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" : "border-border/70 bg-card/80 hover:bg-secondary"}`}>{item.href === "/" ? <ArrowLeft className="size-4" aria-hidden="true" /> : null}{item.label}</Link>
          : <span key={item.href} className="flex min-h-11 cursor-not-allowed items-center rounded-full border border-border/50 bg-muted/40 px-4 py-2 text-sm text-muted-foreground" title="Disponible próximamente" aria-disabled="true">{item.label} <span className="sr-only">(Disponible próximamente)</span></span>
      ))}
    </nav>
  );
}
