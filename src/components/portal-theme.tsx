"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useCareerPortal } from "@/components/portal-context";

export function PortalThemeProvider({ children }: { children: ReactNode }) {
  const { portal } = useCareerPortal();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const branding = portal?.branding ?? {};
    // Solo la tipografía se aplica. Los cinco colores —`--career-primary`,
    // `--career-secondary`, `--career-accent`, `--career-background` y
    // `--career-text`— se escribían en :root y no los leía ni una regla de
    // CSS ni un componente: parecían tematizar el portal y no tematizaban
    // nada. Escribirlos además dejaba variables de una empresa pegadas al
    // documento al navegar a otra.
    root.style.setProperty("--career-font-family", branding.fontFamily?.trim() || "inherit");
  }, [portal]);

  return <><style data-career-portal>{portal?.branding.customCss ?? ""}</style>{children}</>;
}
