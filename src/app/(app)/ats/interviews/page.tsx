import Link from "next/link";
import { AlertTriangle, CheckCheck, ClipboardCheck, Users2 } from "lucide-react";
import { ModuleHeader, SectionCard, DataTable, SplitPanel, InfoList } from "@/components/ui";
import { candidateStructuredAssessments, interviews } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function InterviewsPage() {
  const pendingAssessments = candidateStructuredAssessments.filter((assessment) => assessment.feedbackPendingCount > 0);
  const completedAssessments = candidateStructuredAssessments.filter((assessment) => assessment.feedbackPendingCount === 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Entrevistas"
        title="Agenda, espacios disponibles y retroalimentación estructurada."
        description="Diseño para coordinar paneles, recordatorios, tarjetas de evaluación y seguimiento de decisiones sin salir del ATS."
        actions={
          <Button asChild>
            <Link href="/ats/candidates">Ver postulantes</Link>
          </Button>
        }
        metrics={[
          { label: "Entrevistas de hoy", value: "8", detail: "Paneles distribuidos entre Miami, Orlando y Tampa" },
          { label: "Slots confirmados", value: "92%", detail: "Coordinacion alta entre candidatos y entrevistadores" },
          { label: "Retroalimentación pendiente", value: "3", detail: "Tarjetas de evaluación por cerrar antes del corte diario" },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title="Agenda de entrevistas" subtitle="Calendario y lista">
            <div className="space-y-5">
              <DataTable
                columns={["Candidato", "Horario", "Panel", "Estado"]}
                rows={interviews.map((item) => [item.candidate, item.when, item.panel, item.status])}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                      <ClipboardCheck className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kits de entrevista activos</p>
                      <p className="font-medium text-foreground">3 paneles con criterios definidos por etapa</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                      <Users2 className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entrevistadores alineados</p>
                      <p className="font-medium text-foreground">Cada panel comparte tarjeta de evaluación y regla de cierre</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        }
        right={
          <SectionCard title="Cierre estructurado del panel" subtitle="Contratación disciplinada">
            <div className="space-y-5">
              <InfoList
                items={[
                  { title: "Carga balanceada", description: "Los paneles tecnicos concentran la mayor demanda y deben priorizar disponibilidad por sucursal", badge: "Agenda" },
                  { title: "Retroalimentación obligatoria", description: "Ningun candidato avanza de etapa mientras falte al menos una tarjeta de evaluación requerida del panel.", badge: "Regla" },
                  { title: "Decision consolidada", description: "La recomendacion final se genera una vez que RRHH y entrevistadores completan sus criterios." },
                ]}
              />

              <div className="space-y-3">
                {pendingAssessments.map((assessment) => (
                  <div key={assessment.candidateId} className="rounded-2xl border border-border/70 bg-card/90 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{assessment.currentStage}</p>
                        <p className="text-sm text-muted-foreground">{assessment.decisionSummary}</p>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        {assessment.feedbackPendingCount} pendiente
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-sm">
                      <AlertTriangle className="size-4 text-amber-500" />
                      <span className="text-muted-foreground">Avance bloqueado hasta completar la retroalimentación del panel.</span>
                    </div>
                  </div>
                ))}

                {completedAssessments.map((assessment) => (
                  <div key={assessment.candidateId} className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{assessment.consolidatedRecommendation}</p>
                        <p className="text-sm text-muted-foreground">{assessment.decisionSummary}</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        Panel completo
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-sm">
                      <CheckCheck className="size-4 text-emerald-500" />
                      <span className="text-muted-foreground">Listo para mover etapa o emitir decisión final.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        }
      />
    </>
  );
}
