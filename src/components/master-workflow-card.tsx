"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  completeComplianceAutomation,
  completeOnboardingAutomation,
  completeOperationalHandoffAutomation,
  completeTrainingAutomation,
  confirmInventoryAssignmentAutomation,
  fetchMasterWorkflowCard,
} from "@/lib/mock-backend";
import { useAppStore } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui";
import { Button } from "@/components/ui/button";

const TODAY_REFERENCE = "2026-07-16";

function stepTone(status: "completed" | "in_progress" | "pending") {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-700";
  if (status === "in_progress") return "bg-amber-500/15 text-amber-700";
  return "bg-slate-500/15 text-slate-700";
}

function parseOperationalDate(label: string) {
  const months: Record<string, string> = {
    ene: "01",
    feb: "02",
    mar: "03",
    abr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    ago: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dic: "12",
  };

  const match = label.trim().match(/^(\d{1,2})\s([a-z]{3})\s(\d{4})$/i);
  if (!match) return null;

  const [, day, monthLabel, year] = match;
  const month = months[monthLabel.toLowerCase()];
  if (!month) return null;

  return `${year}-${month}-${day.padStart(2, "0")}`;
}

function slaTone(targetDate: string, status: "completed" | "in_progress" | "pending") {
  if (status === "completed") {
    return {
      label: "En tiempo",
      badgeClass: "bg-emerald-500/15 text-emerald-700",
      panelClass: "border-emerald-500/25 bg-emerald-500/5",
    };
  }

  const parsedDate = parseOperationalDate(targetDate);
  if (!parsedDate) {
    return {
      label: "Sin fecha",
      badgeClass: "bg-slate-500/15 text-slate-700",
      panelClass: "border-border/60 bg-card/80",
    };
  }

  if (parsedDate < TODAY_REFERENCE) {
    return {
      label: "Vencido",
      badgeClass: "bg-rose-500/15 text-rose-700",
      panelClass: "border-rose-500/25 bg-rose-500/5",
    };
  }

  if (parsedDate === TODAY_REFERENCE) {
    return {
      label: "En riesgo",
      badgeClass: "bg-amber-500/15 text-amber-700",
      panelClass: "border-amber-500/25 bg-amber-500/5",
    };
  }

  return {
    label: "En tiempo",
    badgeClass: "bg-sky-500/15 text-sky-700",
    panelClass: "border-sky-500/25 bg-sky-500/5",
  };
}

