"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, RefreshCw, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { applyOnboardingTemplateBulk, fetchOnboardingAutomationOverview, fetchOnboardingFlows, fetchOnboardingTemplates, getApiErrorMessage, runOnboardingDueTaskAutomation } from "@/lib/backend";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";

export default function OnboardingOperationsPage() {
  const { can } = useAppStore();
  const queryClient = useQueryClient();
  const [selectedFlowIds, setSelectedFlowIds] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [startDate, setStartDate] = useState("");
  const overview = useQuery({ queryKey: ["onboarding-automation-overview"], queryFn: fetchOnboardingAutomationOverview, enabled: can("onboarding.view") });
  const flows = useQuery({ queryKey: ["onboarding-cohort-flows"], queryFn: () => fetchOnboardingFlows({ page: 1, pageSize: 100, status: "IN_PROGRESS" }), enabled: can("onboarding.manage") });
  const templates = useQuery({ queryKey: ["onboarding-templates"], queryFn: fetchOnboardingTemplates, enabled: can("onboarding.manage") });
  const process = useMutation({
    mutationFn: runOnboardingDueTaskAutomation,
    onSuccess: async (result) => {
      toast.success(`${result.reminders} recordatorios, ${result.escalations} escalaciones y ${result.reassignments} reasignaciones procesadas.`);
      await queryClient.invalidateQueries({ queryKey: ["onboarding-automation-overview"] });
      await queryClient.invalidateQueries({ queryKey: ["onboarding-flows"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible procesar las tareas vencidas.")),
  });
  const applyCohort = useMutation({
    mutationFn: () => applyOnboardingTemplateBulk({ flowIds: selectedFlowIds, templateId, ...(startDate ? { startDate: new Date(`${startDate}T12:00:00`).toISOString() } : {}) }),
    onSuccess: async (result) => { toast.success(`${result.applied} expedientes actualizados${result.failed.length ? `; ${result.failed.length} con incidencia` : ""}.`); setSelectedFlowIds([]); await queryClient.invalidateQueries({ queryKey: ["onboarding-flows"] }); await queryClient.invalidateQueries({ queryKey: ["onboarding-cohort-flows"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible aplicar la plantilla a la cohorte.")),
  });

  if (overview.isLoading) return <AsyncState state="loading" title="Cargando automatización de incorporación" />;
  if (overview.isError || !overview.data) return <AsyncState state="error" title="No fue posible cargar la automatización" onRetry={() => void overview.refetch()} />;
  const data = overview.data;
  return <div className="space-y-7">
    <PageHeader eyebrow="Incorporación" title="Automatización operativa" description="Controla tareas vencidas, recordatorios, escalamiento y reasignación segura por disponibilidad y carga." actions={<Button asChild variant="secondary"><Link href="/onboarding/documents">Ver incorporaciones</Link></Button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Tareas vencidas" value={String(data.overdue)} detail="Pendientes de intervención" />
      <Metric label="Recordatorio" value={`${data.reminderHours} h`} detail="Desde el vencimiento" />
      <Metric label="Escalamiento" value={`${data.escalationHours} h`} detail="A supervisor o responsable" />
      <Metric label="Reasignación" value={`${data.reassignmentHours} h`} detail={data.autoReassignmentEnabled ? "Balanceada y activa" : "Desactivada"} />
    </div>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><BellRing className="size-5 text-brand" />Procesamiento de vencimientos</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">El worker se ejecuta periódicamente. Esta acción permite una ejecución controlada: evita duplicados, conserva el historial y solo reasigna cuando el responsable no está disponible en la sucursal.</p>
        <div className="flex flex-wrap items-center gap-3"><Badge variant={data.enabled ? "success" : "warning"}>{data.enabled ? "Worker activo" : "Worker desactivado"}</Badge><Badge variant={data.processing ? "warning" : "secondary"}>{data.processing ? "Procesando" : "En espera"}</Badge>{can("onboarding.manage") ? <Button onClick={() => process.mutate()} disabled={process.isPending || data.processing}><RefreshCw className={`size-4 ${process.isPending ? "animate-spin" : ""}`} />{process.isPending ? "Procesando..." : "Procesar tareas vencidas"}</Button> : null}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><UsersRound className="size-5 text-brand" />Cohortes de ingreso</CardTitle></CardHeader>
      <CardContent className="space-y-4"><p className="text-sm leading-6 text-muted-foreground">Selecciona expedientes pendientes, una plantilla y una fecha de inicio común. La operación conserva tareas completadas y registra cada cambio en el timeline.</p>{!can("onboarding.manage") ? <Badge variant="warning">Solo lectura</Badge> : <><div className="grid gap-3 md:grid-cols-2"><div className="space-y-1"><Label>Plantilla</Label><Select value={templateId} onValueChange={setTemplateId}><SelectTrigger><SelectValue placeholder="Selecciona una plantilla" /></SelectTrigger><SelectContent>{templates.data?.filter((item) => item.isActive).map((item) => <SelectItem key={item.id} value={item.id}>{item.name} v{item.version}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label htmlFor="cohort-start-date">Fecha de inicio</Label><Input id="cohort-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div></div>{flows.isLoading ? <p className="text-sm text-muted-foreground">Cargando expedientes elegibles...</p> : <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border p-3">{flows.data?.items.map((flow) => { const checked = selectedFlowIds.includes(flow.id); return <label key={flow.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"><input type="checkbox" checked={checked} onChange={() => setSelectedFlowIds((current) => checked ? current.filter((id) => id !== flow.id) : [...current, flow.id])} /><span className="min-w-0"><span className="block font-medium">{flow.employee.name}</span><span className="block text-xs text-muted-foreground">{flow.employee.jobTitle || flow.employee.email} · {flow.progressPercent}%</span></span></label>; })}{!flows.data?.items.length ? <p className="p-2 text-sm text-muted-foreground">No hay expedientes en incorporación para formar una cohorte.</p> : null}</div>}<div className="flex flex-wrap items-center gap-3"><Badge variant="secondary">{selectedFlowIds.length} seleccionados</Badge><Button onClick={() => applyCohort.mutate()} disabled={!templateId || !selectedFlowIds.length || applyCohort.isPending}>{applyCohort.isPending ? "Aplicando..." : "Aplicar plantilla a cohorte"}</Button></div></>}</CardContent>
    </Card>
  </div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>; }
