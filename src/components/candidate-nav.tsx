"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { candidateNavigation } from "@/lib/navigation";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/language-selector";
import { useLocale } from "@/components/locale-provider";

/**
 * Navegación de quien busca empleo.
 *
 * `tone="dark"` la pinta para ir sobre el fondo grafito del portal: mismos
 * tamaños y el mismo estado activo, solo cambian los colores. Sin esa
 * variante, las píldoras claras sobre el hero oscuro se leían como un parche.
 */
export function CandidateNav({
  vacanciesHref = "/jobs",
  tone = "light",
}: {
  vacanciesHref?: string;
  tone?: "light" | "dark";
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  const dark = tone === "dark";
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
      className={cn(
        "min-w-0 flex flex-nowrap gap-2 overflow-x-auto py-1",
        !dark && "relative left-1/2 w-screen max-w-none -translate-x-1/2 px-[max(1rem,calc((100vw-1440px)/2))] py-3",
      )}
    >
      {candidateNavigation
        .filter((item) => item.available)
        .map((item) => {
          const href = item.href === "/jobs" ? vacanciesHref : item.href;
          const current = pathname === href;
          return (
            <Link
              key={item.href}
              aria-current={current ? "page" : undefined}
              href={href}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2",
                dark ? "focus-visible:outline-accent-fill" : "focus-visible:outline-focus",
                current
                  ? dark
                    ? "border-accent-fill bg-accent-fill text-surface-dark-1"
                    : "border-action bg-action text-on-action"
                  : dark
                    ? "border-surface-dark-ink/15 bg-surface-dark-ink/[0.06] text-surface-dark-ink/80 hover:border-surface-dark-ink/30 hover:text-surface-dark-ink"
                    : "border-line bg-surface-1 text-ink-2 hover:border-line-strong hover:text-ink-1",
              )}
            >
              {item.href === "/" ? <ArrowLeft className="size-4" aria-hidden="true" /> : null}
              {labels[item.href] ?? item.label}
            </Link>
          );
        })}
      <span className="ml-auto shrink-0">
        <LanguageSelector compact />
      </span>
    </nav>
  );
}
