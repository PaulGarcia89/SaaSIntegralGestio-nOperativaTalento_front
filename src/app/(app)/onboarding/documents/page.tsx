"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ClipboardList, ShieldCheck, Users2 } from "lucide-react";
import { toast } from "sonner";
import { completeOnboardingAutomation, fetchOnboardingWorkspace } from "@/lib/mock-backend";
import { MasterWorkflowCard } from "@/components/master-workflow-card";
import { useAppStore } from "@/store/app-store";
import { ModuleHeader, SectionCard, DataTable, SplitPanel, InfoList } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TODAY_REFERENCE = "2026-07-16";

function parseDateLabel(label: string) {
  if (label === "Hoy") return TODAY_REFERENCE;
  if (label === "Listo") return TODAY_REFERENCE;

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

function deadlineTone(deadline: string) {
  const parsed = parseDateLabel(deadline);
  if (!parsed) return { label: "Seguimiento", className: "bg-slate-500/15 text-slate-700" };
  if (parsed < TODAY_REFERENCE) return { label: "Vencido", className: "bg-rose-500/15 text-rose-700" };
  if (parsed === TODAY_REFERENCE) return { label: "Hoy", className: "bg-amber-500/15 text-amber-700" };
  return { label: "En tiempo", className: "bg-sky-500/15 text-sky-700" };
}

function taskTone(status: "Pendiente" | "En curso" | "Completado" | "Bloqueado") {
  if (status === "Completado") return "bg-emerald-500/15 text-emerald-700";
  if (status === "Bloqueado") return "bg-rose-500/15 text-rose-700";
  if (status === "En curso") return "bg-amber-500/15 text-amber-700";
  return "bg-slate-500/15 text-slate-700";
}

export default function DocumentsPage() {
  const { currentTenant } = useAppStore();
  const queryClient = useQueryClient();
  const onboardingQuery = useQuery({
    queryKey: ["onboarding-workspace", currentTenant.id],
    queryFn: () => fetchOnboardingWorkspace(currentTenant.id),
  });
  const refreshOnboardingQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["onboarding-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["productivity-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["inventory-activations", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["training-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["master-workflow-card", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["automation-summary", currentTenant.id] });
  };
  const completeMutation = useMutation({
    mutationFn: (employeeName: string) => completeOnboardingAutomation(employeeName),
    onSuccess: () => {
      refreshOnboardingQueries();
      toast.success("Incorporacion completada desde gestión documental");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo completar la incorporacion"),
  });

  if (onboardingQuery.isLoading || !onboardingQuery.data) {
    return <SectionCard title="Cargando incorporacion" subtitle="Gestion documental">Preparando expedientes, alistamiento y responsables del ingreso.</SectionCard>;
  }

  const actorSummary = onboardingQuery.data.actorWorkspaces;

  return (
    <>
      <ModuleHeader
        eyebrow="Gestion documental"
        title="Documentos, versiones, vencimientos y estado del ingreso."
        description="Una interfaz clara para revisar archivos, detectar pendientes y acelerar la incorporacion."
        actions={
          <Button asChild>
            <Link href="/onboarding/signatures">Ver firmas</Link>
          </Button>
        }
        metrics={[
          { label: "Expedientes activos", value: "3", detail: "Ingresos en seguimiento documental esta semana" },
          { label: "Pendientes criticos", value: "1", detail: "Documento necesario antes de fecha de inicio" },
          { label: "Dia 1 listo", value: "1/3", detail: "Solo un ingreso esta completamente listo para iniciar" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Estado documental" subtitle="Incorporacion">
            <div className="space-y-5">
              <MasterWorkflowCard />

              <DataTable
                columns={["Documento", "Colaborador", "Estado", "Vencimiento"]}
                rows={onboardingQuery.data.documents.map((document) => [
                  document.name,
                  document.owner,
                  document.status,
                  document.expires,
                ])}
              />

              <SectionCard title="Acciones de cierre por expediente" subtitle="CTA contextual">
                <div className="space-y-3">
                  {onboardingQuery.data.signaturePackages.map((pkg) => (
                    <div key={pkg.id} className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{pkg.employeeName}</p>
                          <p className="text-sm text-muted-foreground">{pkg.title}</p>
                          <p className="text-sm leading-6 text-muted-foreground">{pkg.nextAction}</p>
                        </div>
                        <Button
                          variant={pkg.status === "Completado" ? "secondary" : "default"}
                          disabled={pkg.status === "Completado" || completeMutation.isPending}
                          onClick={() => completeMutation.mutate(pkg.employeeName)}
                        >
                          {pkg.status === "Completado"
                            ? "Incorporacion cerrada"
                            : completeMutation.isPending
                              ? "Actualizando..."
                              : "Completar incorporacion"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                      <Users2 className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Actor principal</p>
                      <p className="font-medium text-foreground">Colaborador</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                      <ClipboardList className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Checklists activos</p>
                      <p className="font-medium text-foreground">3 responsables por ingreso</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Regla operativa</p>
                      <p className="font-medium text-foreground">No hay ingreso listo con bloqueo activo</p>
                    </div>
                  </div>
                </div>
              </div>

              <SectionCard title="Dia 1 listo / no listo" subtitle="Alistamiento operativo">
                <div className="space-y-3">
                  {onboardingQuery.data.readiness.map((item) => (
                    <div key={item.person} className="rounded-2xl border border-border/70 bg-card/90 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{item.person}</p>
                          <p className="text-sm text-muted-foreground">{item.role} · {item.branch}</p>
                          <p className="text-sm leading-6 text-muted-foreground">
                            Responsable activo: {item.owner}. Bloqueo: {item.blocker}. Vencimiento: {item.dueDate}.
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="rounded-full border border-border/70 bg-secondary/25 px-3 py-1 text-xs text-foreground">
                            {item.readiness}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              item.dayOneReady === "Listo"
                                ? "bg-emerald-500/15 text-emerald-700"
                                : item.dayOneReady === "En riesgo"
                                  ? "bg-amber-500/15 text-amber-700"
                                  : "bg-rose-500/15 text-rose-700"
                            }`}
                          >
                            {item.dayOneReady}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </SectionCard>
        }
        right={
          <SectionCard title="Checklist por actor" subtitle="Responsables del ingreso">
            <div className="space-y-5">
              <Tabs defaultValue="colaborador" className="space-y-5">
                <TabsList>
                  <TabsTrigger value="colaborador">Colaborador</TabsTrigger>
                  <TabsTrigger value="manager">Supervisor</TabsTrigger>
                  <TabsTrigger value="rrhh">RRHH</TabsTrigger>
                  <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
                </TabsList>

                <TabsContent value="colaborador" className="space-y-4">
                  {actorSummary
                    .filter((actor) => actor.owner === "Colaborador")
                    .map((actor) => {
                      const deadlineState = deadlineTone(actor.deadline);
                      return (
                        <div key={actor.owner} className="space-y-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Bloqueo actual</p>
                              <p className="mt-2 font-medium text-foreground">{actor.blocker}</p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Evidencia disponible</p>
                              <p className="mt-2 font-medium text-foreground">{actor.evidenceSummary}</p>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
                              <p className="text-sm text-muted-foreground">Progreso</p>
                              <p className="mt-1 text-2xl font-semibold text-foreground">{actor.progress}</p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
                              <p className="text-sm text-muted-foreground">SLA</p>
                              <p className="mt-1 font-medium text-foreground">{actor.sla}</p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
                              <p className="text-sm text-muted-foreground">Vencimiento</p>
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <p className="font-medium text-foreground">{actor.deadline}</p>
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${deadlineState.className}`}>{deadlineState.label}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {actor.tasks.map((task) => (
                              <div key={task.id} className="rounded-2xl border border-border/70 bg-card/90 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      {task.status === "Completado" ? (
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                      ) : (
                                        <AlertTriangle className="size-4 text-amber-600" />
                                      )}
                                      <p className="font-medium text-foreground">{task.title}</p>
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">{task.description}</p>
                                    <p className="text-sm leading-6 text-muted-foreground">Bloqueo: {task.blocker}</p>
                                  </div>
                                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${taskTone(task.status)}`}>{task.status}</span>
                                </div>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                  <div className="rounded-2xl border border-border/60 bg-secondary/20 p-3">
                                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">SLA</p>
                                    <p className="mt-2 text-sm font-medium text-foreground">{task.sla}</p>
                                  </div>
                                  <div className="rounded-2xl border border-border/60 bg-secondary/20 p-3">
                                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Evidencia</p>
                                    <ul className="mt-2 space-y-1 text-sm text-foreground">
                                      {task.evidence.map((evidence) => (
                                        <li key={evidence}>{evidence}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </TabsContent>
                <TabsContent value="manager" className="space-y-4">
                  {actorSummary
                    .filter((actor) => actor.owner === "Supervisor")
                    .map((actor) => {
                      const deadlineState = deadlineTone(actor.deadline);
                      return (
                        <div key={actor.owner} className="space-y-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Bloqueo actual</p>
                              <p className="mt-2 font-medium text-foreground">{actor.blocker}</p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Evidencia disponible</p>
                              <p className="mt-2 font-medium text-foreground">{actor.evidenceSummary}</p>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4"><p className="text-sm text-muted-foreground">Progreso</p><p className="mt-1 text-2xl font-semibold text-foreground">{actor.progress}</p></div>
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4"><p className="text-sm text-muted-foreground">SLA</p><p className="mt-1 font-medium text-foreground">{actor.sla}</p></div>
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4"><p className="text-sm text-muted-foreground">Vencimiento</p><div className="mt-2 flex items-center justify-between gap-3"><p className="font-medium text-foreground">{actor.deadline}</p><span className={`rounded-full px-3 py-1 text-xs font-medium ${deadlineState.className}`}>{deadlineState.label}</span></div></div>
                          </div>
                          <InfoList items={actor.tasks.map((task) => ({ title: task.title, description: `${task.description} Bloqueo: ${task.blocker}. Evidencia: ${task.evidence.join(", ")}.`, badge: task.status }))} />
                        </div>
                      );
                    })}
                </TabsContent>
                <TabsContent value="rrhh" className="space-y-4">
                  {actorSummary
                    .filter((actor) => actor.owner === "RRHH")
                    .map((actor) => {
                      const deadlineState = deadlineTone(actor.deadline);
                      return (
                        <div key={actor.owner} className="space-y-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Bloqueo actual</p>
                              <p className="mt-2 font-medium text-foreground">{actor.blocker}</p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Evidencia disponible</p>
                              <p className="mt-2 font-medium text-foreground">{actor.evidenceSummary}</p>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4"><p className="text-sm text-muted-foreground">Progreso</p><p className="mt-1 text-2xl font-semibold text-foreground">{actor.progress}</p></div>
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4"><p className="text-sm text-muted-foreground">SLA</p><p className="mt-1 font-medium text-foreground">{actor.sla}</p></div>
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4"><p className="text-sm text-muted-foreground">Vencimiento</p><div className="mt-2 flex items-center justify-between gap-3"><p className="font-medium text-foreground">{actor.deadline}</p><span className={`rounded-full px-3 py-1 text-xs font-medium ${deadlineState.className}`}>{deadlineState.label}</span></div></div>
                          </div>
                          <InfoList items={actor.tasks.map((task) => ({ title: task.title, description: `${task.description} Bloqueo: ${task.blocker}. Evidencia: ${task.evidence.join(", ")}.`, badge: task.status }))} />
                        </div>
                      );
                    })}
                </TabsContent>
                <TabsContent value="compliance" className="space-y-4">
                  {actorSummary
                    .filter((actor) => actor.owner === "Cumplimiento")
                    .map((actor) => {
                      const deadlineState = deadlineTone(actor.deadline);
                      return (
                        <div key={actor.owner} className="space-y-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Bloqueo actual</p>
                              <p className="mt-2 font-medium text-foreground">{actor.blocker}</p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Evidencia disponible</p>
                              <p className="mt-2 font-medium text-foreground">{actor.evidenceSummary}</p>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4"><p className="text-sm text-muted-foreground">Progreso</p><p className="mt-1 text-2xl font-semibold text-foreground">{actor.progress}</p></div>
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4"><p className="text-sm text-muted-foreground">SLA</p><p className="mt-1 font-medium text-foreground">{actor.sla}</p></div>
                            <div className="rounded-2xl border border-border/70 bg-card/90 p-4"><p className="text-sm text-muted-foreground">Vencimiento</p><div className="mt-2 flex items-center justify-between gap-3"><p className="font-medium text-foreground">{actor.deadline}</p><span className={`rounded-full px-3 py-1 text-xs font-medium ${deadlineState.className}`}>{deadlineState.label}</span></div></div>
                          </div>
                          <InfoList items={actor.tasks.map((task) => ({ title: task.title, description: `${task.description} Bloqueo: ${task.blocker}. Evidencia: ${task.evidence.join(", ")}.`, badge: task.status }))} />
                        </div>
                      );
                    })}
                </TabsContent>
              </Tabs>

              <div className="rounded-3xl border border-border/70 bg-secondary/20 p-4">
                <p className="text-sm font-medium text-foreground">Carga documental</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Sube soportes para el actor que tenga el bloqueo activo y acelera el readiness del ingreso.
                </p>
                <div className="mt-4">
                  <FileUpload maxFiles={3} onFiles={(files) => console.log("Archivos seleccionados:", files)} />
                </div>
              </div>

              <InfoList
                items={onboardingQuery.data.progressByOwner.map((item) => ({
                  title: `${item.owner} · ${item.progress}`,
                  description: `Bloqueo actual: ${item.blocker}. Fecha compromiso: ${item.deadline}.`,
                  badge: item.owner === "Cumplimiento" ? "Auditoria" : "Responsable",
                }))}
              />
            </div>
          </SectionCard>
        }
      />
    </>
  );
}
