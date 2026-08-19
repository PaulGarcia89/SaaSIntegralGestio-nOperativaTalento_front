"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Beaker, Bot, Copy, Pause, Play, Plus, RefreshCw, Search, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { trackProductEvent } from "@/lib/product-analytics";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { MetricCard } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createAutomationRule,
  createAutomationFromTemplate,
  bulkRetryAutomationExecutions,
  bulkUpdateAutomationRules,
  deleteAutomationRule,
  duplicateAutomationRule,
  fetchAutomationCatalog,
  fetchAutomationTemplates,
  fetchAutomationExecutions,
  fetchAutomationOperationsOverview,
  fetchAutomationRules,
  fetchBranches,
  simulateAutomationRule,
  retryAutomationExecution,
  updateAutomationRule,
  type SaveNoCodeAutomationRuleInput,
} from "@/lib/backend";
import type {
  NoCodeAutomationAction,
  NoCodeAutomationCatalogDto,
  NoCodeAutomationCondition,
  NoCodeAutomationExecutionDto,
  NoCodeAutomationRuleDto,
  NoCodeAutomationSimulationDto,
} from "@/lib/contracts";

const emptyRule = (catalog: NoCodeAutomationCatalogDto): SaveNoCodeAutomationRuleInput => ({
  name: "",
  triggerEvent: catalog.triggers[0].value,
  scope: "TENANT",
  enabled: false,
  conditions: [],
  consequences: [{ type: catalog.actions[0].value }],
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function executionTone(status: NoCodeAutomationExecutionDto["status"]) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "FAILED" || status === "PARTIAL") return "destructive" as const;
  return "warning" as const;
}

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<NoCodeAutomationRuleDto | "new" | null>(null);
  const [simulation, setSimulation] = useState<NoCodeAutomationSimulationDto | null>(null);
  const [execution, setExecution] = useState<NoCodeAutomationExecutionDto | null>(null);
  const [ruleSearch, setRuleSearch] = useState("");
  const [executionSearch, setExecutionSearch] = useState("");
  const [executionStatus, setExecutionStatus] = useState("ALL");
  const [rulePage, setRulePage] = useState(1);
  const [executionPage, setExecutionPage] = useState(1);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [selectedExecutions, setSelectedExecutions] = useState<string[]>([]);
  const deferredRuleSearch = useDeferredValue(ruleSearch);
  const deferredExecutionSearch = useDeferredValue(executionSearch);
  const catalog = useQuery({ queryKey: ["automation-catalog"], queryFn: fetchAutomationCatalog });
  const templates = useQuery({ queryKey: ["automation-templates"], queryFn: fetchAutomationTemplates });
  const overview = useQuery({ queryKey: ["automation-operations-overview"], queryFn: fetchAutomationOperationsOverview });
  const rules = useQuery({ queryKey: ["automation-rules", rulePage, deferredRuleSearch], queryFn: () => fetchAutomationRules({ page: rulePage, pageSize: 24, search: deferredRuleSearch || undefined }) });
  const executions = useQuery({ queryKey: ["automation-executions", executionPage, deferredExecutionSearch, executionStatus], queryFn: () => fetchAutomationExecutions({ page: executionPage, pageSize: 25, search: deferredExecutionSearch || undefined, status: executionStatus === "ALL" ? undefined : executionStatus as NoCodeAutomationExecutionDto["status"] }) });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] }),
      queryClient.invalidateQueries({ queryKey: ["automation-executions"] }),
      queryClient.invalidateQueries({ queryKey: ["automation-operations-overview"] }),
    ]);
  };
  const toggle = useMutation({
    mutationFn: (rule: NoCodeAutomationRuleDto) => updateAutomationRule(rule.id, { enabled: !rule.enabled }),
    onSuccess: async () => { toast.success("Estado de la regla actualizado"); await refresh(); },
    onError: showError,
  });
  const duplicate = useMutation({
    mutationFn: duplicateAutomationRule,
    onSuccess: async () => { toast.success("Copia creada como borrador"); await refresh(); },
    onError: showError,
  });
  const remove = useMutation({
    mutationFn: deleteAutomationRule,
    onSuccess: async (result) => { toast.success(result.message); await refresh(); },
    onError: showError,
  });
  const bulkRules = useMutation({ mutationFn: ({ action }: { action: "ENABLE" | "DISABLE" | "DELETE" }) => bulkUpdateAutomationRules(selectedRules, action), onSuccess: async (result) => { setSelectedRules([]); toast.success(`${result.updated + result.deleted} reglas procesadas`); await refresh(); }, onError: showError });
  const retryOne = useMutation({ mutationFn: retryAutomationExecution, onSuccess: async () => { toast.success("Reintento ejecutado"); await refresh(); }, onError: showError });
  const retrySelected = useMutation({ mutationFn: () => bulkRetryAutomationExecutions(selectedExecutions), onSuccess: async (result) => { setSelectedExecutions([]); toast.success(`${result.succeeded} reintentos completados; ${result.failed} con incidencia`); await refresh(); }, onError: showError });
  const createTemplate = useMutation({ mutationFn: (key: string) => createAutomationFromTemplate(key), onSuccess: async (rule, key) => { trackProductEvent({ name: "automation_template_used", template: key }); toast.success(`Plantilla creada como borrador: ${rule.name}`); await refresh(); }, onError: showError });

  if (catalog.isLoading || templates.isLoading || overview.isLoading || rules.isLoading || executions.isLoading) return <AsyncState state="loading" title="Preparando el estudio de automatización" />;
  if (catalog.isError || templates.isError || overview.isError || rules.isError || executions.isError || !catalog.data || !templates.data || !overview.data || !rules.data || !executions.data) {
    return <AsyncState state="error" title="No fue posible cargar las automatizaciones" onRetry={() => { void catalog.refetch(); void templates.refetch(); void overview.refetch(); void rules.refetch(); void executions.refetch(); }} />;
  }

  return <div className="space-y-8">
    <PageHeader eyebrow="Administración" title="Automatización no-code" description="Diseña reglas y opera grandes volúmenes con procesamiento durable, lotes y trazabilidad." actions={<div className="flex gap-2"><Button variant="secondary" onClick={() => void refresh()}><RefreshCw className="size-4" />Actualizar</Button><Button onClick={() => setEditing("new")}><Plus className="size-4" />Nueva automatización</Button></div>} />
    <div className="grid gap-4 md:grid-cols-4">
      <MetricCard label="Reglas activas" value={String(overview.data.rules.active)} detail={`${overview.data.rules.total} configuradas`} period="En tiempo real" />
      <MetricCard label="Volumen 24 h" value={String(overview.data.executions.total)} detail={`${overview.data.executions.inProgress} en curso`} period="Últimas 24 horas" />
      <MetricCard label="Tasa de éxito" value={`${overview.data.executions.successRate}%`} detail={`${overview.data.executions.completed} completadas`} period="Últimas 24 horas" />
      <MetricCard label="Incidencias" value={String(overview.data.executions.failed)} detail="Fallidas o parciales" period="Últimas 24 horas" />
    </div>
    <Card><CardContent className="grid gap-5 pt-6 lg:grid-cols-[1.2fr_1fr]"><div><div className="flex items-center gap-2"><Bot className="size-5 text-primary" /><h2 className="font-semibold">Capacidad operativa</h2></div><p className="mt-2 text-sm text-muted-foreground">Procesamiento mediante outbox durable, workers y recuperación automática de eventos bloqueados.</p><div className="mt-4 flex flex-wrap gap-2"><Badge variant="secondary">{overview.data.capacity.outboxMaxAttempts} intentos por evento</Badge><Badge variant="secondary">{overview.data.capacity.ruleBatchLimit} reglas por lote</Badge><Badge variant="secondary">{overview.data.capacity.retryBatchLimit} reintentos por lote</Badge>{overview.data.executions.oldestPendingAt ? <Badge variant="warning">Pendiente desde {formatDate(overview.data.executions.oldestPendingAt)}</Badge> : <Badge variant="success">Sin acumulación pendiente</Badge>}</div></div><div><p className="text-sm font-semibold">Reglas con mayor volumen, últimas 24 h</p><div className="mt-3 space-y-2">{overview.data.topRules.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/45 px-3 py-2 text-sm"><span className="truncate">{item.name}</span><strong>{item.executions}</strong></div>)}{!overview.data.topRules.length ? <p className="text-sm text-muted-foreground">Sin ejecuciones en el periodo.</p> : null}</div></div></CardContent></Card>
    <section className="space-y-3"><div><h2 className="font-semibold">Plantillas listas para usar</h2><p className="text-sm text-muted-foreground">Crea un borrador desde escenarios habituales, revísalo y simúlalo antes de activarlo. Nunca se ejecuta una plantilla al crearla.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{templates.data.map((template) => <Card key={template.key}><CardContent className="space-y-3 pt-5"><div><p className="font-semibold">{template.name}</p><p className="mt-1 text-sm text-muted-foreground">{template.description}</p></div><div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground"><p><strong className="text-foreground">Disparador:</strong> {catalog.data.triggers.find((item) => item.value === template.triggerEvent)?.label ?? template.triggerEvent}</p><p className="mt-1"><strong className="text-foreground">Impacto previsto:</strong> {template.consequences.length} acciones configurables.</p></div><Button className="w-full" variant="secondary" disabled={createTemplate.isPending} onClick={() => createTemplate.mutate(template.key)}><Plus className="size-4" />Usar como borrador</Button></CardContent></Card>)}</div></section>
    <Tabs defaultValue="rules">
      <TabsList><TabsTrigger value="rules">Reglas</TabsTrigger><TabsTrigger value="executions">Ejecuciones</TabsTrigger></TabsList>
      <TabsContent value="rules" className="pt-5">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border bg-card/80 p-4 lg:flex-row lg:items-center lg:justify-between"><div className="relative max-w-xl flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={ruleSearch} onChange={(event) => { setRuleSearch(event.target.value); setRulePage(1); }} className="pl-9" placeholder="Buscar reglas por nombre" /></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" disabled={!selectedRules.length || bulkRules.isPending} onClick={() => bulkRules.mutate({ action: "ENABLE" })}><Play className="size-4" />Activar ({selectedRules.length})</Button><Button size="sm" variant="secondary" disabled={!selectedRules.length || bulkRules.isPending} onClick={() => bulkRules.mutate({ action: "DISABLE" })}><Pause className="size-4" />Desactivar</Button><Button size="sm" variant="ghost" disabled={!selectedRules.length || bulkRules.isPending} onClick={() => bulkRules.mutate({ action: "DELETE" })}><Trash2 className="size-4 text-destructive" />Eliminar</Button></div></div>
        <div className="grid gap-4 xl:grid-cols-2">{rules.data.data.map((rule) => {
          const trigger = catalog.data.triggers.find((item) => item.value === rule.triggerEvent);
          return <Card key={rule.id} className="overflow-hidden"><CardHeader className="border-b bg-card/80"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><input type="checkbox" disabled={!selectedRules.includes(rule.id) && selectedRules.length >= overview.data.capacity.ruleBatchLimit} className="mt-1 size-4 accent-primary" checked={selectedRules.includes(rule.id)} onChange={() => setSelectedRules((items) => items.includes(rule.id) ? items.filter((id) => id !== rule.id) : [...items, rule.id])} aria-label={`Seleccionar ${rule.name}`} /><div><div className="flex flex-wrap items-center gap-2"><CardTitle>{rule.name}</CardTitle><Badge variant={rule.enabled ? "success" : "secondary"}>{rule.enabled ? "Activa" : "Borrador"}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Versión {rule.version} · {rule.scope === "TENANT" ? "Toda la empresa" : "Sucursal"}</p></div></div><Zap className="size-5 text-primary" /></div></CardHeader><CardContent className="space-y-4 pt-5"><div className="rounded-xl bg-muted/45 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cuando</p><p className="mt-1 font-medium">{trigger?.label ?? rule.triggerEvent}</p><p className="text-sm text-muted-foreground">{trigger?.description}</p></div><div className="grid gap-3 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Condiciones</p><p className="font-semibold">{rule.conditions?.length ?? 0}</p></div><div><p className="text-xs text-muted-foreground">Acciones en secuencia</p><p className="font-semibold">{rule.consequences.length}</p></div></div><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => setEditing(rule)}>Editar</Button><Button size="sm" variant="secondary" onClick={() => toggle.mutate(rule)}>{rule.enabled ? <Pause className="size-4" /> : <Play className="size-4" />}{rule.enabled ? "Desactivar" : "Activar"}</Button><Button size="sm" variant="ghost" onClick={() => duplicate.mutate(rule.id)}><Copy className="size-4" />Duplicar</Button><Button size="icon" variant="ghost" aria-label={`Eliminar ${rule.name}`} onClick={() => remove.mutate(rule.id)}><Trash2 className="size-4 text-destructive" /></Button></div></CardContent></Card>;
        })}</div>
        <Pagination page={rules.data.meta.page} totalPages={rules.data.meta.totalPages} onPage={setRulePage} />
        {!rules.data.data.length ? <Card><CardContent className="flex flex-col items-center py-16 text-center"><Bot className="mb-4 size-10 text-primary" /><h2 className="text-xl font-semibold">Crea tu primera automatización</h2><p className="mt-2 max-w-lg text-sm text-muted-foreground">Conecta eventos reales del sistema con acciones auditables. La regla inicia como borrador para que puedas simularla.</p><Button className="mt-5" onClick={() => setEditing("new")}><Plus className="size-4" />Crear regla</Button></CardContent></Card> : null}
      </TabsContent>
      <TabsContent value="executions" className="space-y-4 pt-5"><div className="flex flex-col gap-3 rounded-2xl border bg-card/80 p-4 lg:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={executionSearch} onChange={(event) => { setExecutionSearch(event.target.value); setExecutionPage(1); }} className="pl-9" placeholder="Buscar regla, empleado o candidato" /></div><FormSelect className="min-w-48" value={executionStatus} onValueChange={(value) => { setExecutionStatus(value); setExecutionPage(1); }} options={[{ value: "ALL", label: "Todos los estados" }, { value: "COMPLETED", label: "Completadas" }, { value: "FAILED", label: "Fallidas" }, { value: "PARTIAL", label: "Parciales" }, { value: "IN_PROGRESS", label: "En curso" }, { value: "PENDING", label: "Pendientes" }]} /><Button variant="secondary" disabled={!selectedExecutions.length || retrySelected.isPending} onClick={() => retrySelected.mutate()}><RefreshCw className="size-4" />Reintentar ({selectedExecutions.length})</Button></div><Card><CardContent className="p-0"><div className="divide-y">{executions.data.data.map((item) => { const retryable = item.status === "FAILED" || item.status === "PARTIAL"; const atLimit = selectedExecutions.length >= overview.data.capacity.retryBatchLimit && !selectedExecutions.includes(item.id); return <div key={item.id} className="flex items-center gap-3 p-5"><input type="checkbox" disabled={!retryable || atLimit} className="size-4 accent-primary" checked={selectedExecutions.includes(item.id)} onChange={() => setSelectedExecutions((items) => items.includes(item.id) ? items.filter((id) => id !== item.id) : [...items, item.id])} aria-label={`Seleccionar ejecución de ${item.rule.name}`} /><button type="button" onClick={() => setExecution(item)} className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"><div className="min-w-0"><p className="truncate font-semibold">{item.rule.name}</p><p className="text-sm text-muted-foreground">{item.steps.length} acciones · {formatDate(item.startedAt)}</p></div><Badge variant={executionTone(item.status)}>{executionStatusLabel(item.status)}</Badge></button>{retryable ? <Button size="icon" variant="ghost" aria-label="Reintentar ejecución" disabled={retryOne.isPending} onClick={() => retryOne.mutate(item.id)}><RefreshCw className="size-4" /></Button> : null}</div>; })}</div>{!executions.data.data.length ? <p className="p-12 text-center text-sm text-muted-foreground">No hay ejecuciones para estos filtros.</p> : null}</CardContent></Card><Pagination page={executions.data.meta.page} totalPages={executions.data.meta.totalPages} onPage={setExecutionPage} /></TabsContent>
    </Tabs>
    <RuleEditor key={editing === "new" ? "new" : editing?.id ?? "closed"} open={editing !== null} rule={editing === "new" ? null : editing} catalog={catalog.data} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await refresh(); }} onSimulation={setSimulation} />
    <SimulationDialog result={simulation} onClose={() => setSimulation(null)} />
    <ExecutionDialog execution={execution} catalog={catalog.data} onClose={() => setExecution(null)} />
  </div>;
}

