"use client";

import { recruitmentStageLabel } from "@/lib/recruitment-stage-label";
import Image from "next/image";
import { BriefcaseBusiness, CheckCircle2, Pencil } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import type { CreateVacancyInput, VacancyStageDto } from "@/lib/contracts";

export function VacancyReview({ form, imagePreview, branchName, stages, onEdit }: {
  form: CreateVacancyInput;
  imagePreview: string;
  branchName?: string;
  stages: VacancyStageDto[];
  onEdit: (step: number) => void;
}) {
  const { t, locale } = useLocale();
  const en = locale === "en";
  const salary = form.salaryMin != null || form.salaryMax != null
    ? `${form.salaryMin ?? "—"} – ${form.salaryMax ?? "—"} ${form.currency || "USD"}`
    : t("vacancies.notReported");
  const progress = [...stages].sort((a, b) => a.position - b.position);
  const mainStages = progress.filter((stage) => stage.applicationStatus !== "REJECTED");
  const rejected = progress.find((stage) => stage.applicationStatus === "REJECTED");

  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
    <section className="min-w-0 overflow-hidden rounded-xl border border-border-default bg-surface-elevated xl:col-span-2" aria-label={en ? "Vacancy overview" : "Resumen de la vacante"}>
      <div className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-section sm:size-24">
          {imagePreview ? <Image src={imagePreview} alt="" fill unoptimized className="object-cover" /> : <BriefcaseBusiness className="size-7 text-text-secondary" aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-secondary">{en ? "Vacancy overview" : "Resumen de la vacante"}</p>
          <h3 className="mt-1 break-words text-xl font-semibold tracking-tight">{form.title || t("vacancies.title")}</h3>
          <p className="mt-1 text-sm text-text-secondary">{[branchName, form.department, [form.city, form.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</p>
          {form.summary ? <p className="mt-2 text-sm text-text-secondary">{form.summary}</p> : null}
        </div>
        <Button size="sm" variant="ghost" onClick={() => onEdit(0)} aria-label={en ? "Edit role details" : "Editar datos del puesto"}><Pencil className="size-3.5" />{en ? "Edit" : "Editar"}</Button>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border-default px-4 py-4 sm:grid-cols-4 sm:px-5">
        <Detail label={t("vacancies.workMode")} value={t(`vacancies.workMode.${form.workMode}`)} />
        <Detail label={t("vacancies.employmentType")} value={t(`vacancies.employmentType.${form.employmentType}`)} />
        <Detail label={t("vacancies.openingsShort")} value={String(form.openings ?? 1)} />
        <Detail label={t("vacancies.salaryRange")} value={salary} />
      </dl>
    </section>

    <section className="min-w-0 rounded-xl border border-border-default p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{en ? "What applicants will read" : "Lo que leerán los candidatos"}</h3>
        <Button size="sm" variant="ghost" onClick={() => onEdit(1)} aria-label={en ? "Edit description and conditions" : "Editar descripción y condiciones"}><Pencil className="size-3.5" />{en ? "Edit" : "Editar"}</Button>
      </div>
      <p className="whitespace-pre-line break-words text-sm leading-relaxed text-text-secondary">{form.description || (en ? "Add a description of the opportunity." : "Agrega una descripción de la oportunidad.")}</p>
      {[{ label: t("vacancies.responsibilities"), value: form.responsibilities }, { label: t("vacancies.requirements"), value: form.requirements }, { label: t("vacancies.benefits"), value: form.benefits }].filter((entry) => entry.value).map((entry) => <details key={entry.label} className="mt-3 border-t border-border-default pt-3"><summary className="cursor-pointer text-sm font-medium">{entry.label}</summary><p className="mt-2 whitespace-pre-line break-words text-sm text-text-secondary">{entry.value}</p></details>)}
    </section>

    <section className="min-w-0 rounded-xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5" aria-label={en ? "Selection process" : "Proceso de selección"}>
      <div className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-success" aria-hidden="true" /><div><h3 className="text-sm font-semibold">{en ? "Selection process ready" : "Proceso de selección listo"}</h3><p className="mt-1 text-xs text-text-secondary">{en ? "The stages are configured automatically. You can focus on the role." : "Las etapas se configuran automáticamente. Solo necesitas definir el puesto."}</p></div></div>
      <ol className="mt-4 flex flex-wrap gap-2">{mainStages.map((stage, index) => <li key={stage.code} className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-elevated px-3 py-2 text-xs"><span className="text-text-secondary">{index + 1}</span><span className="font-medium">{recruitmentStageLabel(stage, locale)}</span></li>)}</ol>
      {rejected ? <p className="mt-3 text-xs text-text-secondary">{en ? "When the application does not continue" : "Si la postulación no continúa"}: {recruitmentStageLabel(rejected, locale)}.</p> : null}
    </section>
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>;
}
