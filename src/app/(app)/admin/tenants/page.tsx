"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { createTenant, deleteTenant, fetchTenants, updateTenant } from "@/lib/backend";
import type { ModuleKey, PlanTier, TenantDto } from "@/lib/contracts";
import { CrudHeader, CrudPanel, FormDialog, ConfirmDeleteDialog } from "@/components/admin-crud";
import { DomainTable, FilterToolbar, StateCard } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FormSelect } from "@/components/ui/form-select";
import { moduleLabels, tenantStatusLabels } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";

const moduleOptions: ModuleKey[] = [
  "dashboard",
  "ats",
  "onboarding",
  "training",
  "productivity",
  "inventory",
  "admin",
  "reports",
  "notifications",
  "profile",
];

const tenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  plan: z.enum(["starter", "growth", "enterprise"]),
  status: z.enum(["active", "trial", "suspended"]),
  supportEmail: z.email(),
  accent: z.string().min(4),
  enabledModules: z
    .array(z.string())
    .min(1)
    .refine((values) => values.every((value) => moduleOptions.includes(value as ModuleKey))),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

export default function TenantsPage() {
  const { can } = useAppStore();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: fetchTenants,
  });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TenantDto | null>(null);
  const [deleting, setDeleting] = useState<TenantDto | null>(null);

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      plan: "starter",
      status: "active",
      supportEmail: "",
      accent: "#0EA5B7",
      enabledModules: ["dashboard", "profile", "notifications"],
    },
  });
  const selectedModules = useWatch({
    control: form.control,
    name: "enabledModules",
    defaultValue: ["dashboard", "profile", "notifications"],
  });

  const filtered = useMemo(
    () =>
      (tenantsQuery.data ?? []).filter((tenant) =>
        [tenant.name, tenant.slug, tenant.plan, tenant.status ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, tenantsQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: async (values: TenantFormValues) =>
      editing
        ? updateTenant(editing.id, {
            id: editing.id,
            name: values.name,
            slug: values.slug,
            plan: values.plan,
            status: values.status,
            branding: {
              accent: values.accent,
              supportEmail: values.supportEmail,
            },
            enabledModules: values.enabledModules as ModuleKey[],
          } as Omit<TenantDto, "id">)
        : createTenant({
            name: values.name,
            slug: values.slug,
            plan: values.plan,
            status: values.status,
            branding: {
              accent: values.accent,
              supportEmail: values.supportEmail,
            },
            enabledModules: values.enabledModules as ModuleKey[],
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setOpen(false);
      setEditing(null);
      form.reset();
      toast.success(editing ? "Empresa actualizada" : "Empresa creada");
    },
    onError: () => toast.error("Error al guardar la empresa"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["module-assignments"] });
      setDeleting(null);
      toast.success("Empresa eliminada");
    },
    onError: () => toast.error("Error al eliminar la empresa"),
  });

  if (!can("admin.view")) {
    return (
      <StateCard
        tone="restricted"
        title="Sin acceso a empresas"
        description="Solo perfiles de administracion superior pueden gestionar empresas suscritas."
      />
    );
  }

  return (
    <div className="space-y-5">
      <CrudHeader
        title="Gestion de empresas"
        description="Crea, consulta, modifica y elimina empresas del SaaS, incluyendo plan, branding, estado y modulos habilitados."
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
            title={editing ? "Editar empresa" : "Crear empresa"}
            description="Administra el perfil de empresa y su configuracion base."
            trigger={<Button onClick={() => setOpen(true)}>Nueva empresa</Button>}
          >
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input {...form.register("slug")} />
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <FormSelect
                    className="h-11 rounded-2xl"
                    value={form.watch("plan")}
                    onValueChange={(v) => form.setValue("plan", v as "starter" | "growth" | "enterprise")}
                    options={(["starter", "growth", "enterprise"] as PlanTier[]).map((plan) => ({ label: plan, value: plan }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <FormSelect
                    className="h-11 rounded-2xl"
                    value={form.watch("status")}
                    onValueChange={(v) => form.setValue("status", v as "active" | "trial" | "suspended")}
                    options={[
                      { label: "activo", value: "active" },
                      { label: "prueba", value: "trial" },
                      { label: "suspendido", value: "suspended" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email soporte</Label>
                  <Input {...form.register("supportEmail")} />
                </div>
                <div className="space-y-2">
                  <Label>Color de marca</Label>
                  <Input {...form.register("accent")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Modulos habilitados</Label>
                <div className="flex flex-wrap gap-2">
                  {moduleOptions.map((module) => {
                    const enabled = selectedModules.includes(module);
                    return (
                      <button
                        key={module}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-sm ${enabled ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                        onClick={() => {
                          const current = form.getValues("enabledModules");
                          form.setValue(
                            "enabledModules",
                            enabled ? current.filter((item) => item !== module) : [...current, module],
                          );
                        }}
                      >
                        {moduleLabels[module]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear empresa"}
                </Button>
              </div>
            </form>
          </FormDialog>
        }
      />

      <FilterToolbar
        searchPlaceholder="Buscar por empresa, slug, plan o estado"
        options={[
          { label: "Todos", value: "" },
          { label: "Activos", value: "active" },
          { label: "Prueba", value: "trial" },
          { label: "Empresarial", value: "enterprise" },
        ]}
        activeValue={query}
        onChange={setQuery}
      />

      <CrudPanel>
        {filtered.length === 0 ? (
          <StateCard
            tone="empty"
            title="No hay empresas visibles"
            description="Ajusta el filtro o crea una nueva empresa para comenzar."
          />
        ) : (
          <DomainTable
            data={filtered}
            getKey={(tenant) => tenant.id}
            exportable
            columns={[
              { key: "name", header: "Empresa", render: (tenant) => tenant.name, sortable: true },
              { key: "slug", header: "Slug", render: (tenant) => tenant.slug, sortable: true },
              { key: "plan", header: "Plan", render: (tenant) => tenant.plan, sortable: true },
              {
                key: "status",
                header: "Estado",
                render: (tenant) => (
                  <Badge variant="secondary">{tenantStatusLabels[tenant.status ?? "active"]}</Badge>
                ),
                sortable: true,
              },
              {
                key: "modules",
                header: "Modulos",
                render: (tenant) => `${tenant.enabledModules.length} activos`,
              },
              {
                key: "actions",
                header: "Acciones",
                render: (tenant) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditing(tenant);
                        form.reset({
                          name: tenant.name,
                          slug: tenant.slug,
                          plan: tenant.plan,
                          status: tenant.status ?? "active",
                          supportEmail: tenant.branding.supportEmail,
                          accent: tenant.branding.accent,
                          enabledModules: tenant.enabledModules,
                        });
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleting(tenant)}>
                      Eliminar
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </CrudPanel>

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="Eliminar empresa"
        description={`Esta accion eliminara ${deleting?.name ?? "la empresa"} y sus datos asociados del entorno local.`}
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
