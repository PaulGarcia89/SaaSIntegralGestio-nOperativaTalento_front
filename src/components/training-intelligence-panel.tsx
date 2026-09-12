"use client";

import { useUiText } from "@/components/ui-copy";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorState,
  Metric,
  MetricRow,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  captureTrainingIntelligence,
  fetchTrainingCompetencies,
  fetchTrainingIntelligence,
  fetchUsers,
  getApiErrorMessage,
} from "@/lib/backend";
import type { TrainingIntelligenceRecordType } from "@/lib/contracts";
import { formatDateTime } from "@/lib/training-labels";

/**
 * Inteligencia de aprendizaje.
 *
 * Qué cambió
 * ----------
 * · La tarjeta de brechas mostraba «Competencia 8f3a-…» y «Colaborador
 *   2b71-…»: el identificador de base de datos ocupaba el sitio del nombre.
 *   El endpoint de inteligencia sólo devuelve identificadores, así que ahora
 *   se resuelven contra los catálogos de competencias y de personas que el
 *   frontend ya consulta. Si un identificador no se puede resolver, se dice
 *   —«Competencia no identificada»— en vez de volcar el UUID.
 * · La previsión titulaba cada tarjeta con `cohortKey`, la clave técnica de
 *   la cohorte, sin explicar qué es.
 * · Se cortaba la lista de previsiones a ocho en silencio; ahora se dice
 *   cuántas hay en total.
 * · Cargar reemplazaba la pantalla entera —título incluido— por un aro
 *   girando.
 * · La brecha se pintaba con un distintivo rojo sin palabra que lo explicara.
 *
 * El contrato del backend no cambia: los mismos endpoints, los mismos campos.
 */

const templates: Record<TrainingIntelligenceRecordType, Record<string, unknown>> = {
  ROLE_PROFILE: { jobTitle: "", competencyId: "", targetLevel: "WORKING", weight: 1, isRequired: true },
  ASSESSMENT: { userId: "", competencyId: "", score: 0, targetScore: 70, source: "MANUAL" },
  CAREER_PLAN: { userId: "", title: "", targetRole: "", targetDate: "" },
  FEEDBACK_360: { courseId: "", subjectUserId: "", rating: 5, npsScore: 10, kind: "COURSE", comment: "" },
  ROI: {
    courseId: "",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    participantCount: 0,
    costAmount: 0,
    benefitAmount: 0,
    currency: "USD",
  },
  FORECAST: {
    courseId: "",
    cohortKey: "2026-Q1",
    assigned: 0,
    completed: 0,
    projectedCompletionRate: 0,
    projectedOverdue: 0,
  },
};

const labels: Record<TrainingIntelligenceRecordType, string> = {
  ROLE_PROFILE: "Perfil de competencia",
  ASSESSMENT: "Evaluación de brecha",
  CAREER_PLAN: "Plan de carrera",
  FEEDBACK_360: "Feedback 360 / NPS",
  ROI: "Medición de ROI",
  FORECAST: "Previsión de cumplimiento",
};

const FORECAST_LIMIT = 8;

