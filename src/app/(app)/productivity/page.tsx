"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  completeOperationalHandoffAutomation,
  fetchBranches,
  fetchProductivityWorkspace,
  triggerBranchTransferAutomation,
  triggerOffboardingAutomation,
} from "@/lib/mock-backend";
import { useAppStore } from "@/store/app-store";
import { ModuleHeader, SectionCard, DataTable, SplitPanel, InfoList } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";

export default function ProductivityPage() {
  const { currentTenant } = useAppStore();
  const queryClient = useQueryClient();
  const productivityQuery = useQuery({
    queryKey: ["productivity-workspace", currentTenant.id],
    queryFn: () => fetchProductivityWorkspace(currentTenant.id),
  });
  const branchesQuery = useQuery({
    queryKey: ["productivity-branches", currentTenant.id],
    queryFn: () => fetchBranches(currentTenant.id),
  });

  const actors = useMemo(() => productivityQuery.data?.actors ?? [], [productivityQuery.data]);
  const branches = branchesQuery.data ?? [];
  const [selectedActor, setSelectedActor] = useState("");
  const [targetBranchId, setTargetBranchId] = useState("");
  const [offboardingActor, setOffboardingActor] = useState("");
  const [handoffActor, setHandoffActor] = useState("");

  const actorOptions = useMemo(
    () => actors.map((actor) => ({ label: `${actor.name} · ${actor.branch}`, value: actor.name })),
    [actors],
  );
  const handoffOptions = useMemo(
    () =>
      (productivityQuery.data?.handoffs ?? []).map((item) => ({
        label: `${item.employeeName} · ${item.branch}`,
        value: item.employeeName,
      })),
    [productivityQuery.data],
  );
  const currentActor = actors.find((actor) => actor.name === selectedActor) ?? actors[0] ?? null;
  const transferBranchOptions = branches
    .filter((branch) => branch.city !== currentActor?.branch)
    .map((branch) => ({ label: `${branch.name} · ${branch.city}`, value: branch.id }));

  const refreshOperationalQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["productivity-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["onboarding-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["inventory-activations", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["training-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["master-workflow-card", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-compliance-workspace", currentTenant.id] });
    queryClient.invalidateQueries({ queryKey: ["automation-summary", currentTenant.id] });
  };

  const transferMutation = useMutation({
    mutationFn: ({ personName, branchId }: { personName: string; branchId: string }) =>
      triggerBranchTransferAutomation(personName, branchId),
    onSuccess: () => {
      refreshOperationalQueries();
      toast.success("Cambio de sucursal activado");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo activar el cambio de sucursal"),
  });

  const offboardingMutation = useMutation({
    mutationFn: (personName: string) => triggerOffboardingAutomation(personName),
    onSuccess: () => {
      refreshOperationalQueries();
      toast.success("Baja operativa iniciada");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo iniciar la baja"),
  });

  const handoffMutation = useMutation({
    mutationFn: (personName: string) => completeOperationalHandoffAutomation(personName),
    onSuccess: () => {
      refreshOperationalQueries();
      toast.success("Paso a operación completado");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo completar la transferencia operativa"),
  });

  if (productivityQuery.isLoading || !productivityQuery.data) {
    return <SectionCard title="Cargando productividad" subtitle="Operacion IA">Preparando metricas, accesos y orquestaciones operativas.</SectionCard>;
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Productividad con IA"
        title="Metricas explicables, alertas y orquestacion operativa entre personas, activos y accesos."
        description="Esta vista deja de ser solo analitica: ahora tambien dispara acciones coordinadas cuando cambia una sede, entra una persona o se procesa una baja."
        actions={
          <Button asChild>
            <Link href="/reports">Ver reportes</Link>
          </Button>
        }
        metrics={[
          { label: "Indice operativo", value: "89.1", detail: "Promedio consolidado de productividad entre sedes activas" },
          { label: "Flujos activos", value: `${productivityQuery.data.events.length}`, detail: "Eventos operativos visibles en seguimiento" },
          { label: "Accesos en cola", value: `${productivityQuery.data.accessTasks.length}`, detail: "Provision o cierre pendientes por RRHH y operacion" },
        ]}
      />

      <div className="space-y-12 xl:space-y-14">
        <SectionCard title="Centro de orquestacion operativa" subtitle="Automatizaciones entre modulos">
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-secondary/20 p-5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cambio de sucursal</p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Mover inventario, actualizar responsable y revisar productividad
                </h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  Reubica a una persona entre sedes y dispara reasignacion de activos, permisos y capacitacion de revalidacion.
                </p>
              </div>

              <div className="mt-5 grid gap-4">
                <FormSelect
                  className="h-11 w-full rounded-2xl"
                  placeholder="Selecciona colaborador"
                  value={selectedActor || currentActor?.name || ""}
                  onValueChange={setSelectedActor}
                  options={actorOptions}
                />
                <FormSelect
                  className="h-11 w-full rounded-2xl"
                  placeholder="Selecciona nueva sucursal"
                  value={targetBranchId}
                  onValueChange={setTargetBranchId}
                  options={transferBranchOptions}
                />
                <Button
                  disabled={!currentActor || !targetBranchId || transferMutation.isPending}
                  onClick={() => currentActor && transferMutation.mutate({ personName: currentActor.name, branchId: targetBranchId })}
                >
                  {transferMutation.isPending ? "Activando..." : "Ejecutar cambio de sucursal"}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Paso a operación</p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Confirmar transferencia productiva y abrir cierre administrativo
                </h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  Cuando la formación ya cerró, esta acción marca a la persona como operativa y deja el flujo listo para cumplimiento.
                </p>
              </div>

              <div className="mt-5 grid gap-4">
                <FormSelect
                  className="h-11 w-full rounded-2xl"
                  placeholder="Selecciona transferencia"
                  value={handoffActor}
                  onValueChange={setHandoffActor}
                  options={handoffOptions}
                />
                <Button
                  disabled={!handoffActor || handoffMutation.isPending}
                  onClick={() => handoffMutation.mutate(handoffActor)}
                >
                  {handoffMutation.isPending ? "Actualizando..." : "Marcar paso a operación"}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/90 p-5 xl:col-span-2">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Baja operativa</p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Retirar activos, cerrar accesos y archivar expediente
                </h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  Inicia el flujo de salida y deja trazabilidad inmediata para RRHH, inventario y seguridad.
                </p>
              </div>

              <div className="mt-5 grid gap-4">
                <FormSelect
                  className="h-11 w-full rounded-2xl"
                  placeholder="Selecciona colaborador"
                  value={offboardingActor}
                  onValueChange={setOffboardingActor}
                  options={actorOptions}
                />
                <Button
                  variant="destructive"
                  disabled={!offboardingActor || offboardingMutation.isPending}
                  onClick={() => offboardingMutation.mutate(offboardingActor)}
                >
                  {offboardingMutation.isPending ? "Procesando..." : "Iniciar baja"}
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>

        <SplitPanel
          left={
            <SectionCard title="Rendimiento por area" subtitle="Indicadores">
              <DataTable
                columns={["Area", "Indice", "Tendencia", "Alertas"]}
                rows={productivityQuery.data.rows.map((row) => [
                  row.area,
                  row.productivity,
                  row.trend,
                  row.alert,
                ])}
              />
            </SectionCard>
          }
          right={
            <SectionCard title="Orquestaciones recientes" subtitle="Impacto visible">
              <div className="space-y-5">
                <InfoList
                  items={productivityQuery.data.automationRules.map((rule) => ({
                    title: rule.name,
                    description: `${rule.trigger}. ${rule.scope}.`,
                    badge: rule.status,
                  }))}
                />

                <InfoList
                  items={productivityQuery.data.handoffs.map((handoff) => ({
                    title: `${handoff.employeeName} · operación`,
                    description: `${handoff.branch}. ${handoff.nextAction}`,
                    badge: handoff.status,
                  }))}
                />

                <InfoList
                  items={productivityQuery.data.events.map((event) => ({
                    title: `${event.employeeName} · ${event.title}`,
                    description: event.description,
                    badge: event.status,
                  }))}
                />

                <InfoList
                  items={productivityQuery.data.accessTasks.map((task) => ({
                    title: `${task.employeeName} · ${task.system}`,
                    description: `${task.branch}. ${task.nextAction}`,
                    badge: task.status,
                  }))}
                />
              </div>
            </SectionCard>
          }
        />

        <SectionCard title="Auditoría operativa por persona" subtitle="Consecuencias ejecutadas">
          <div className="grid gap-4 xl:grid-cols-2">
            {productivityQuery.data.automationAudit.map((entry) => (
              <article key={entry.id} className="rounded-3xl border border-border/70 bg-card/90 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{entry.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{entry.trigger} · {entry.branch}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                    {entry.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">{entry.ruleName}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{entry.summary}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {entry.executedAt} · {entry.actor}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.consequences.map((consequence) => (
                    <span
                      key={consequence}
                      className="rounded-full border border-border/70 bg-secondary/20 px-3 py-1 text-xs text-foreground"
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
