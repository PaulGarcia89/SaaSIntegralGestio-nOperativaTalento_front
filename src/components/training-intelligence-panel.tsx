"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, BriefcaseBusiness, ChartNoAxesCombined, Plus, Target, UsersRound } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { captureTrainingIntelligence, fetchTrainingIntelligence, getApiErrorMessage } from "@/lib/backend";
import type { TrainingIntelligenceRecordType } from "@/lib/contracts";

const templates: Record<TrainingIntelligenceRecordType, Record<string, unknown>> = {
  ROLE_PROFILE: { jobTitle: "", competencyId: "", targetLevel: "WORKING", weight: 1, isRequired: true },
  ASSESSMENT: { userId: "", competencyId: "", score: 0, targetScore: 70, source: "MANUAL" },
  CAREER_PLAN: { userId: "", title: "", targetRole: "", targetDate: "" },
  FEEDBACK_360: { courseId: "", subjectUserId: "", rating: 5, npsScore: 10, kind: "COURSE", comment: "" },
  ROI: { courseId: "", periodStart: "2026-01-01", periodEnd: "2026-03-31", participantCount: 0, costAmount: 0, benefitAmount: 0, currency: "USD" },
  FORECAST: { courseId: "", cohortKey: "2026-Q1", assigned: 0, completed: 0, projectedCompletionRate: 0, projectedOverdue: 0 },
};

const labels: Record<TrainingIntelligenceRecordType, string> = { ROLE_PROFILE: "Perfil de competencia", ASSESSMENT: "Evaluación de brecha", CAREER_PLAN: "Plan de carrera", FEEDBACK_360: "Feedback 360 / NPS", ROI: "Medición de ROI", FORECAST: "Previsión de cumplimiento" };

function Textarea(props: ComponentProps<"textarea">) { return <textarea {...props} className={`min-h-64 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-primary ${props.className ?? ""}`} />; }

export function TrainingIntelligencePanel() {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TrainingIntelligenceRecordType>("ROLE_PROFILE");
  const [payload, setPayload] = useState(JSON.stringify(templates.ROLE_PROFILE, null, 2));
  const intelligence = useQuery({ queryKey: ["training-intelligence"], queryFn: fetchTrainingIntelligence });
  const capture = useMutation({ mutationFn: () => captureTrainingIntelligence(type, JSON.parse(payload) as Record<string, unknown>), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["training-intelligence"] }); setOpen(false); toast.success("Registro de inteligencia guardado"); }, onError: (error) => toast.error(getApiErrorMessage(error, "Revisa los campos requeridos.")) });
  const chooseType = (value: TrainingIntelligenceRecordType) => { setType(value); setPayload(JSON.stringify(templates[value], null, 2)); };
  if (intelligence.isLoading) return <AsyncState state="loading" title="Cargando inteligencia de aprendizaje" />;
  if (intelligence.isError) return <AsyncState state="error" title="No fue posible cargar la inteligencia" description={getApiErrorMessage(intelligence.error, "Reintenta para continuar.")} onRetry={() => intelligence.refetch()} />;
  const data = intelligence.data!;
  return <div className="space-y-6"><PageHeader eyebrow="Aprendizaje" title="Inteligencia de aprendizaje" description="Conecta competencias, carrera, feedback, retorno y previsiones sin mezclar datos entre empresas." actions={<Button onClick={() => setOpen(true)}><Plus />Registrar señal</Button>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={Target} label="Perfiles" value={data.competencyProfiles} /><Metric icon={BrainCircuit} label="Evaluaciones" value={data.assessments} /><Metric icon={BriefcaseBusiness} label="Planes activos" value={data.careerPlans.active} /><Metric icon={UsersRound} label="Feedback" value={data.feedback.responses} /><Metric icon={ChartNoAxesCombined} label="ROI" value={data.roi.roiPercent === null ? "-" : `${data.roi.roiPercent}%`} /></section>
    <section className="grid gap-4 xl:grid-cols-2"><Card><CardHeader><CardTitle>Brechas prioritarias</CardTitle></CardHeader><CardContent className="space-y-2">{data.gaps.length ? data.gaps.map((gap) => <div key={`${gap.userId}-${gap.competencyId}`} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-medium">Competencia {gap.competencyId}</p><p className="text-xs text-muted-foreground">Colaborador {gap.userId}</p></div><Badge variant="destructive">-{gap.gap} puntos</Badge></div>) : <p className="text-sm text-muted-foreground">Aún no hay brechas calculadas.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Previsión y benchmark interno</CardTitle></CardHeader><CardContent className="space-y-2">{data.forecasts.length ? data.forecasts.slice(0, 8).map((forecast) => <div key={forecast.id} className="rounded-xl border p-3"><div className="flex justify-between gap-3"><strong>{forecast.cohortKey}</strong><Badge variant="secondary">{forecast.projectedCompletionRate}% proyectado</Badge></div><p className="mt-1 text-xs text-muted-foreground">{forecast.completed}/{forecast.assigned} completados · {forecast.projectedOverdue} en riesgo</p></div>) : <p className="text-sm text-muted-foreground">Registra una previsión para iniciar el seguimiento.</p>}</CardContent></Card></section>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Registrar señal</DialogTitle><DialogDescription>Selecciona el tipo y completa los datos. Los IDs se obtienen de usuarios, cursos y competencias existentes.</DialogDescription></DialogHeader><div className="space-y-4"><Select value={type} onValueChange={(value) => chooseType(value as TrainingIntelligenceRecordType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(labels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Textarea className="min-h-64 font-mono text-xs" value={payload} onChange={(event) => setPayload(event.target.value)} aria-label="Datos de inteligencia en formato JSON" /><Button className="w-full" disabled={capture.isPending} onClick={() => { try { JSON.parse(payload); capture.mutate(); } catch { toast.error("El formato de datos no es JSON válido."); } }}>{capture.isPending ? "Guardando..." : "Guardar registro"}</Button></div></DialogContent></Dialog>
  </div>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string | number }) { return <Card><CardContent className="p-5"><Icon className="size-5 text-primary" /><p className="mt-3 text-sm text-muted-foreground">{label}</p><p className="text-3xl font-semibold">{value}</p></CardContent></Card>; }
