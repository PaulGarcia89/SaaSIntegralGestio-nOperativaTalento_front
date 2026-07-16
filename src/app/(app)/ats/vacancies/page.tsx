"use client";

import { toast } from "sonner";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ClipboardList, ShieldCheck, Users2 } from "lucide-react";
import type { VacancyDto } from "@/lib/contracts";
import { createVacancy, deleteVacancy, fetchVacancies, fetchVacancyHiringPlans, updateVacancy } from "@/lib/mock-backend";
import { useAppStore } from "@/store/app-store";
import { CrudHeader, CrudPanel, ConfirmDeleteDialog, FormDialog } from "@/components/admin-crud";
import { DrawerPreview, DomainTable, FilterToolbar, StateCard } from "@/components/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
import { Badge } from "@/components/ui/badge";

const vacancySchema = z.object({
  title: z.string().min(2),
  area: z.string().min(2),
  mode: z.enum(["Remoto", "Hibrido", "Presencial"]),
  status: z.enum(["Activa", "Borrador", "En entrevistas", "Cerrada"]),
  location: z.string().min(2),
  applicants: z.coerce.number().min(0),
  owner: z.string().min(2),
});

type VacancyFormValues = z.output<typeof vacancySchema>;
type VacancyFormInput = z.input<typeof vacancySchema>;