export function MasterWorkflowCard() {
  const { currentTenant } = useAppStore();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const workflowQuery = useQuery({
    queryKey: ["master-workflow-card", currentTenant.id],
    queryFn: () => fetchMasterWorkflowCard(currentTenant.id),
  });

  const refreshQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["master-workflow-card", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["onboarding-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["inventory-activations", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["training-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["productivity-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-compliance-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["automation-summary", currentTenant.id] });
  };

  const actionMutation = useMutation({
    mutationFn: async ({
      action,
      employeeName,
    }: {
      action: "onboarding" | "inventory" | "training" | "operation" | "compliance";
      employeeName: string;
    }) => {
      if (action === "onboarding") return completeOnboardingAutomation(employeeName);
      if (action === "inventory") return confirmInventoryAssignmentAutomation(employeeName);
      if (action === "training") return completeTrainingAutomation(employeeName);
      if (action === "operation") return completeOperationalHandoffAutomation(employeeName);
      return completeComplianceAutomation(employeeName);
    },
    onSuccess: (_, variables) => {
      refreshQueries();
      const messages = {
        onboarding: "Incorporacion completada desde el flujo maestro",
        inventory: "Activo asignado desde el flujo maestro",
        training: "Formación completada desde el flujo maestro",
        operation: "Paso a operación completado desde el flujo maestro",
        compliance: "Cumplimiento cerrado desde el flujo maestro",
      };
      toast.success(messages[variables.action]);
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo ejecutar la acción del flujo"),
  });

  if (workflowQuery.isLoading || !workflowQuery.data) {
    return null;
  }

  const card = workflowQuery.data;
  const stepsByLabel = Object.fromEntries(card.steps.map((step) => [step.label, step])) as Record<string, typeof card.steps[number]>;
  const onboardingStep = stepsByLabel.Incorporacion;
  const trainingStep = stepsByLabel.Formacion;
  const operationStep = stepsByLabel.Operacion;
  const complianceStep = stepsByLabel["Administracion y cumplimiento"];
  const inventoryReady = onboardingStep?.status === "completed" && trainingStep?.status === "pending";

  const contextualAction = (() => {
    if (onboardingStep && onboardingStep.status !== "completed") {
      return pathname.startsWith("/onboarding")
        ? { type: "action" as const, action: "onboarding" as const, label: "Completar incorporacion" }
        : { type: "link" as const, href: "/onboarding/documents", label: "Ir a incorporacion" };
    }

    if (inventoryReady) {
      return pathname.startsWith("/inventory")
        ? { type: "action" as const, action: "inventory" as const, label: "Confirmar activo" }
        : { type: "link" as const, href: "/inventory", label: "Ir a inventario" };
    }

    if (trainingStep && trainingStep.status !== "completed") {
      return pathname.startsWith("/training")
        ? { type: "action" as const, action: "training" as const, label: "Cerrar formación" }
        : { type: "link" as const, href: "/training", label: "Ir a formación" };
    }

    if (operationStep && operationStep.status !== "completed") {
      return pathname.startsWith("/productivity")
        ? { type: "action" as const, action: "operation" as const, label: "Marcar paso a operación" }
        : { type: "link" as const, href: "/productivity", label: "Ir a operación" };
    }

    if (complianceStep && complianceStep.status !== "completed") {
      return pathname.startsWith("/admin")
        ? { type: "action" as const, action: "compliance" as const, label: "Cerrar cumplimiento" }
        : { type: "link" as const, href: "/admin", label: "Ir a administración" };
    }

    return null;
  })();

  return (
    <SectionCard title="Flujo maestro compartido" subtitle="Orquestacion transversal">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {card.workflowType === "hiring" ? "Alta coordinada" : card.workflowType}
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              {card.employeeName}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {card.branchName} · {card.currentStage}
            </p>
          </div>
          <Badge className="rounded-full px-3 py-1">{card.globalStatus}</Badge>
        </div>

        {contextualAction ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-secondary/20 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Siguiente mejor acción</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Avanza el flujo desde esta misma tarjeta según la etapa actual visible para {card.employeeName}.
              </p>
            </div>
            {contextualAction.type === "link" ? (
              <Button asChild>
                <Link href={contextualAction.href}>{contextualAction.label}</Link>
              </Button>
            ) : (
              <Button
                onClick={() => actionMutation.mutate({ action: contextualAction.action, employeeName: card.employeeName })}
                disabled={actionMutation.isPending}
              >
                {actionMutation.isPending ? "Actualizando..." : contextualAction.label}
              </Button>
            )}
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso maestro</span>
            <strong className="text-foreground">{card.progressPercent}%</strong>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-secondary/50">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${card.progressPercent}%` }}
            />
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{card.summary}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {card.steps.map((step) => {
            const slaState = slaTone(step.targetDate, step.status);

            return (
            <div key={step.id} className="rounded-2xl border border-border/70 bg-secondary/20 p-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="max-w-[70%] text-xl font-semibold leading-8 text-foreground">{step.label}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${stepTone(step.status)}`}>
                    {step.status === "completed" ? "Completo" : step.status === "in_progress" ? "En curso" : "Pendiente"}
                  </span>
                </div>
                <p className="text-base leading-8 text-muted-foreground">{step.detail}</p>
                <div className={`grid gap-3 rounded-xl border p-4 ${slaState.panelClass}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="uppercase tracking-[0.16em] text-muted-foreground">Semáforo SLA</span>
                    <span className={`rounded-full px-2.5 py-1 font-medium ${slaState.badgeClass}`}>
                      {slaState.label}
                    </span>
                  </div>
                  <div className="grid gap-1 text-xs">
                    <span className="uppercase tracking-[0.16em] text-muted-foreground">Responsable</span>
                    <span className="text-sm font-semibold leading-6 text-foreground break-words">{step.owner}</span>
                  </div>
                  <div className="grid gap-1 text-xs">
                    <span className="uppercase tracking-[0.16em] text-muted-foreground">SLA</span>
                    <span className="text-sm font-semibold leading-6 text-foreground break-words">{step.sla}</span>
                  </div>
                  <div className="grid gap-1 text-xs">
                    <span className="uppercase tracking-[0.16em] text-muted-foreground">Fecha objetivo</span>
                    <span className="text-sm font-semibold leading-6 text-foreground">{step.targetDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>

        {card.blockers.length > 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
            <p className="text-sm font-medium text-foreground">Bloqueos o pendientes clave</p>
            <div className="mt-3 space-y-2">
              {card.blockers.slice(0, 3).map((blocker) => (
                <p key={blocker} className="text-sm leading-6 text-muted-foreground">
                  {blocker}
                </p>
              ))}
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {card.updatedAtLabel}
            </p>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
