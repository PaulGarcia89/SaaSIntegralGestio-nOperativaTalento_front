"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilePlus2 } from "lucide-react";
import { CommunicationOperationsConsole } from "@/components/communication-operations-console";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createAtsCommunicationTemplate,
  fetchAtsCommunicationTemplates,
  fetchVacancies,
  fetchVacancySetup,
} from "@/lib/backend";
import type {
  AtsCommunicationAudience,
  AtsCommunicationType,
  CreateAtsCommunicationTemplateInput,
} from "@/lib/contracts";

const types: Array<{ value: AtsCommunicationType; label: string }> = [
  { value: "APPLICATION_CONFIRMATION", label: "Confirmación de postulación" },
  { value: "STAGE_UPDATE", label: "Cambio de etapa" },
  { value: "REJECTION", label: "Rechazo" },
  { value: "INTERVIEW_SCHEDULED", label: "Entrevista programada" },
  { value: "INTERVIEW_REMINDER", label: "Recordatorio de entrevista" },
  { value: "INTERVIEW_RESCHEDULED", label: "Entrevista reprogramada" },
  { value: "INTERVIEW_CANCELLED", label: "Entrevista cancelada" },
  { value: "OFFER", label: "Oferta" },
  { value: "APPROVAL_REQUEST", label: "Solicitud de aprobación" },
];

const initialForm: CreateAtsCommunicationTemplateInput = {
  type: "STAGE_UPDATE",
  audience: "CANDIDATE",
  name: "",
  subject: "",
  body: "",
  isActive: true,
};

