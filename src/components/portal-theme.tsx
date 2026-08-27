"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useCareerPortal } from "@/components/portal-context";

function sanitizeColor(value?: string | null, fallback = "#0f766e") {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value ?? "") ? (value as string) : fallback;
}

export function PortalThemeProvider({ children }: { children: ReactNode }) {
  const { portal } = useCareerPortal();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const branding = portal?.branding ?? {};
    root.style.setProperty("--career-primary", sanitizeColor(branding.primary, "#0f766e"));
    root.style.setProperty("--career-secondary", sanitizeColor(branding.secondary, "#155e75"));
    root.style.setProperty("--career-accent", sanitizeColor(branding.accent, "#f59e0b"));
    root.style.setProperty("--career-background", sanitizeColor(branding.background, "#f8fafc"));
    root.style.setProperty("--career-text", sanitizeColor(branding.text, "#0f172a"));
  }, [portal]);

  return <>{children}</>;
}