export default function VacanciesPage() {
  const { currentTenant, can, hasModule } = useAppStore();
  const queryClient = useQueryClient();
  const vacanciesQuery = useQuery({
    queryKey: ["vacancies", currentTenant.id],
    queryFn: () => fetchVacancies(currentTenant.id),
  });
  const hiringPlansQuery = useQuery({
    queryKey: ["vacancy-hiring-plans", currentTenant.id],
    queryFn: () => fetchVacancyHiringPlans(currentTenant.id),
  });
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VacancyDto | null>(null);
  const [deleting, setDeleting] = useState<VacancyDto | null>(null);

  const form = useForm<VacancyFormInput, unknown, VacancyFormValues>({
    resolver: zodResolver(vacancySchema),
    defaultValues: {
      title: "",
      area: "",
      mode: "Hibrido",
      status: "Borrador",
      location: "",
      applicants: 0,
      owner: "",
    },
  });

  const filtered = useMemo(
    () =>
      (vacanciesQuery.data ?? []).filter((job) =>
        [job.title, job.area, job.mode, job.status, job.location]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, vacanciesQuery.data],
  );

  const selected = filtered.find((job) => job.id === selectedId) ?? filtered[0];
  const selectedHiringPlan =
    (hiringPlansQuery.data ?? []).find((plan) => plan.vacancyId === selected?.id) ?? null;

  const saveMutation = useMutation({
    mutationFn: (values: VacancyFormValues) =>
      editing ? updateVacancy(editing.id, values) : createVacancy(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies", currentTenant.id] });
      setOpen(false);
      setEditing(null);
      form.reset();
      toast.success(editing ? "Vacante actualizada" : "Vacante creada");
    },
    onError: () => toast.error("Error al guardar la vacante"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVacancy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies", currentTenant.id] });
      setDeleting(null);
      toast.success("Vacante eliminada");
    },
    onError: () => toast.error("Error al eliminar la vacante"),
  });

  if (!hasModule("ats")) {
    return (
      <StateCard
        tone="restricted"
        title="El modulo ATS no esta habilitado"
        description="La suscripcion de esta empresa no incluye actualmente la suite de reclutamiento."
        action={
          <Button asChild>
            <Link href="/admin/subscription">Revisar suscripcion</Link>
          </Button>
        }
      />
    );
  }

  if (!can("ats.view")) {
    return (
      <StateCard
        tone="restricted"
        title="No tienes acceso a vacantes"
        description="Los permisos actuales bloquean esta vista. Cambia el rol demo o revisa la configuracion RBAC."
      />
    );
  }

  return (
    <div className="space-y-5">
      <CrudHeader
        title="Gestion de vacantes"
        description="Consulta, crea, modifica y elimina vacantes del ATS con una tabla operativa y vista de detalle."
        badge="ATS"
        action={
          <div className="flex gap-3">
            <Button asChild variant="secondary">
              <Link href="/jobs">Portal publico de empleos</Link>
            </Button>
            <FormDialog
              open={open}
              onOpenChange={(value) => {
                setOpen(value);
                if (!value) {
                  setEditing(null);
                  form.reset();
                }
              }}
              title={editing ? "Editar vacante" : "Crear vacante"}
              description="Administra los datos clave de la vacante."
              trigger={<Button disabled={!can("ats.manage")} onClick={() => setOpen(true)}>Nueva vacante</Button>}
            >
              <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input {...form.register("title")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Area</Label>
                    <Input {...form.register("area")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Modalidad</Label>
                    <FormSelect
                      className="h-11 w-full rounded-2xl"
                      value={form.watch("mode")}
                      onValueChange={(v) => form.setValue("mode", v as "Remoto" | "Hibrido" | "Presencial")}
                      options={[
                        { label: "Remoto", value: "Remoto" },
                        { label: "Hibrido", value: "Hibrido" },
                        { label: "Presencial", value: "Presencial" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <FormSelect
                      className="h-11 w-full rounded-2xl"
                      value={form.watch("status")}
                      onValueChange={(v) => form.setValue("status", v as "Activa" | "Borrador" | "En entrevistas" | "Cerrada")}
                      options={[
                        { label: "Activa", value: "Activa" },
                        { label: "Borrador", value: "Borrador" },
                        { label: "En entrevistas", value: "En entrevistas" },
                        { label: "Cerrada", value: "Cerrada" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Input {...form.register("location")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Postulantes</Label>
                    <Input type="number" {...form.register("applicants")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Responsable</Label>
                  <Input {...form.register("owner")} />
                </div>
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
          </div>
        }
      />

      <FilterToolbar
        searchPlaceholder="Buscar por cargo, area, ciudad o estado"
        options={[
          { label: "Todas", value: "" },
          { label: "Activas", value: "activa" },
          { label: "En entrevistas", value: "entrevistas" },
          { label: "Borrador", value: "borrador" },
        ]}
        activeValue={query}
        onChange={setQuery}
      />

      {filtered.length === 0 ? (
          <StateCard
            tone="empty"
            title="No hay vacantes para esta vista"
          description="Prueba con otra empresa, ajusta la busqueda actual o crea una nueva vacante para poblar las etapas del proceso ATS."
          action={<Button onClick={() => setOpen(true)}>Crear vacante</Button>}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
          <CrudPanel>
            <DomainTable exportable
              data={filtered}
              getKey={(job) => job.id}
              onSelect={(job) => setSelectedId(job.id)}
              tableClassName="min-w-full table-fixed"
              columns={[
                {
                  key: "title",
                  header: "Cargo",
                  sortable: true,
                  headerClassName: "w-[32%]",
                  cellClassName: "w-[32%]",
                  render: (job) => job.title,
                },
                {
                  key: "area",
                  header: "Area",
                  sortable: true,
                  headerClassName: "w-[12%] whitespace-nowrap",
                  cellClassName: "w-[12%] whitespace-nowrap",
                  render: (job) => job.area,
                },
                {
                  key: "mode",
                  header: "Modalidad",
                  sortable: true,
                  headerClassName: "w-[13%] whitespace-nowrap",
                  cellClassName: "w-[13%] whitespace-nowrap",
                  render: (job) => job.mode,
                },
                {
                  key: "status",
                  header: "Estado",
                  sortable: true,
                  headerClassName: "w-[14%] whitespace-nowrap",
                  cellClassName: "w-[14%] whitespace-nowrap",
                  render: (job) => job.status,
                },
                {
                  key: "applicants",
                  header: "Postulantes",
                  sortable: true,
                  headerClassName: "w-[10%] whitespace-nowrap",
                  cellClassName: "w-[10%] whitespace-nowrap",
                  render: (job) => job.applicants,
                },
                {
                  key: "actions",
                  header: "Acciones",
                  headerClassName: "w-[19%] whitespace-nowrap text-right",
                  cellClassName: "w-[19%] whitespace-nowrap text-right",
                  render: (job) => (
                    <div className="flex items-center justify-end gap-3 pr-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="min-w-[96px] shrink-0"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditing(job);
                          form.reset(job);
                          setOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="min-w-[96px] shrink-0"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleting(job);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </CrudPanel>

          {selected ? (
            <DrawerPreview title={selected.title} subtitle="Vista previa de la vacante">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Area</span><strong>{selected.area}</strong></div>
                <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Ciudad</span><strong>{selected.location}</strong></div>
                <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Estado</span><strong>{selected.status}</strong></div>
                <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Responsable</span><strong>{selected.owner}</strong></div>
                <div className="flex items-center justify-between border-b py-3"><span className="text-sm text-muted-foreground">Postulantes</span><strong>{selected.applicants}</strong></div>

                {selectedHiringPlan ? (
                  <>
                    <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                          <ClipboardList className="size-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{selectedHiringPlan.scorecardTitle}</p>
                          <p className="text-sm leading-6 text-muted-foreground">{selectedHiringPlan.advancementRule}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedHiringPlan.interviewKits.map((kit) => (
                        <div key={kit.id} className="rounded-2xl border border-border/70 bg-card/90 p-4">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">{kit.stage}</p>
                                <p className="text-sm leading-6 text-muted-foreground">{kit.focus}</p>
                              </div>
                              <Badge variant="secondary" className="rounded-full">
                                {kit.criteria.length} criterios
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {kit.criteria.map((criterion) => (
                                <span
                                  key={criterion.id}
                                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/25 px-3 py-1.5 text-xs text-foreground"
                                >
                                  {criterion.label}
                                  <strong>{criterion.weight}%</strong>
                                </span>
                              ))}
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-3">
                                <div className="flex items-center gap-2">
                                  <Users2 className="size-4 text-primary" />
                                  <p className="text-sm font-medium text-foreground">Panel</p>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">{kit.interviewers.join(", ")}</p>
                              </div>
                              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-3">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="size-4 text-primary" />
                                  <p className="text-sm font-medium text-foreground">Regla</p>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                  Retroalimentación obligatoria antes de mover la etapa.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </DrawerPreview>
          ) : (
            <StateCard
              tone="empty"
              title="Selecciona una vacante"
              description="El panel lateral esta listo para mostrar vista previa, línea de tiempo de actividad y proximos pasos."
            />
          )}
        </div>
      )}

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="Eliminar vacante"
        description={`Se eliminara la vacante ${deleting?.title ?? ""}.`}
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