export default function AtsCommunicationsPage() {
  const queryClient = useQueryClient();
  const [vacancyId, setVacancyId] = useState("");
  const [form, setForm] = useState<CreateAtsCommunicationTemplateInput>(initialForm);
  const vacancies = useQuery({ queryKey: ["vacancies", "communications"], queryFn: fetchVacancies });
  const setup = useQuery({
    queryKey: ["vacancy-setup", vacancyId],
    queryFn: () => fetchVacancySetup(vacancyId),
    enabled: Boolean(vacancyId),
  });
  const templates = useQuery({
    queryKey: ["ats-communication-templates", vacancyId],
    queryFn: () => fetchAtsCommunicationTemplates(vacancyId || undefined),
  });
  const create = useMutation({
    mutationFn: createAtsCommunicationTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ats-communication-templates", vacancyId] });
      setForm((current) => ({ ...initialForm, vacancyId: current.vacancyId, stageCode: current.stageCode }));
    },
  });

  const vacancyItems = vacancies.data?.data ?? [];
  const activeTemplates = templates.data?.filter((item) => item.isActive) ?? [];
  const update = <K extends keyof CreateAtsCommunicationTemplateInput>(
    key: K,
    value: CreateAtsCommunicationTemplateInput[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  return <div className="space-y-7">
    <PageHeader eyebrow="Reclutamiento" title="Bandeja de candidatos" description="Gestiona conversaciones de correo, responsables, pendientes y plantillas desde un historial bidireccional completo." />
    <InlineFeedback tone="success" title="Correo bidireccional conectado">Envíos y respuestas se agrupan por expediente, con no leídos, asignación, reintentos, tracking y recuperación segura de correos entrantes.</InlineFeedback>
    <CommunicationOperationsConsole />
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
      <Card level={1}>
        <CardHeader><CardTitle>Nueva versión de plantilla</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FieldLabel label="Vacante">
            <Select value={vacancyId || "global"} onValueChange={(value) => { const nextVacancyId = value === "global" ? "" : value; setVacancyId(nextVacancyId); setForm((current) => ({ ...current, vacancyId: nextVacancyId || undefined, stageCode: undefined })); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="global">Plantilla global</SelectItem>{vacancyItems.map((vacancy) => <SelectItem key={vacancy.id} value={vacancy.id}>{vacancy.title}</SelectItem>)}</SelectContent>
            </Select>
          </FieldLabel>
          <FieldLabel label="Etapa">
            <Select value={form.stageCode || "all"} onValueChange={(value) => update("stageCode", value === "all" ? undefined : value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas las etapas</SelectItem>{setup.data?.stages.map((stage) => <SelectItem key={stage.code} value={stage.code}>{stage.name}</SelectItem>)}</SelectContent>
            </Select>
          </FieldLabel>
          <FieldLabel label="Evento">
            <Select value={form.type} onValueChange={(value) => update("type", value as AtsCommunicationType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{types.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
            </Select>
          </FieldLabel>
          <FieldLabel label="Audiencia">
            <Select value={form.audience} onValueChange={(value) => update("audience", value as AtsCommunicationAudience)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="CANDIDATE">Candidato</SelectItem><SelectItem value="RESPONSIBLE">Responsables</SelectItem></SelectContent>
            </Select>
          </FieldLabel>
          <label className="block space-y-2 text-sm font-medium">Nombre<Input value={form.name} maxLength={120} onChange={(event) => update("name", event.target.value)} placeholder="Ej. Rechazo cordial" /></label>
          <label className="block space-y-2 text-sm font-medium">Asunto<Input value={form.subject} maxLength={240} onChange={(event) => update("subject", event.target.value)} placeholder="Actualización de {{vacancyTitle}}" /></label>
          <label className="block space-y-2 text-sm font-medium">Mensaje<textarea value={form.body} maxLength={12000} rows={9} onChange={(event) => update("body", event.target.value)} className="w-full rounded-xl border border-border-default bg-surface-elevated p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" placeholder="Hola {{candidateName}}, tu proceso…" /></label>
          <p className="text-xs text-text-secondary">Variables: {"{{candidateName}}"}, {"{{vacancyTitle}}"}, {"{{companyName}}"}, {"{{stageName}}"}, {"{{reason}}"}, {"{{interviewDate}}"}, {"{{interviewLocation}}"}.</p>
          {create.isError ? <InlineFeedback tone="danger" title="No fue posible guardar">{create.error instanceof Error ? create.error.message : "Revisa los campos."}</InlineFeedback> : null}
          {create.isSuccess ? <InlineFeedback tone="success" title="Nueva versión activa">La versión anterior quedó conservada e inactiva.</InlineFeedback> : null}
          <Button className="w-full" onClick={() => create.mutate(form)} disabled={create.isPending || form.name.trim().length < 2 || form.subject.trim().length < 2 || form.body.trim().length < 2}><FilePlus2 className="size-4" />{create.isPending ? "Guardando…" : "Crear nueva versión"}</Button>
        </CardContent>
      </Card>
      <Card level={2}>
        <CardHeader><CardTitle>Plantillas activas</CardTitle></CardHeader>
        <CardContent>
          {templates.isLoading ? <AsyncState state="loading" title="Cargando plantillas" /> : null}
          {templates.isError ? <AsyncState state="error" title="No fue posible cargar plantillas" onRetry={() => void templates.refetch()} /> : null}
          {templates.isSuccess && !activeTemplates.length ? <p className="text-sm text-text-secondary">No hay plantillas personalizadas en este alcance; se usarán los mensajes predeterminados del sistema.</p> : null}
          <div className="space-y-3">{activeTemplates.map((template) => <article key={template.id} className="rounded-xl border border-border-default p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{template.name}</h3><p className="text-sm text-text-secondary">{template.subject}</p></div><div className="flex gap-2"><Badge variant="secondary">v{template.version}</Badge><Badge>{template.audience === "CANDIDATE" ? "Candidato" : "Responsables"}</Badge></div></div><p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm">{template.body}</p><p className="mt-3 text-xs text-text-secondary">{types.find((type) => type.value === template.type)?.label ?? template.type} · {template.stageCode || "Todas las etapas"}</p></article>)}</div>
        </CardContent>
      </Card>
    </div>
  </div>;
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2 text-sm font-medium"><span>{label}</span>{children}</label>;
}
