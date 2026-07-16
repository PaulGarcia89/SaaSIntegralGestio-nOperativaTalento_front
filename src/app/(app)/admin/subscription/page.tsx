"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { PlanTier, SubscriptionDto } from "@/lib/contracts";
import { createSubscription, deleteSubscription, fetchSubscriptions, fetchTenants, updateSubscription } from "@/lib/backend";
import { CrudHeader, CrudPanel, ConfirmDeleteDialog, FormDialog } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tenantStatusLabels } from "@/lib/ui-labels";
import { FormSelect } from "@/components/ui/form-select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";

const subscriptionSchema = z.object({
  tenantId: z.string().min(1),
  plan: z.enum(["starter", "growth", "enterprise"]),
  billingCycle: z.enum(["monthly", "annual"]),
  status: z.enum(["active", "trial", "past_due"]),
  price: z.coerce.number().min(0),
  renewalDate: z.string().min(4),
});

type SubscriptionFormValues = z.output<typeof subscriptionSchema>;
type SubscriptionFormInput = z.input<typeof subscriptionSchema>;

export default function SubscriptionPage() {
  const { can } = useAppStore();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({ queryKey: ["admin-tenants"], queryFn: fetchTenants });
  const subscriptionsQuery = useQuery({ queryKey: ["subscriptions"], queryFn: fetchSubscriptions });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionDto | null>(null);
  const [deleting, setDeleting] = useState<SubscriptionDto | null>(null);

  const form = useForm<SubscriptionFormInput, unknown, SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      tenantId: "",
      plan: "starter",
      billingCycle: "monthly",
      status: "active",
      price: 0,
      renewalDate: "2026-08-01",
    },
  });

  const filtered = useMemo(
    () =>
      (subscriptionsQuery.data ?? []).filter((subscription) =>
        [subscription.plan, subscription.billingCycle, subscription.status]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, subscriptionsQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: (values: SubscriptionFormValues) =>
      editing ? updateSubscription(editing.id, values) : createSubscription(values),
    onSuccess: () => {
      toast.success(editing ? "Suscripcion actualizada" : "Suscripcion creada");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: () => toast.error("Error al guardar la suscripcion"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      toast.success("Suscripcion eliminada");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setDeleting(null);
    },
    onError: () => toast.error("Error al eliminar la suscripcion"),
  });

  if (!can("admin.subscription")) {
    return (
      <StateCard
        tone="restricted"
        title="Sin acceso a suscripciones"
        description="El rol actual no puede gestionar planes, ciclos ni renovaciones."
      />
    );
  }

  return (
    <div className="space-y-5">
      <CrudHeader
        title="Gestion de suscripciones"
        description="Consulta, crea, modifica y elimina suscripciones por empresa, incluyendo plan, facturacion y renovacion."
        badge="Gobierno SaaS"
        action={
          <FormDialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) {
                setEditing(null);
                form.reset();
              }
            }}
            title={editing ? "Editar suscripcion" : "Crear suscripcion"}
            description="Administra el plan contratado y su ciclo comercial."
            trigger={<Button onClick={() => setOpen(true)}>Nueva suscripcion</Button>}
          >
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <FormSelect
                  className="h-11 w-full rounded-2xl"
                  placeholder="Selecciona empresa"
                  value={form.watch("tenantId")}
                  onValueChange={(v) => form.setValue("tenantId", v)}
                  options={(tenantsQuery.data ?? []).map((tenant) => ({ label: tenant.name, value: tenant.id }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <FormSelect
                    className="h-11 w-full rounded-2xl"
                    value={form.watch("plan")}
                    onValueChange={(v) => form.setValue("plan", v as "starter" | "growth" | "enterprise")}
                    options={(["starter", "growth", "enterprise"] as PlanTier[]).map((plan) => ({ label: plan, value: plan }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ciclo</Label>
                  <FormSelect
                    className="h-11 w-full rounded-2xl"
                    value={form.watch("billingCycle")}
                    onValueChange={(v) => form.setValue("billingCycle", v as "monthly" | "annual")}
                    options={[
                      { label: "mensual", value: "monthly" },
                      { label: "anual", value: "annual" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <FormSelect
                    className="h-11 w-full rounded-2xl"
                    value={form.watch("status")}
                    onValueChange={(v) => form.setValue("status", v as "active" | "trial" | "past_due")}
                    options={[
                      { label: "activa", value: "active" },
                      { label: "prueba", value: "trial" },
                      { label: "vencida", value: "past_due" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio</Label>
                  <Input type="number" {...form.register("price")} />
                </div>
              </div>
              <DatePicker
                label="Renovacion"
                value={form.watch("renewalDate")}
                onChange={(v) => form.setValue("renewalDate", v)}
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </FormDialog>
        }
      />
      <FilterToolbar
        searchPlaceholder="Buscar por plan, ciclo o estado"
        options={[
          { label: "Todas", value: "" },
          { label: "Activas", value: "active" },
          { label: "Prueba", value: "trial" },
          { label: "Anual", value: "annual" },
        ]}
        activeValue={query}
        onChange={setQuery}
      />
      <CrudPanel>
        <DomainTable exportable
          data={filtered}
          getKey={(subscription) => subscription.id}
          columns={[
            {
              key: "tenant",
              header: "Empresa",
              sortable: true,
              render: (subscription) =>
                tenantsQuery.data?.find((tenant) => tenant.id === subscription.tenantId)?.name ??
                subscription.tenantId,
            },
            { key: "plan", header: "Plan", sortable: true, render: (subscription) => subscription.plan },
            {
              key: "cycle",
              header: "Ciclo",
              sortable: true,
              render: (subscription) => (subscription.billingCycle === "monthly" ? "Mensual" : "Anual"),
            },
            {
              key: "status",
              header: "Estado",
              sortable: true,
              render: (subscription) =>
                subscription.status === "past_due"
                  ? "Vencida"
                  : tenantStatusLabels[subscription.status],
            },
            { key: "price", header: "Precio", sortable: true, render: (subscription) => `$${subscription.price}` },
            {
              key: "actions",
              header: "Acciones",
              render: (subscription) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditing(subscription);
                      form.reset(subscription);
                      setOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(subscription)}>
                    Eliminar
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </CrudPanel>
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="Eliminar suscripcion"
        description={`Se eliminara la suscripcion ${deleting?.id ?? ""}.`}
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