export function TrainingIntelligencePanel() {
  const uiText = useUiText();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TrainingIntelligenceRecordType>("ROLE_PROFILE");
  const [values, setValues] = useState<Record<string, unknown>>(templates.ROLE_PROFILE);

  const intelligence = useQuery({ queryKey: ["training-intelligence"], queryFn: fetchTrainingIntelligence });

  // Los catálogos existen para poner nombre a los identificadores que devuelve
  // el resumen. Son secundarios: si fallan, la pantalla sigue funcionando y
  // sólo se pierde el nombre, no la cifra.
  const competencies = useQuery({ queryKey: ["training-competencies"], queryFn: fetchTrainingCompetencies });
  const people = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

  const capture = useMutation({
    mutationFn: () => captureTrainingIntelligence(type, values),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["training-intelligence"] });
      setOpen(false);
      toast.success("Registro de inteligencia guardado");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Revisa los campos requeridos.")),
  });

  const chooseType = (value: TrainingIntelligenceRecordType) => {
    setType(value);
    setValues(templates[value]);
  };

  const competencyName = (id: string) => {
    const match = competencies.data?.find((item) => item.id === id);
    if (!match) return "Competencia no identificada";
    return match.code ? `${match.name} (${match.code})` : match.name;
  };

  const personName = (id: string) => {
    const match = people.data?.find((item) => item.id === id);
    if (!match) return "Persona no identificada";
    return match.fullName || match.email;
  };

  const data = intelligence.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uiText("Aprendizaje")}
        title={uiText("Inteligencia de aprendizaje")}
        description={uiText("Competencias, carrera, feedback, retorno y previsiones, sin mezclar datos entre empresas.")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            {uiText("Registrar señal")}</Button>
        }
      />

      {intelligence.isLoading ? (
        <SkeletonRows rows={5} label={uiText("Cargando la inteligencia de aprendizaje")} />
      ) : intelligence.isError || !data ? (
        <ErrorState
          title={uiText("No fue posible cargar la inteligencia de aprendizaje")}
          detail={getApiErrorMessage(intelligence.error, uiText("Reintenta la consulta para continuar."))}
          onRetry={() => void intelligence.refetch()}
        />
      ) : (
        <>
          <MetricRow>
            <Metric label={uiText("Perfiles de competencia")} value={String(data.competencyProfiles)} />
            <Metric label={uiText("Evaluaciones", undefined, "capacitacion")} value={String(data.assessments)} />
            <Metric label={uiText("Planes de carrera activos")} value={String(data.careerPlans.active)} detail={`de ${data.careerPlans.total} en total`} />
            <Metric label={uiText("Respuestas de feedback")} value={String(data.feedback.responses)} />
            <Metric
              label={uiText("Retorno de la inversión")}
              value={data.roi.roiPercent === null ? "—" : `${data.roi.roiPercent} %`}
              detail={data.roi.measurements === 0 ? "sin mediciones todavía" : `sobre ${data.roi.measurements} mediciones`}
              tone={data.roi.roiPercent !== null && data.roi.roiPercent < 0 ? "danger" : undefined}
            />
          </MetricRow>

          <div className="grid gap-5 xl:grid-cols-2">
            <PageSection
              title={uiText("Brechas prioritarias")}
              description={uiText("Distancia entre el nivel evaluado y el nivel esperado.")}
              boxed
            >
              {data.gaps.length ? (
                <ul className="divide-y divide-line">
                  {data.gaps.map((gap) => (
                    <li
                      key={`${gap.userId}-${gap.competencyId}`}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-1">{competencyName(gap.competencyId)}</p>
                        <p className="truncate text-2xs text-ink-3">{personName(gap.userId)}</p>
                      </div>
                      <StatusBadge
                        size="sm"
                        tone={gap.gap >= 30 ? "danger" : "warning"}
                        label={`Faltan ${gap.gap} puntos`}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  reason="no-records"
                  title={uiText("Aún no hay brechas calculadas")}
                  description={uiText("Registra evaluaciones de competencia para que aparezcan aquí.")}
                />
              )}
            </PageSection>

            <PageSection
              title={uiText("Previsión de cumplimiento")}
              description={
                data.forecasts.length > FORECAST_LIMIT
                  ? `Las ${FORECAST_LIMIT} cohortes más recientes, de ${data.forecasts.length} registradas.`
                  : "Cada cohorte con su proyección de finalización."
              }
              boxed
            >
              {data.forecasts.length ? (
                <ul className="divide-y divide-line">
                  {data.forecasts.slice(0, FORECAST_LIMIT).map((forecast) => (
                    <li key={forecast.id} className="py-3">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <p className="min-w-0 truncate font-medium text-ink-1">{uiText("Cohorte ")}{forecast.cohortKey}</p>
                        <StatusBadge
                          size="sm"
                          tone={forecast.projectedCompletionRate >= 80 ? "success" : "warning"}
                          label={`${forecast.projectedCompletionRate} % proyectado`}
                        />
                      </div>
                      <p className="mt-1 font-mono text-2xs text-ink-3 tabular-figures">
                        {forecast.completed} {uiText(" de ")}{forecast.assigned} {uiText(" completados ·")}{" "}
                        {forecast.projectedOverdue} {uiText(" en riesgo de vencer · calculada el")}{" "}
                        {formatDateTime(forecast.generatedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  reason="no-records"
                  title={uiText("Todavía no hay previsiones")}
                  description={uiText("Registra una previsión para empezar el seguimiento de la cohorte.")}
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        chooseType("FORECAST");
                        setOpen(true);
                      }}
                    >
                      {uiText("Registrar una previsión")}</Button>
                  }
                />
              )}
            </PageSection>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{uiText("Registrar señal")}</DialogTitle>
            <DialogDescription>
              {uiText("Elige el tipo y completa los datos. Los identificadores se toman de las personas, los cursos y las competencias que ya existen.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={type} onValueChange={(value) => chooseType(value as TrainingIntelligenceRecordType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(labels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StructuredIntelligenceFields
              values={values}
              onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
            />
            <Button
              className="w-full"
              loading={capture.isPending}
              loadingLabel={uiText("Guardando…")}
              onClick={() => capture.mutate()}
            >
              {uiText("Guardar registro")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StructuredIntelligenceFields({
  values,
  onChange,
}: {
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Object.entries(values).map(([key, value]) => {
        const isBoolean = typeof value === "boolean";
        const isNumber = typeof value === "number";
        const id = `intelligence-${key}`;

        if (isBoolean) {
          return (
            <label
              key={key}
              htmlFor={id}
              className="flex items-center gap-3 rounded-md border border-line px-3 text-sm text-ink-1"
              style={{ minHeight: "var(--control-h-touch)" }}
            >
              <input
                id={id}
                type="checkbox"
                className="size-4 accent-[hsl(var(--accent-fill))]"
                checked={value}
                onChange={(event) => onChange(key, event.target.checked)}
              />
              <span>{intelligenceFieldLabel(key)}</span>
            </label>
          );
        }

        return (
          <div key={key} className="space-y-1">
            <label htmlFor={id} className="text-sm font-medium text-ink-1">
              {intelligenceFieldLabel(key)}
            </label>
            <input
              id={id}
              className="field"
              style={{ minHeight: "var(--control-h-touch)" }}
              type={isNumber ? "number" : key.toLowerCase().includes("date") ? "date" : "text"}
              inputMode={isNumber ? "decimal" : undefined}
              value={String(value ?? "")}
              onChange={(event) => onChange(key, isNumber ? Number(event.target.value) : event.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}

function intelligenceFieldLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}