function RuleEditor({ open, rule, catalog, onClose, onSaved, onSimulation }: { open: boolean; rule: NoCodeAutomationRuleDto | null; catalog: NoCodeAutomationCatalogDto; onClose: () => void; onSaved: () => Promise<void>; onSimulation: (result: NoCodeAutomationSimulationDto) => void }) {
  const branches = useQuery({ queryKey: ["branches-for-automation"], queryFn: () => fetchBranches(), enabled: open });
  const initial = useMemo<SaveNoCodeAutomationRuleInput>(() => rule ? { name: rule.name, triggerEvent: rule.triggerEvent, scope: rule.scope, branchId: rule.branchId ?? undefined, enabled: rule.enabled, conditions: rule.conditions ?? [], consequences: rule.consequences } : emptyRule(catalog), [catalog, rule]);
  const [draft, setDraft] = useState(initial);
  const activeTrigger = catalog.triggers.find((item) => item.value === draft.triggerEvent) ?? catalog.triggers[0];
  const save = useMutation({ mutationFn: () => rule ? updateAutomationRule(rule.id, draft) : createAutomationRule(draft), onSuccess: async () => { toast.success(rule ? "Automatización actualizada" : "Automatización creada como borrador"); await onSaved(); }, onError: showError });
  const simulate = useMutation({ mutationFn: async () => {
    if (!rule) throw new Error("Guarda la regla antes de simularla.");
    return simulateAutomationRule(rule.id, buildSimulationInput(draft));
  }, onSuccess: onSimulation, onError: showError });
  const updateCondition = (index: number, value: NoCodeAutomationCondition) => setDraft((current) => ({ ...current, conditions: current.conditions.map((item, itemIndex) => itemIndex === index ? value : item) }));
  const updateAction = (index: number, value: NoCodeAutomationAction) => setDraft((current) => ({ ...current, consequences: current.consequences.map((item, itemIndex) => itemIndex === index ? value : item) }));
  const moveAction = (index: number, direction: -1 | 1) => setDraft((current) => { const actions = [...current.consequences]; const target = index + direction; if (target < 0 || target >= actions.length) return current; [actions[index], actions[target]] = [actions[target], actions[index]]; return { ...current, consequences: actions }; });
  const valid = draft.name.trim().length >= 3 && draft.consequences.length > 0 && (draft.scope !== "BRANCH" || Boolean(draft.branchId));

  return <Dialog open={open} onOpenChange={(next) => !next && onClose()}><DialogContent className="max-h-[94vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{rule ? "Editar automatización" : "Nueva automatización"}</DialogTitle><DialogDescription>Construye la secuencia de arriba hacia abajo. Las reglas nuevas se guardan desactivadas.</DialogDescription></DialogHeader><div className="space-y-6">
    <section className="grid gap-4 rounded-2xl border p-5 md:grid-cols-2"><label className="space-y-2 text-sm font-medium md:col-span-2">Nombre<Input value={draft.name} maxLength={160} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ej. Preparar incorporación al contratar" /></label><label className="space-y-2 text-sm font-medium">Cuando ocurra<FormSelect value={draft.triggerEvent} onValueChange={(value) => setDraft({ ...draft, triggerEvent: value as typeof draft.triggerEvent, conditions: [] })} options={catalog.triggers.map((item) => ({ value: item.value, label: item.label }))} /></label><label className="space-y-2 text-sm font-medium">Alcance<FormSelect value={draft.scope} onValueChange={(value) => setDraft({ ...draft, scope: value as typeof draft.scope, branchId: value === "TENANT" ? undefined : draft.branchId })} options={catalog.scopes} /></label>{draft.scope === "BRANCH" ? <label className="space-y-2 text-sm font-medium md:col-span-2">Sucursal<FormSelect value={draft.branchId} placeholder="Selecciona una sucursal" onValueChange={(branchId) => setDraft({ ...draft, branchId })} options={(branches.data ?? []).map((item) => ({ value: item.id, label: item.name }))} /></label> : null}<p className="text-sm text-muted-foreground md:col-span-2">{activeTrigger.description}</p></section>
    <AutomationFlowPreview draft={draft} catalog={catalog} triggerLabel={activeTrigger.label} />
    <section className="space-y-3"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Si se cumplen estas condiciones</h3><p className="text-sm text-muted-foreground">Sin condiciones, la regla se ejecuta siempre.</p></div><Button size="sm" variant="secondary" onClick={() => setDraft({ ...draft, conditions: [...draft.conditions, { field: activeTrigger.fields[0]?.value ?? "branchId", operator: "equals", value: "" }] })}><Plus className="size-4" />Condición</Button></div>{draft.conditions.map((condition, index) => <div key={`${condition.field}-${index}`} className="grid gap-2 rounded-xl border p-3 md:grid-cols-[1fr_1fr_1fr_auto]"><FormSelect value={condition.field} onValueChange={(field) => updateCondition(index, { ...condition, field })} options={activeTrigger.fields.map((item) => ({ value: item.value, label: item.label }))} /><FormSelect value={condition.operator} onValueChange={(operator) => updateCondition(index, { ...condition, operator: operator as NoCodeAutomationCondition["operator"] })} options={catalog.conditionOperators} />{condition.operator === "exists" ? <div className="flex items-center text-sm text-muted-foreground">No requiere valor</div> : <Input value={Array.isArray(condition.values) ? condition.values.join(", ") : String(condition.value ?? "")} placeholder={condition.operator.includes("in") ? "valor 1, valor 2" : "Valor"} onChange={(event) => updateCondition(index, condition.operator.includes("in") ? { ...condition, value: undefined, values: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) } : { ...condition, value: event.target.value, values: undefined })} />}<Button size="icon" variant="ghost" aria-label="Eliminar condición" onClick={() => setDraft({ ...draft, conditions: draft.conditions.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="size-4" /></Button></div>)}</section>
    <section className="space-y-3"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Entonces ejecuta estas acciones</h3><p className="text-sm text-muted-foreground">El orden visual es el orden de ejecución.</p></div><Button size="sm" variant="secondary" onClick={() => setDraft({ ...draft, consequences: [...draft.consequences, { type: catalog.actions[0].value }] })}><Plus className="size-4" />Acción</Button></div>{draft.consequences.map((action, index) => <ActionEditor key={`${action.type}-${index}`} action={action} position={index} catalog={catalog} onChange={(value) => updateAction(index, value)} onMove={moveAction} onDelete={() => setDraft({ ...draft, consequences: draft.consequences.filter((_, itemIndex) => itemIndex !== index) })} total={draft.consequences.length} />)}</section>
    {rule ? <section className="space-y-3 rounded-2xl border border-dashed p-5"><div className="flex items-center gap-2"><Beaker className="size-5 text-primary" /><h3 className="font-semibold">Simulación segura</h3></div><p className="text-sm text-muted-foreground">El sistema construirá un evento de prueba con las condiciones configuradas y validará la secuencia sin ejecutar acciones ni modificar datos.</p><Button variant="secondary" onClick={() => simulate.mutate()} disabled={simulate.isPending}><Beaker className="size-4" />Simular regla</Button></section> : null}
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={!valid || save.isPending} onClick={() => save.mutate()}>{rule ? "Guardar nueva versión" : "Guardar borrador"}</Button></div>
  </div></DialogContent></Dialog>;
}

function AutomationFlowPreview({ draft, catalog, triggerLabel }: { draft: SaveNoCodeAutomationRuleInput; catalog: NoCodeAutomationCatalogDto; triggerLabel: string }) {
  return <section className="overflow-x-auto rounded-2xl border border-primary/20 bg-primary/5 p-5"><div><h3 className="font-semibold">Vista del flujo</h3><p className="text-sm text-muted-foreground">Esta es la secuencia que se ejecutará; se actualiza mientras configuras la regla.</p></div><div className="mt-4 flex min-w-max items-center gap-3"><FlowNode eyebrow="Cuando" label={triggerLabel} /><FlowConnector /><FlowNode eyebrow={draft.conditions.length ? "Si" : "Siempre"} label={draft.conditions.length ? `${draft.conditions.length} condición(es)` : "Sin filtros"} tone="warning" />{draft.consequences.map((action, index) => <div key={`${action.type}-${index}`} className="flex items-center gap-3"><FlowConnector /><FlowNode eyebrow={`Acción ${index + 1}`} label={catalog.actions.find((item) => item.value === action.type)?.label ?? action.type} tone="success" /></div>)}</div></section>;
}

function FlowNode({ eyebrow, label, tone }: { eyebrow: string; label: string; tone?: "warning" | "success" }) {
  return <div className={`w-48 rounded-xl border bg-card p-3 shadow-sm ${tone === "warning" ? "border-status-warning/40" : tone === "success" ? "border-status-success/40" : "border-primary/40"}`}><p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{eyebrow}</p><p className="mt-1 text-sm font-medium">{label}</p></div>;
}

function FlowConnector() { return <span aria-hidden="true" className="text-lg font-semibold text-primary">-&gt;</span>; }

function ActionEditor({ action, position, catalog, total, onChange, onMove, onDelete }: { action: NoCodeAutomationAction; position: number; catalog: NoCodeAutomationCatalogDto; total: number; onChange: (action: NoCodeAutomationAction) => void; onMove: (index: number, direction: -1 | 1) => void; onDelete: () => void }) {
  const definition = catalog.actions.find((item) => item.value === action.type) ?? catalog.actions[0];
  return <div className="rounded-xl border p-4"><div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{position + 1}</span><div className="min-w-0 flex-1 space-y-3"><FormSelect value={action.type} onValueChange={(type) => onChange({ type: type as NoCodeAutomationAction["type"] })} options={catalog.actions.map((item) => ({ value: item.value, label: item.label }))} /><p className="text-sm text-muted-foreground">{definition.description}</p><div className="grid gap-3 md:grid-cols-2">{definition.fields.map((field) => field === "stepKey" ? <label key={field} className="space-y-1 text-xs font-medium">Etapa<FormSelect value={action.stepKey} placeholder="Selecciona una etapa" onValueChange={(stepKey) => onChange({ ...action, stepKey })} options={catalog.workflowStages} /></label> : <label key={field} className="space-y-1 text-xs font-medium">{actionFieldLabel(field)}<Input type={field === "dueDate" ? "date" : field === "quantity" ? "number" : "text"} value={String(action[field as keyof NoCodeAutomationAction] ?? "")} onChange={(event) => onChange({ ...action, [field]: field === "quantity" ? Number(event.target.value) : event.target.value || undefined })} /></label>)}</div></div><div className="flex shrink-0 flex-col"><Button size="icon" variant="ghost" disabled={position === 0} aria-label="Subir acción" onClick={() => onMove(position, -1)}><ArrowUp className="size-4" /></Button><Button size="icon" variant="ghost" disabled={position === total - 1} aria-label="Bajar acción" onClick={() => onMove(position, 1)}><ArrowDown className="size-4" /></Button><Button size="icon" variant="ghost" aria-label="Eliminar acción" onClick={onDelete}><Trash2 className="size-4 text-destructive" /></Button></div></div></div>;
}

function SimulationDialog({ result, onClose }: { result: NoCodeAutomationSimulationDto | null; onClose: () => void }) {
  return <Dialog open={Boolean(result)} onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>Resultado de la simulación</DialogTitle><DialogDescription>{result?.message}</DialogDescription></DialogHeader>{result ? <div className="space-y-4"><Badge variant={result.willExecute ? "success" : "warning"}>{result.willExecute ? "Lista para ejecutarse" : "No se ejecutaría"}</Badge><div className="space-y-2"><h3 className="font-semibold">Condiciones</h3>{result.conditions.length ? result.conditions.map((item, index) => <div key={index} className="flex justify-between rounded-lg bg-muted/50 p-3 text-sm"><span>{item.condition.field} · {item.condition.operator}</span><Badge variant={item.matches ? "success" : "secondary"}>{item.matches ? "Cumple" : "No cumple"}</Badge></div>) : <p className="text-sm text-muted-foreground">Se ejecutaría para cualquier evento.</p>}</div><div className="space-y-2"><h3 className="font-semibold">Acciones</h3>{result.actions.map((item) => <div key={item.position} className="rounded-lg bg-muted/50 p-3 text-sm"><p>{item.position}. {item.type}</p>{item.valid.reason ? <p className="mt-1 text-xs text-destructive">{item.valid.reason}</p> : null}</div>)}</div></div> : null}</DialogContent></Dialog>;
}

function ExecutionDialog({ execution, catalog, onClose }: { execution: NoCodeAutomationExecutionDto | null; catalog: NoCodeAutomationCatalogDto; onClose: () => void }) {
  return <Dialog open={Boolean(execution)} onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{execution?.rule.name}</DialogTitle><DialogDescription>{execution ? `Iniciada ${formatDate(execution.startedAt)}` : ""}</DialogDescription></DialogHeader>{execution ? <div className="space-y-4"><Badge variant={executionTone(execution.status)}>{executionStatusLabel(execution.status)}</Badge><div className="space-y-2">{execution.steps.map((step, index) => <div key={step.id} className="flex gap-3 rounded-xl border p-4"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{index + 1}</span><div><p className="font-medium">{catalog.actions.find((item) => item.value === step.consequence)?.label ?? step.consequence}</p><p className="text-sm text-muted-foreground">{step.result ?? step.status}</p></div></div>)}</div>{execution.auditTrail.length ? <div><h3 className="mb-2 font-semibold">Auditoría</h3>{execution.auditTrail.map((item) => <div key={item.id} className="border-l-2 border-primary/30 py-2 pl-3 text-sm"><p>{item.summary}</p><time className="text-xs text-muted-foreground">{formatDate(item.occurredAt)}</time></div>)}</div> : null}</div> : null}</DialogContent></Dialog>;
}

function actionFieldLabel(field: string) { return ({ itemId: "ID del artículo", quantity: "Cantidad", courseId: "ID del curso", curriculumId: "ID de la ruta", dueDate: "Fecha límite", title: "Título", policyCode: "Código de política", message: "Mensaje", stepKey: "Etapa" } as Record<string, string>)[field] ?? field; }
function executionStatusLabel(status: NoCodeAutomationExecutionDto["status"]) { return ({ PENDING: "Pendiente", IN_PROGRESS: "En curso", COMPLETED: "Completada", FAILED: "Fallida", PARTIAL: "Parcial" } as const)[status]; }
function showError(error: unknown) { toast.error(error instanceof Error ? error.message : "No fue posible completar la operación"); }

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <div className="mt-5 flex items-center justify-between rounded-xl border bg-card/70 px-4 py-3"><p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button><Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Siguiente</Button></div></div>;
}

function buildSimulationInput(rule: SaveNoCodeAutomationRuleInput) {
  const input: { branchId?: string; workflowId?: string; employeeId?: string; candidateId?: string; payload: Record<string, unknown> } = { branchId: rule.branchId, payload: {} };
  for (const condition of rule.conditions) {
    const sample = condition.operator === "exists" ? "valor-de-prueba" : condition.operator === "not_equals" || condition.operator === "not_in" ? "valor-alternativo" : condition.value ?? condition.values?.[0] ?? "valor-de-prueba";
    if (condition.field.startsWith("payload.")) {
      setNestedValue(input.payload, condition.field.replace(/^payload\./, ""), sample);
    } else if (["workflowId", "employeeId", "candidateId", "branchId"].includes(condition.field) && typeof sample === "string" && isUuid(sample)) {
      input[condition.field as "workflowId" | "employeeId" | "candidateId" | "branchId"] = sample;
    }
  }
  return input;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let cursor = target;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) cursor[key] = value;
    else {
      const next = cursor[key];
      cursor[key] = next && typeof next === "object" ? next : {};
      cursor = cursor[key] as Record<string, unknown>;
    }
  });
}
