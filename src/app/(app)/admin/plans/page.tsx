"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createPlan,
  deletePlan,
  fetchPlanCatalog,
  fetchPlatformModulesCatalog,
  getApiErrorMessage,
  updatePlan,
} from "@/lib/backend";
import type { PlanAdminDto, PlanLimitsDto } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { StateCard } from "@/components/domain";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState = {
  code: PlanAdminDto["code"];
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  limits: Record<keyof PlanLimitsDto, string>;
  moduleIds: string[];
};

const emptyForm: FormState = {
  code: "BASIC",
  name: "",
  description: "",
  priceMonthly: "0",
  priceYearly: "0",
  limits: {
    maxUsers: "",
    maxBranches: "",
    maxActiveVacancies: "",
    maxCourses: "",
    maxAssets: "",
    storageGb: "",
  },
  moduleIds: [],
};

const limitLabels: Record<keyof PlanLimitsDto, string> = {
  maxUsers: "Usuarios",
  maxBranches: "Sucursales",
  maxActiveVacancies: "Vacantes activas",
  maxCourses: "Cursos",
  maxAssets: "Activos",
  storageGb: "Almacenamiento (GB)",
};

export default function PlansPage() {
  const { can } = useAppStore();
  const queryClient = useQueryClient();
  const plans = useQuery({ queryKey: ["plan-catalog"], queryFn: fetchPlanCatalog });
  const modules = useQuery({ queryKey: ["platform-module-catalog"], queryFn: fetchPlatformModulesCatalog });
  const [editing, setEditing] = useState<PlanAdminDto | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const availableCodes = useMemo(
    () => (["BASIC", "PRO", "ENTERPRISE"] as const).filter((code) => !plans.data?.some((plan) => plan.code === code)),
    [plans.data],
  );
  const save = useMutation({
    mutationFn: () => {
      const payload = {
        code: form.code,
        name: form.name.trim(),
        description: form.description.trim(),
        priceMonthly: Number(form.priceMonthly),
        priceYearly: Number(form.priceYearly),
        limits: parseLimits(form.limits),
        moduleIds: form.moduleIds,
      };
      return editing
        ? updatePlan(editing.id, payload)
        : createPlan(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Plan actualizado" : "Plan creado");
      queryClient.invalidateQueries({ queryKey: ["plan-catalog"] });
      setOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible guardar el plan")),
  });
  const remove = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      toast.success("Plan eliminado");
      queryClient.invalidateQueries({ queryKey: ["plan-catalog"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible eliminar el plan")),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, code: availableCodes[0] ?? "BASIC" });
    setOpen(true);
  };
  const openEdit = (plan: PlanAdminDto) => {
    setEditing(plan);
    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description,
      priceMonthly: String(plan.priceMonthly),
      priceYearly: String(plan.priceYearly),
      limits: Object.fromEntries(
        Object.entries(plan.limits).map(([key, value]) => [key, value === null ? "" : String(value)]),
      ) as FormState["limits"],
      moduleIds: plan.modules.map((module) => module.id),
    });
    setOpen(true);
  };

  if (!can("admin.subscription")) {
    return <StateCard tone="restricted" title="Sin acceso al catálogo de planes" description="Tu rol no puede administrar precios, módulos ni límites globales." />;
  }
  if (plans.isPending || modules.isPending) return <AsyncState state="loading" title="Cargando catálogo de planes" />;
  if (plans.isError || modules.isError) {
    return <AsyncState state="error" title="No fue posible cargar los planes" onRetry={() => { plans.refetch(); modules.refetch(); }} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gobierno de plataforma"
        title="Planes y límites"
        description="Define precios, módulos incluidos y límites operativos. Un valor sin límite se muestra como ilimitado."
        actions={
          can("admin.subscription") && availableCodes.length > 0 ? (
            <Button onClick={openCreate}><Plus className="size-4" />Nuevo plan</Button>
          ) : null
        }
      />

      <InlineFeedback tone="info" title="Los cambios afectan nuevas verificaciones de capacidad">
        No se eliminan datos existentes automáticamente cuando un límite se reduce. Las operaciones posteriores deben respetar el nuevo máximo.
      </InlineFeedback>

      <section className="grid gap-5 xl:grid-cols-3">
        {plans.data?.map((plan) => (
          <Card key={plan.id} level={plan.code === "PRO" ? 1 : 2} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="secondary">{plan.code}</Badge>
                  <CardTitle className="mt-3 text-2xl">{plan.name}</CardTitle>
                  <p className="mt-2 text-sm text-text-secondary">{plan.description || "Sin descripción"}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => openEdit(plan)} aria-label={`Editar ${plan.name}`}>
                  <Pencil className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-5">
              <div className="grid grid-cols-2 gap-3">
                <Price label="Mensual" value={plan.priceMonthly} />
                <Price label="Anual" value={plan.priceYearly} />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Límites operativos</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {(Object.keys(limitLabels) as Array<keyof PlanLimitsDto>).map((key) => (
                    <div key={key} className="rounded-xl bg-surface-section p-3">
                      <dt className="text-xs text-text-secondary">{limitLabels[key]}</dt>
                      <dd className="mt-1 font-semibold">{plan.limits[key] ?? "Ilimitado"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Módulos incluidos</h3>
                <div className="flex flex-wrap gap-2">
                  {plan.modules.length ? plan.modules.map((module) => (
                    <Badge key={module.id} variant="outline"><Check className="mr-1 size-3" />{module.name}</Badge>
                  )) : <span className="text-sm text-text-secondary">Sin módulos incluidos</span>}
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between border-t pt-4">
                <span className="text-sm text-text-secondary">{plan.subscriptions} suscripciones</span>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={plan.subscriptions > 0 || remove.isPending}
                  title={plan.subscriptions > 0 ? "El plan tiene suscripciones asociadas" : undefined}
                  onClick={() => remove.mutate(plan.id)}
                >
                  <Trash2 className="size-4" />Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar plan" : "Crear plan"}</DialogTitle>
            <DialogDescription>Configura el catálogo comercial y los límites verificables del servicio.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
              <Field label="Código">
                <FormSelect
                  value={form.code}
                  disabled={Boolean(editing)}
                  onValueChange={(code) => setForm({ ...form, code: code as PlanAdminDto["code"] })}
                  options={(editing ? [editing.code] : availableCodes).map((code) => ({ value: code, label: code }))}
                />
              </Field>
              <Field label="Precio mensual"><Input type="number" min="0" step="0.01" value={form.priceMonthly} onChange={(event) => setForm({ ...form, priceMonthly: event.target.value })} /></Field>
              <Field label="Precio anual"><Input type="number" min="0" step="0.01" value={form.priceYearly} onChange={(event) => setForm({ ...form, priceYearly: event.target.value })} /></Field>
            </div>
            <Field label="Descripción"><Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
            <fieldset>
              <legend className="mb-3 font-semibold">Límites</legend>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(limitLabels) as Array<keyof PlanLimitsDto>).map((key) => (
                  <Field key={key} label={limitLabels[key]}>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ilimitado"
                      value={form.limits[key]}
                      onChange={(event) => setForm({ ...form, limits: { ...form.limits, [key]: event.target.value } })}
                    />
                  </Field>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 font-semibold">Módulos incluidos</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {modules.data?.map((module) => {
                  const selected = form.moduleIds.includes(module.id);
                  return (
                    <label key={module.id} className="flex min-h-11 items-center gap-3 rounded-xl border p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => setForm({
                          ...form,
                          moduleIds: selected ? form.moduleIds.filter((id) => id !== module.id) : [...form.moduleIds, module.id],
                        })}
                      />
                      <span><strong>{module.name}</strong><span className="block text-xs text-text-secondary">{module.description}</span></span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {save.isError ? <InlineFeedback tone="danger" title="No fue posible guardar">{getApiErrorMessage(save.error, "Revisa la información.")}</InlineFeedback> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!form.name.trim() || save.isPending}>{save.isPending ? "Guardando…" : "Guardar plan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Price({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border p-3"><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 text-xl font-semibold">${value.toLocaleString("es-ES")}</p></div>;
}

function parseLimits(values: FormState["limits"]): PlanLimitsDto {
  const parse = (value: string) => value === "" ? null : Number(value);
  return {
    maxUsers: parse(values.maxUsers),
    maxBranches: parse(values.maxBranches),
    maxActiveVacancies: parse(values.maxActiveVacancies),
    maxCourses: parse(values.maxCourses),
    maxAssets: parse(values.maxAssets),
    storageGb: parse(values.storageGb),
  };
}
