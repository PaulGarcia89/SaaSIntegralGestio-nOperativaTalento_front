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
import { useLocale } from "@/components/locale-provider";

// Cada tipo guarda su CLAVE, no su texto: la etiqueta se resuelve al pintarla,
// que es cuando se conoce el idioma.
const types: Array<{ value: AtsCommunicationType; labelKey: string }> = [
  { value: "APPLICATION_CONFIRMATION", labelKey: "comms.type.APPLICATION_CONFIRMATION" },
  { value: "STAGE_UPDATE", labelKey: "comms.type.STAGE_CHANGE" },
  { value: "REJECTION", labelKey: "comms.type.REJECTION" },
  { value: "INTERVIEW_SCHEDULED", labelKey: "comms.type.INTERVIEW_SCHEDULED" },
  { value: "INTERVIEW_REMINDER", labelKey: "comms.type.INTERVIEW_REMINDER" },
  { value: "INTERVIEW_RESCHEDULED", labelKey: "comms.type.INTERVIEW_RESCHEDULED" },
  { value: "INTERVIEW_CANCELLED", labelKey: "comms.type.INTERVIEW_CANCELLED" },
  { value: "OFFER", labelKey: "comms.type.OFFER" },
  { value: "APPROVAL_REQUEST", labelKey: "comms.type.APPROVAL_REQUEST" },
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
  const { t } = useLocale();
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
    <PageHeader eyebrow="Reclutamiento" title={t("comms.inbox")} description={t("comms.inboxDescription")} />
    <InlineFeedback tone="success" title={t("comms.twoWayConnected")}>{t("comms.twoWayBody")}</InlineFeedback>
    <CommunicationOperationsConsole />
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
      <Card level={1}>
        <CardHeader><CardTitle>{t("comms.newTemplateVersion")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FieldLabel label={t("comms.vacancy")}>
            <Select value={vacancyId || "global"} onValueChange={(value) => { const nextVacancyId = value === "global" ? "" : value; setVacancyId(nextVacancyId); setForm((current) => ({ ...current, vacancyId: nextVacancyId || undefined, stageCode: undefined })); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="global">Plantilla global</SelectItem>{vacancyItems.map((vacancy) => <SelectItem key={vacancy.id} value={vacancy.id}>{vacancy.title}</SelectItem>)}</SelectContent>
            </Select>
          </FieldLabel>
          <FieldLabel label={t("comms.stage")}>
            <Select value={form.stageCode || "all"} onValueChange={(value) => update("stageCode", value === "all" ? undefined : value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">{t("comms.allStages")}</SelectItem>{setup.data?.stages.map((stage) => <SelectItem key={stage.code} value={stage.code}>{stage.name}</SelectItem>)}</SelectContent>
            </Select>
          </FieldLabel>
          <FieldLabel label="Evento">
            <Select value={form.type} onValueChange={(value) => update("type", value as AtsCommunicationType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{types.map((type) => <SelectItem key={type.value} value={type.value}>{t(type.labelKey)}</SelectItem>)}</SelectContent>
            </Select>
          </FieldLabel>
          <FieldLabel label="Audiencia">
            <Select value={form.audience} onValueChange={(value) => update("audience", value as AtsCommunicationAudience)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="CANDIDATE">{t("comms.audience.candidate")}</SelectItem><SelectItem value="RESPONSIBLE">{t("comms.audience.owners")}</SelectItem></SelectContent>
            </Select>
          </FieldLabel>
          <label className="block space-y-2 text-sm font-medium">{t("comms.name")}<Input value={form.name} maxLength={120} onChange={(event) => update("name", event.target.value)} placeholder="Ej. Rechazo cordial" /></label>
          <label className="block space-y-2 text-sm font-medium">Asunto<Input value={form.subject} maxLength={240} onChange={(event) => update("subject", event.target.value)} placeholder={t("comms.subjectPlaceholder")} /></label>
          <label className="block space-y-2 text-sm font-medium">{t("comms.message")}<textarea value={form.body} maxLength={12000} rows={9} onChange={(event) => update("body", event.target.value)} className="w-full rounded-xl border border-border-default bg-surface-elevated p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus" placeholder={t("comms.bodyPlaceholder")} /></label>
          <p className="text-xs text-text-secondary">Variables: {"{{candidateName}}"}, {"{{vacancyTitle}}"}, {"{{companyName}}"}, {"{{stageName}}"}, {"{{reason}}"}, {"{{interviewDate}}"}, {"{{interviewLocation}}"}.</p>
          {create.isError ? <InlineFeedback tone="danger" title={t("comms.saveFailed")}>{create.error instanceof Error ? create.error.message : t("comms.checkFields")}</InlineFeedback> : null}
          {create.isSuccess ? <InlineFeedback tone="success" title={t("comms.newVersionActive")}>{t("comms.previousKept")}</InlineFeedback> : null}
          <Button className="w-full" onClick={() => create.mutate(form)} disabled={create.isPending || form.name.trim().length < 2 || form.subject.trim().length < 2 || form.body.trim().length < 2}><FilePlus2 className="size-4" />{create.isPending ? "Guardando…" : t("comms.createVersion")}</Button>
        </CardContent>
      </Card>
      <Card level={2}>
        <CardHeader><CardTitle>Plantillas activas</CardTitle></CardHeader>
        <CardContent>
          {templates.isLoading ? <AsyncState state="loading" title="Cargando plantillas" /> : null}
          {templates.isError ? <AsyncState state="error" title={t("comms.templatesError")} onRetry={() => void templates.refetch()} /> : null}
          {templates.isSuccess && !activeTemplates.length ? <p className="text-sm text-text-secondary">{t("comms.noTemplates")}</p> : null}
          <div className="space-y-3">{activeTemplates.map((template) => <article key={template.id} className="rounded-xl border border-border-default p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{template.name}</h3><p className="text-sm text-text-secondary">{template.subject}</p></div><div className="flex gap-2"><Badge variant="secondary">v{template.version}</Badge><Badge>{template.audience === "CANDIDATE" ? t("comms.audience.candidate") : t("comms.audience.owners")}</Badge></div></div><p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm">{template.body}</p><p className="mt-3 text-xs text-text-secondary">{(() => { const found = types.find((type) => type.value === template.type); return found ? t(found.labelKey) : template.type; })()} · {template.stageCode || t("comms.allStages")}</p></article>)}</div>
        </CardContent>
      </Card>
    </div>
  </div>;
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2 text-sm font-medium"><span>{label}</span>{children}</label>;
}
