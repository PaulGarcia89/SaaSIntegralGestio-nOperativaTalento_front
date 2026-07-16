"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ModuleHeader, SectionCard, InfoList, SplitPanel } from "@/components/ui";
import { fetchAutomationSummary } from "@/lib/mock-backend";
import { notifications } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

export default function NotificationsPage() {
  const { currentTenant } = useAppStore();
  const automationQuery = useQuery({
    queryKey: ["automation-summary", currentTenant.id],
    queryFn: () => fetchAutomationSummary(),
  });

  const auditItems = (automationQuery.data?.audit ?? []).slice(0, 6);
  const ruleItems = automationQuery.data?.rules ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow="Centro de notificaciones"
        title="Feed priorizado, filtrable y accionable."
        description="El centro de alertas ahora combina avisos operativos con eventos reales de automatización para que cada cambio relevante quede visible y trazable."
        actions={
          <Button asChild>
            <Link href="/reports">Abrir reportes</Link>
          </Button>
        }
        metrics={[
          { label: "Alertas no leidas", value: `${auditItems.filter((item) => item.status !== "Ejecutada").length + 3}`, detail: "Cruza notificaciones humanas y reglas ejecutadas" },
          { label: "Reglas visibles", value: `${ruleItems.length}`, detail: "Automatizaciones activas con trazabilidad operativa" },
          { label: "Ejecuciones de hoy", value: `${auditItems.filter((item) => item.executedAt.includes("16 jul 2026")).length}`, detail: "Eventos disparados el jueves 16 de julio de 2026" },
        ]}
      />
      <div className="space-y-12 xl:space-y-14">
        <SplitPanel
          left={
            <SectionCard title="Actividad reciente" subtitle="Bandeja operativa">
              <InfoList
                items={[
                  ...notifications.map((notification) => ({
                    title: notification.title,
                    description: notification.meta,
                    badge: notification.kind,
                  })),
                  ...auditItems.map((entry) => ({
                    title: `${entry.employeeName} · ${entry.trigger}`,
                    description: `${entry.summary} ${entry.executedAt}.`,
                    badge: entry.status,
                  })),
                ]}
              />
            </SectionCard>
          }
          right={
            <SectionCard title="Reglas que generan notificaciones" subtitle="Orquestacion">
              <InfoList
                items={ruleItems.map((rule) => ({
                  title: rule.name,
                  description: `${rule.trigger}. ${rule.consequences.slice(0, 2).join(" y ")}.`,
                  badge: rule.status,
                }))}
              />
            </SectionCard>
          }
        />

        <SectionCard title="Auditoria visible para el usuario" subtitle="Consecuencias notificadas">
          <div className="grid gap-4 xl:grid-cols-3">
            {auditItems.map((entry) => (
              <article key={entry.id} className="rounded-3xl border border-border/70 bg-secondary/20 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{entry.actor}</p>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{entry.employeeName}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {entry.ruleName} · {entry.executedAt}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.consequences.map((consequence) => (
                    <span
                      key={consequence}
                      className="rounded-full border border-border/70 bg-card/90 px-3 py-1 text-xs text-foreground"
                    >
                      {consequence}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
