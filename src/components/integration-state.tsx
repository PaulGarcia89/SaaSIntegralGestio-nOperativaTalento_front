"use client";

import { FlaskConical } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { InlineFeedback } from "@/components/design-system";

export const DEMO_MODE_ENABLED = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_MOCK_BACKEND === "true";

export function DemoModeBanner() {
  if (!DEMO_MODE_ENABLED) return null;

  return (
    <div className="sticky top-0 z-[100000] flex min-h-11 items-center justify-center gap-2 border-b border-status-warning/40 bg-status-warning/15 px-4 py-2 text-center text-sm font-medium text-status-warning" role="status">
      <FlaskConical className="size-4" aria-hidden="true" />
      Modo de prueba local: los datos y acciones de esta sesión no son productivos.
    </div>
  );
}

export function IntegrationUnavailable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useLocale();
  return <InlineFeedback tone="info" title={t("integration.comingSoon", { title })}><p>{description}</p><p className="mt-2 text-xs">{t("integration.noMockData")}</p></InlineFeedback>;
}
