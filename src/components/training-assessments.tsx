"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Award, CheckCircle2, ClipboardCheck, Library, Plus, Settings2, ShieldCheck, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { PageHeader, Pagination } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTrainingAssessment,
  createTrainingAssessmentQuestion,
  createTrainingQuestionBankItem,
  deleteTrainingAssessmentQuestion,
  deleteTrainingAssessment,
  fetchLearnerTrainingCourse,
  fetchTrainingAssessmentAttempt,
  fetchMyTrainingAssignments,
  fetchMyTrainingCertificates,
  fetchTrainingAdminCertificates,
  fetchTrainingAssessmentResults,
  fetchTrainingAssessments,
  fetchTrainingQuestionBank,
  fetchTrainingCourses,
  getApiErrorMessage,
  gradeTrainingAssessment,
  importTrainingQuestionBankItems,
  reorderTrainingAssessmentQuestions,
  renewTrainingCertificate,
  revokeTrainingCertificate,
  saveTrainingAssessmentAnswer,
  startTrainingAssessment,
  submitTrainingAssessment,
  updateTrainingAssessment,
} from "@/lib/backend";
import type {
  TrainingCertificateDto,
  TrainingQuestionType,
  TrainingQuestionDifficulty,
  TrainingQuizAttemptDto,
  TrainingQuizDto,
  TrainingQuizAttemptRecoveryDto,
} from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { formatTrainingRemainingTime } from "@/lib/training-ux";
import { acquireTrainingAssessmentSubmit, clearTrainingAssessmentSubmitKey, getTrainingAssessmentSubmitKey, persistTrainingAssessmentSubmitKey } from "@/lib/training-assessment-submit-storage";

export function TrainingEvaluations() {
  const { can } = useAppStore();
  return can("assessments.manage") ? <AssessmentBuilder /> : <LearnerAssessments />;
}

function AssessmentBuilder() {
  const queryClient = useQueryClient();
  const courseId = useSearchParams().get("courseId") ?? undefined;
  const [createOpen, setCreateOpen] = useState(Boolean(courseId));
  const [questionQuiz, setQuestionQuiz] = useState<TrainingQuizDto | null>(null);
  const [configureQuiz, setConfigureQuiz] = useState<TrainingQuizDto | null>(null);
  const [bankQuiz, setBankQuiz] = useState<TrainingQuizDto | null>(null);
  const query = useQuery({ queryKey: ["training-assessments"], queryFn: fetchTrainingAssessments });
  const remove = useMutation({
    mutationFn: deleteTrainingAssessment,
    onSuccess: () => {
      toast.success("Evaluación eliminada");
      queryClient.invalidateQueries({ queryKey: ["training-assessments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar la evaluación")),
  });
  const removeQuestion = useMutation({
    mutationFn: deleteTrainingAssessmentQuestion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training-assessments"] }),
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar la pregunta")),
  });
  const reorder = useMutation({
    mutationFn: ({ quizId, entityIds }: { quizId: string; entityIds: string[] }) =>
      reorderTrainingAssessmentQuestions(quizId, entityIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["training-assessments"] }),
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo reordenar la evaluación")),
  });
  const moveQuestion = (quiz: TrainingQuizDto, index: number, direction: -1 | 1) => {
    const next = [...quiz.questions];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate({ quizId: quiz.id, entityIds: next.map((question) => question.id) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Aprendizaje"
        title="Evaluaciones"
        description="Diseña instrumentos de evaluación, configura intentos y controla el criterio de aprobación."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus />Nueva evaluación</Button>}
      />
      {query.isLoading ? <AsyncState state="loading" title="Cargando evaluaciones" /> : null}
      {query.isError ? (
        <AsyncState state="error" title="No fue posible cargar las evaluaciones" onRetry={() => query.refetch()} />
      ) : null}
      {query.data ? <AssessmentBuilderSummary assessments={query.data.items} /> : null}
      {query.data?.items.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {query.data.items.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div><CardTitle>{quiz.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{quiz.course?.title}</p></div>
                  <Badge>{quiz.passingScore}% mínimo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{quiz.description || "Sin descripción"}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">{quiz.questions.length} preguntas</Badge>
                  <Badge variant="secondary">{quiz.maxAttempts ?? "∞"} intentos</Badge>
                  <Badge variant="secondary">{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : "Sin límite"}</Badge>
                  <Badge variant={quiz.readiness?.ready ? "success" : "destructive"}>{quiz.readiness?.ready ? "Lista" : "Incompleta"}</Badge>
                </div>
                {!quiz.readiness?.ready && quiz.readiness?.errors.length ? <p className="rounded-xl bg-status-warning-soft p-3 text-sm text-status-warning">{quiz.readiness.errors.join(" · ")}</p> : null}
                <div className="space-y-2">
                  {quiz.questions.map((question, index) => (
                    <div key={question.id} className="flex items-center gap-2 rounded-xl border border-border-default p-3">
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{index + 1}. {question.prompt}</p><p className="text-xs text-text-secondary">{question.points} pts · {question.difficulty ?? "MEDIUM"}{question.category ? ` · ${question.category}` : ""}</p></div>
                      <Button size="icon" variant="ghost" aria-label="Subir pregunta" disabled={index === 0 || reorder.isPending} onClick={() => moveQuestion(quiz, index, -1)}><ArrowUp className="size-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Bajar pregunta" disabled={index === quiz.questions.length - 1 || reorder.isPending} onClick={() => moveQuestion(quiz, index, 1)}><ArrowDown className="size-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Eliminar pregunta" disabled={removeQuestion.isPending} onClick={() => removeQuestion.mutate(question.id)}><Trash2 className="size-4 text-status-danger" /></Button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setQuestionQuiz(quiz)}>
                    <Plus />Agregar pregunta
                  </Button>
                  <Button variant="secondary" onClick={() => setBankQuiz(quiz)}><Library />Banco</Button>
                  <Button variant="secondary" onClick={() => setConfigureQuiz(quiz)}><Settings2 />Reglas</Button>
                  <Button variant="destructive" size="icon" aria-label={`Eliminar ${quiz.title}`} onClick={() => { if (window.confirm(`¿Eliminar la evaluación “${quiz.title}”? Solo se puede eliminar si no tiene intentos.`)) remove.mutate(quiz.id); }}>
                    <Trash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : query.isSuccess ? <EmptyCard title="Aún no hay evaluaciones" description="Crea la primera evaluación y vincúlala con un curso." /> : null}
      <CreateAssessmentDialog open={createOpen} onOpenChange={setCreateOpen} initialCourseId={courseId} />
      <ConfigureAssessmentDialog quiz={configureQuiz} onClose={() => setConfigureQuiz(null)} />
      <CreateQuestionDialog quiz={questionQuiz} onClose={() => setQuestionQuiz(null)} />
      <QuestionBankDialog quiz={bankQuiz} onClose={() => setBankQuiz(null)} />
    </div>
  );
}

function AssessmentBuilderSummary({ assessments }: { assessments: TrainingQuizDto[] }) {
  const ready = assessments.filter((assessment) => assessment.readiness?.ready).length;
  const questions = assessments.reduce((total, assessment) => total + assessment.questions.length, 0);
  const attempts = assessments.reduce((total, assessment) => total + (assessment._count?.attempts ?? 0), 0);
  const incomplete = assessments.length - ready;

  return (
    <section aria-labelledby="assessment-summary-title" className="space-y-3">
      <div>
        <h2 id="assessment-summary-title" className="text-lg font-semibold">Estado de tus evaluaciones</h2>
        <p className="text-sm text-muted-foreground">Revisa la preparación antes de abrir una evaluación individual.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AssessmentMetric label="Evaluaciones" value={assessments.length} icon={<ClipboardCheck className="size-4" />} />
        <AssessmentMetric label="Listas para usar" value={ready} icon={<CheckCircle2 className="size-4" />} tone="success" />
        <AssessmentMetric label="Requieren revisión" value={incomplete} icon={<Settings2 className="size-4" />} tone={incomplete ? "warning" : "normal"} />
        <AssessmentMetric label="Preguntas" value={questions} detail={`${attempts} intentos registrados`} icon={<Library className="size-4" />} />
      </div>
    </section>
  );
}

function AssessmentMetric({
  label,
  value,
  detail,
  icon,
  tone = "normal",
}: {
  label: string;
  value: number;
  detail?: string;
  icon: ReactNode;
  tone?: "normal" | "success" | "warning";
}) {
  return (
    <Card level={2}>
      <CardContent className="p-4">
        <div className={`mb-3 flex size-8 items-center justify-center rounded-lg ${tone === "success" ? "bg-status-success/10 text-status-success" : tone === "warning" ? "bg-status-warning/10 text-status-warning" : "bg-primary/10 text-brand"}`}>
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

function CreateAssessmentDialog({ open, onOpenChange, initialCourseId }: { open: boolean; onOpenChange: (open: boolean) => void; initialCourseId?: string }) {
  const queryClient = useQueryClient();
  const courses = useQuery({ queryKey: ["training-courses-for-assessment"], queryFn: () => fetchTrainingCourses({ pageSize: 100 }) });
  const mutation = useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input: Parameters<typeof createTrainingAssessment>[1] }) =>
      createTrainingAssessment(courseId, input),
    onSuccess: () => {
      toast.success("Evaluación creada");
      queryClient.invalidateQueries({ queryKey: ["training-assessments"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear la evaluación")),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    mutation.mutate({
      courseId: String(data.get("courseId")),
      input: {
        title: String(data.get("title")),
        description: String(data.get("description") || ""),
        passingScore: Number(data.get("passingScore")),
        maxAttempts: Number(data.get("maxAttempts")) || undefined,
        timeLimitMinutes: Number(data.get("timeLimitMinutes")) || undefined,
        shuffleQuestions: data.get("shuffleQuestions") === "on",
        shuffleOptions: data.get("shuffleOptions") === "on",
        cooldownMinutes: Number(data.get("cooldownMinutes")) || undefined,
        requireAllQuestions: data.get("requireAllQuestions") === "on",
        feedbackMode: "AFTER_SUBMISSION",
      },
    });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="[&>form>button:last-child]:sticky [&>form>button:last-child]:bottom-0 [&>form>button:last-child]:z-10 [&>form>button:last-child]:bg-card [&>form>button:last-child]:py-3">
        <DialogHeader><DialogTitle>Nueva evaluación</DialogTitle><DialogDescription>Define las reglas generales. Después podrás agregar preguntas.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div><Label htmlFor="assessment-course">Curso</Label><Select name="courseId" defaultValue={initialCourseId} required><SelectTrigger id="assessment-course"><SelectValue placeholder="Selecciona un curso" /></SelectTrigger><SelectContent>{courses.data?.items.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="assessment-title">Título</Label><Input id="assessment-title" name="title" required /></div>
          <div><Label htmlFor="assessment-description">Descripción</Label><Input id="assessment-description" name="description" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label htmlFor="passingScore">Aprobación %</Label><Input id="passingScore" name="passingScore" type="number" min="1" max="100" defaultValue="80" required /></div>
            <div><Label htmlFor="maxAttempts">Intentos</Label><Input id="maxAttempts" name="maxAttempts" type="number" min="1" defaultValue="3" /></div>
            <div><Label htmlFor="timeLimitMinutes">Minutos</Label><Input id="timeLimitMinutes" name="timeLimitMinutes" type="number" min="1" /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="shuffleQuestions" /> Mezclar preguntas</label>
            <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="shuffleOptions" /> Mezclar opciones</label>
            <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="requireAllQuestions" defaultChecked /> Exigir todas</label>
          </div>
          <div><Label htmlFor="cooldownMinutes">Espera entre intentos (minutos)</Label><Input id="cooldownMinutes" name="cooldownMinutes" type="number" min="0" /></div>
          <Button className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Creando…" : "Crear evaluación"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfigureAssessmentDialog({ quiz, onClose }: { quiz: TrainingQuizDto | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof updateTrainingAssessment>[1]) =>
      updateTrainingAssessment(quiz!.id, input),
    onSuccess: () => {
      toast.success("Reglas de evaluación actualizadas");
      queryClient.invalidateQueries({ queryKey: ["training-assessments"] });
      onClose();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudieron actualizar las reglas")),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const availableFrom = String(data.get("availableFrom") || "");
    const availableUntil = String(data.get("availableUntil") || "");
    const rubric = String(data.get("rubric") || "");
    mutation.mutate({
      title: String(data.get("title")),
      description: String(data.get("description") || ""),
      passingScore: Number(data.get("passingScore")),
      maxAttempts: Number(data.get("maxAttempts")) || undefined,
      timeLimitMinutes: Number(data.get("timeLimitMinutes")) || undefined,
      randomQuestionCount: Number(data.get("randomQuestionCount")) || undefined,
      cooldownMinutes: Number(data.get("cooldownMinutes")) || undefined,
      shuffleQuestions: data.get("shuffleQuestions") === "on",
      shuffleOptions: data.get("shuffleOptions") === "on",
      requireAllQuestions: data.get("requireAllQuestions") === "on",
      feedbackMode: String(data.get("feedbackMode")) as TrainingQuizDto["feedbackMode"],
      availableFrom: availableFrom ? new Date(availableFrom).toISOString() : undefined,
      availableUntil: availableUntil ? new Date(availableUntil).toISOString() : undefined,
      rubric: rubric ? { criteria: rubric } : undefined,
    });
  }
  return (
    <Dialog open={Boolean(quiz)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto [&>form>button:last-child]:sticky [&>form>button:last-child]:bottom-0 [&>form>button:last-child]:z-10 [&>form>button:last-child]:bg-card [&>form>button:last-child]:py-3">
        <DialogHeader><DialogTitle>Reglas de evaluación</DialogTitle><DialogDescription>Controla disponibilidad, selección, intentos y retroalimentación.</DialogDescription></DialogHeader>
        {quiz ? <form className="space-y-4" onSubmit={submit}>
          <div><Label htmlFor="config-title">Título</Label><Input id="config-title" name="title" defaultValue={quiz.title} required /></div>
          <div><Label htmlFor="config-description">Descripción</Label><Input id="config-description" name="description" defaultValue={quiz.description ?? ""} /></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label>Aprobación %</Label><Input name="passingScore" type="number" min="1" max="100" defaultValue={quiz.passingScore} /></div>
            <div><Label>Intentos</Label><Input name="maxAttempts" type="number" min="1" defaultValue={quiz.maxAttempts ?? ""} /></div>
            <div><Label>Tiempo (min)</Label><Input name="timeLimitMinutes" type="number" min="1" defaultValue={quiz.timeLimitMinutes ?? ""} /></div>
            <div><Label>Preguntas aleatorias</Label><Input name="randomQuestionCount" type="number" min="1" max={quiz.questions.length} defaultValue={quiz.randomQuestionCount ?? ""} /></div>
            <div><Label>Espera (min)</Label><Input name="cooldownMinutes" type="number" min="0" defaultValue={quiz.cooldownMinutes ?? ""} /></div>
            <div><Label>Retroalimentación</Label><Select name="feedbackMode" defaultValue={quiz.feedbackMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AFTER_SUBMISSION">Al enviar</SelectItem><SelectItem value="AFTER_PASSING">Al aprobar</SelectItem><SelectItem value="NEVER">Nunca</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Disponible desde</Label><Input name="availableFrom" type="datetime-local" /></div>
            <div><Label>Disponible hasta</Label><Input name="availableUntil" type="datetime-local" /></div>
          </div>
          <div><Label>Rúbrica general</Label><Input name="rubric" defaultValue={String(quiz.rubric?.criteria ?? "")} placeholder="Criterios generales de calidad" /></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2"><input type="checkbox" name="shuffleQuestions" defaultChecked={quiz.shuffleQuestions} />Mezclar preguntas</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="shuffleOptions" defaultChecked={quiz.shuffleOptions} />Mezclar opciones</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="requireAllQuestions" defaultChecked={quiz.requireAllQuestions} />Exigir todas</label>
          </div>
          <Button className="w-full" disabled={mutation.isPending}>Guardar reglas</Button>
        </form> : null}
      </DialogContent>
    </Dialog>
  );
}

function CreateQuestionDialog({ quiz, onClose }: { quiz: TrainingQuizDto | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<TrainingQuestionType>("SINGLE_CHOICE");
  const [difficulty, setDifficulty] = useState<TrainingQuestionDifficulty>("MEDIUM");
  const mutation = useMutation({
    mutationFn: async ({ input, saveToBank }: { input: Parameters<typeof createTrainingAssessmentQuestion>[1]; saveToBank: boolean }) => {
      const question = await createTrainingAssessmentQuestion(quiz!.id, input);
      if (saveToBank) await createTrainingQuestionBankItem(input);
      return question;
    },
    onSuccess: () => {
      toast.success("Pregunta agregada");
      queryClient.invalidateQueries({ queryKey: ["training-assessments"] });
      onClose();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo agregar la pregunta")),
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const labels = type === "TRUE_FALSE"
      ? ["Verdadero", "Falso"]
      : [String(data.get("option1") || ""), String(data.get("option2") || ""), String(data.get("option3") || ""), String(data.get("option4") || "")].filter(Boolean);
    const correct = Number(data.get("correct") || 0);
    const multipleCorrect = data.getAll("correctMultiple").map(Number);
    const rubric = String(data.get("rubric") || "");
    mutation.mutate({
      input: {
        prompt: String(data.get("prompt")),
        questionType: type,
        explanation: String(data.get("explanation") || ""),
        points: Number(data.get("points") || 1),
        requiresManualGrading: type === "TEXT",
        category: String(data.get("category") || "") || undefined,
        difficulty,
        tags: String(data.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean),
        rubric: rubric ? { criteria: rubric } : undefined,
        options: type === "TEXT" ? [] : labels.map((label, index) => ({ label, isCorrect: type === "MULTIPLE_CHOICE" ? multipleCorrect.includes(index) : index === correct })),
      },
      saveToBank: data.get("saveToBank") === "on",
    });
  }
  return (
    <Dialog open={Boolean(quiz)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="[&>form>button:last-child]:sticky [&>form>button:last-child]:bottom-0 [&>form>button:last-child]:z-10 [&>form>button:last-child]:bg-card [&>form>button:last-child]:py-3">
        <DialogHeader><DialogTitle>Agregar pregunta</DialogTitle><DialogDescription>{quiz?.title}</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div><Label htmlFor="question-prompt">Enunciado</Label><Input id="question-prompt" name="prompt" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label><Select value={type} onValueChange={(value) => setType(value as TrainingQuestionType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SINGLE_CHOICE">Selección única</SelectItem><SelectItem value="MULTIPLE_CHOICE">Selección múltiple</SelectItem><SelectItem value="TRUE_FALSE">Verdadero/Falso</SelectItem><SelectItem value="TEXT">Respuesta corta</SelectItem></SelectContent></Select></div>
            <div><Label htmlFor="question-points">Puntos</Label><Input id="question-points" name="points" type="number" min="1" defaultValue="1" required /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Categoría</Label><Input name="category" placeholder="Ej. Seguridad" /></div>
            <div><Label>Dificultad</Label><Select value={difficulty} onValueChange={(value) => setDifficulty(value as TrainingQuestionDifficulty)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EASY">Básica</SelectItem><SelectItem value="MEDIUM">Intermedia</SelectItem><SelectItem value="HARD">Avanzada</SelectItem></SelectContent></Select></div>
          </div>
          {type !== "TEXT" && type !== "TRUE_FALSE" ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((index) => <Input key={index} name={`option${index + 1}`} placeholder={`Opción ${index + 1}${index < 2 ? " (obligatoria)" : ""}`} required={index < 2} />)}
              {type === "MULTIPLE_CHOICE" ? <div className="flex flex-wrap gap-4">{[0, 1, 2, 3].map((index) => <label key={index} className="flex items-center gap-2 text-sm"><input type="checkbox" name="correctMultiple" value={index} defaultChecked={index === 0} />Opción {index + 1}</label>)}</div> : <div><Label>Opción correcta</Label><Select name="correct" defaultValue="0"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[0, 1, 2, 3].map((index) => <SelectItem key={index} value={String(index)}>Opción {index + 1}</SelectItem>)}</SelectContent></Select></div>}
            </div>
          ) : null}
          {type === "TRUE_FALSE" ? <div><Label>Respuesta correcta</Label><Select name="correct" defaultValue="0"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Verdadero</SelectItem><SelectItem value="1">Falso</SelectItem></SelectContent></Select></div> : null}
          <div><Label htmlFor="question-explanation">Explicación posterior</Label><Input id="question-explanation" name="explanation" /></div>
          <div><Label>Etiquetas</Label><Input name="tags" placeholder="procedimiento, prevención" /></div>
          {type === "TEXT" ? <div><Label>Rúbrica de calificación</Label><Input name="rubric" required placeholder="Criterios observables y puntaje esperado" /></div> : null}
          <label className="flex items-center gap-2 rounded-xl bg-surface-section p-3 text-sm"><input type="checkbox" name="saveToBank" />Guardar también en el banco de preguntas</label>
          <Button className="w-full" disabled={mutation.isPending}>Guardar pregunta</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuestionBankDialog({ quiz, onClose }: { quiz: TrainingQuizDto | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const query = useQuery({
    queryKey: ["training-question-bank"],
    queryFn: () => fetchTrainingQuestionBank(),
    enabled: Boolean(quiz),
  });
  const mutation = useMutation({
    mutationFn: () => importTrainingQuestionBankItems(quiz!.id, selected),
    onSuccess: () => {
      toast.success(`${selected.length} preguntas importadas`);
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["training-assessments"] });
      onClose();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudieron importar las preguntas")),
  });
  return (
    <Dialog open={Boolean(quiz)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto [&>button:last-child]:sticky [&>button:last-child]:bottom-0 [&>button:last-child]:z-10 [&>button:last-child]:bg-card [&>button:last-child]:py-3">
        <DialogHeader><DialogTitle>Banco de preguntas</DialogTitle><DialogDescription>Selecciona preguntas validadas para copiarlas a {quiz?.title}.</DialogDescription></DialogHeader>
        {query.isLoading ? <AsyncState state="loading" /> : null}
        {query.data?.items.length ? <div className="space-y-2">
          {query.data.items.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-default p-3">
              <input
                className="mt-1"
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={(event) => setSelected(event.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))}
              />
              <span className="min-w-0"><span className="block font-medium">{item.prompt}</span><span className="text-xs text-text-secondary">{item.category || "Sin categoría"} · {item.difficulty} · {item.points} pts</span></span>
            </label>
          ))}
        </div> : query.isSuccess ? <EmptyCard title="Banco vacío" description="Marca “Guardar también en el banco” al crear una pregunta." /> : null}
        <Button disabled={!selected.length || mutation.isPending} onClick={() => mutation.mutate()}>Importar {selected.length || ""} preguntas</Button>
      </DialogContent>
    </Dialog>
  );
}

function LearnerAssessments() {
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState<AssessmentPlayerAttempt | null>(null);
  const query = useQuery({
    queryKey: ["learner-assessments"],
    queryFn: async () => {
      const assignments = await fetchMyTrainingAssignments({ pageSize: 100 });
      const courses = await Promise.all(assignments.items.filter((item) => item.courseId).map((item) => fetchLearnerTrainingCourse(item.courseId!)));
      return courses.flatMap((course) => course.quizSummary ?? []);
    },
  });
  useEffect(() => {
    query.data?.forEach((quiz) => {
      if (quiz.latestAttempt && quiz.latestAttempt.status !== "IN_PROGRESS") clearTrainingAssessmentSubmitKey(quiz.latestAttempt.id);
    });
  }, [query.data]);
  const start = useMutation({
    mutationFn: startTrainingAssessment,
    onSuccess: (data) => setAttempt(data),
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo iniciar la evaluación")),
  });
  const resume = useMutation({
    mutationFn: async (quiz: LearnerQuizSummary) => {
      if (!quiz.latestAttempt) throw new Error("No hay un intento activo para reanudar.");
      const recovered = await fetchTrainingAssessmentAttempt(quiz.id, quiz.latestAttempt.id);
      return mapRecoveredAttempt(recovered, quiz);
    },
    onSuccess: (data) => setAttempt(data),
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo recuperar el intento")),
  });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Aprendizaje" title="Mis evaluaciones" description="Completa tus evaluaciones pendientes y consulta claramente el resultado de cada intento." />
      {query.isLoading ? <AsyncState state="loading" title="Cargando evaluaciones" /> : null}
      {query.data?.length ? <LearnerAssessmentSummary quizzes={query.data} /> : null}
      {query.data?.length ? <div className="grid gap-4 md:grid-cols-2">{query.data.map((quiz) => { const inProgress = quiz.latestAttempt?.status === "IN_PROGRESS"; const pending = start.isPending || resume.isPending; return <Card key={quiz.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{quiz.title}</CardTitle><LearnerAttemptBadge attempt={quiz.latestAttempt} /></div><p className="mt-1 text-sm text-muted-foreground">{quiz.description || "Completa esta evaluación para demostrar tu aprendizaje."}</p></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2"><Badge>{quiz.passingScore}% para aprobar</Badge><Badge variant="secondary">{quiz.questionsCount} preguntas</Badge>{quiz.timeLimitMinutes ? <Badge variant="secondary">{quiz.timeLimitMinutes} min</Badge> : null}</div>{quiz.latestAttempt?.score != null ? <p className="rounded-xl bg-surface-section p-3 text-sm">Último resultado: <strong>{quiz.latestAttempt.score}%</strong>{quiz.latestAttempt.passed ? " · Aprobada" : " · No aprobada"}</p> : null}{quiz.latestAttempt?.feedback ? <p className="text-sm text-muted-foreground">Retroalimentación: {quiz.latestAttempt.feedback}</p> : null}<Button className="w-full" onClick={() => inProgress ? resume.mutate(quiz) : start.mutate(quiz.id)} disabled={pending}><ClipboardCheck />{inProgress ? "Continuar evaluación" : "Comenzar evaluación"}</Button></CardContent></Card>; })}</div> : query.isSuccess ? <EmptyCard title="No tienes evaluaciones pendientes" /> : null}
      <AssessmentPlayer key={attempt?.id ?? "no-attempt"} attempt={attempt} onClose={() => setAttempt(null)} onSubmitted={() => queryClient.invalidateQueries({ queryKey: ["learner-assessments"] })} />
    </div>
  );
}

function LearnerAssessmentSummary({ quizzes }: { quizzes: Array<{ latestAttempt?: TrainingQuizAttemptDto | null }> }) {
  const completed = quizzes.filter((quiz) => quiz.latestAttempt?.status === "GRADED").length;
  const pending = quizzes.filter((quiz) => quiz.latestAttempt?.status === "PENDING_REVIEW" || quiz.latestAttempt?.status === "SUBMITTED").length;
  const passed = quizzes.filter((quiz) => quiz.latestAttempt?.passed).length;

  return (
    <section aria-labelledby="learner-assessment-summary" className="rounded-2xl border border-border-default bg-surface-section p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="learner-assessment-summary" className="font-semibold">Tu avance en evaluaciones</h2>
          <p className="text-sm text-muted-foreground">Consulta tu último intento antes de volver a empezar.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <SummaryValue label="Aprobadas" value={passed} />
          <SummaryValue label="Revisadas" value={completed} />
          <SummaryValue label="En revisión" value={pending} />
        </div>
      </div>
    </section>
  );
}

function SummaryValue({ label, value }: { label: string; value: number }) {
  return <div className="min-w-20 rounded-xl bg-card px-3 py-2"><p className="text-lg font-semibold">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>;
}

function LearnerAttemptBadge({ attempt }: { attempt?: TrainingQuizAttemptDto | null }) {
  if (!attempt) return null;
  const content = attempt.status === "PENDING_REVIEW" || attempt.status === "SUBMITTED"
    ? "En revisión"
    : attempt.status === "IN_PROGRESS"
      ? "En curso"
      : attempt.passed
        ? "Aprobada"
        : "Último intento";
  const variant = attempt.status === "PENDING_REVIEW" || attempt.status === "SUBMITTED" ? "secondary" : attempt.passed ? "success" : "default";
  return <Badge variant={variant}>{content}</Badge>;
}

type AssessmentPlayerAttempt = (TrainingQuizAttemptDto & { quiz: TrainingQuizDto }) & {
  recoveredAnswers?: TrainingQuizAttemptRecoveryDto["answers"];
  timeRemainingSeconds?: number | null;
};

type LearnerQuizSummary = {
  id: string;
  title: string;
  description?: string | null;
  passingScore: number;
  maxAttempts?: number | null;
  timeLimitMinutes?: number | null;
  questionsCount: number;
  latestAttempt?: TrainingQuizAttemptDto | null;
};

function mapRecoveredAttempt(recovered: TrainingQuizAttemptRecoveryDto, quiz: LearnerQuizSummary): AssessmentPlayerAttempt {
  return {
    id: recovered.id,
    quizId: quiz.id,
    startedAt: recovered.startedAt,
    submittedAt: recovered.submittedAt,
    expiresAt: recovered.expiresAt,
    status: recovered.status,
    questionIds: recovered.questions.map((question) => question.id),
    timeRemainingSeconds: recovered.timeRemainingSeconds,
    recoveredAnswers: recovered.answers,
    quiz: {
      id: quiz.id,
      courseId: "",
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      timeLimitMinutes: quiz.timeLimitMinutes,
      shuffleQuestions: false,
      shuffleOptions: false,
      requireAllQuestions: true,
      feedbackMode: "AFTER_SUBMISSION",
      questions: recovered.questions.map((question, index) => ({
        ...question,
        requiresManualGrading: question.questionType === "TEXT",
        difficulty: "MEDIUM" as const,
        tags: [],
        sortOrder: index,
      })),
    },
  };
}

function AssessmentPlayer({ attempt, onClose, onSubmitted }: { attempt: AssessmentPlayerAttempt | null; onClose: () => void; onSubmitted?: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(() => getInitialAnswers(attempt));
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const submitLock = useRef(false);
  useEffect(() => {
    if (!attempt) return;
    const update = () => setRemainingSeconds(attempt.expiresAt ? Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000)) : attempt.timeRemainingSeconds ?? null);
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [attempt]);
  const saveAnswer = useMutation({
    mutationFn: ({ questionId, value }: { questionId: string; value: string | string[] }) => {
      if (!attempt) throw new Error("No hay un intento activo.");
      const question = attempt.quiz.questions.find((item) => item.id === questionId);
      if (!question) throw new Error("No se encontró la pregunta.");
      return saveTrainingAssessmentAnswer(attempt.quizId, attempt.id, {
        questionId,
        textAnswer: question.questionType === "TEXT" ? String(value) : undefined,
        selectedOptionIds: Array.isArray(value) ? value : value ? [value] : [],
        optionId: typeof value === "string" && question.questionType !== "TEXT" ? value : undefined,
      });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo guardar tu respuesta.")),
  });
  const updateAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    saveAnswer.mutate({ questionId, value });
  };
  const isAnswered = (questionId: string) => {
    const value = answers[questionId];
    return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
  };
  const submit = useMutation({
    mutationFn: async () => {
      if (!attempt) return;
      for (const question of attempt.quiz.questions) {
        const answer = answers[question.id];
        await saveTrainingAssessmentAnswer(attempt.quizId, attempt.id, {
          questionId: question.id,
          textAnswer: question.questionType === "TEXT" ? String(answer || "") : undefined,
          selectedOptionIds: Array.isArray(answer) ? answer : answer ? [answer] : [],
          optionId: typeof answer === "string" && question.questionType !== "TEXT" ? answer : undefined,
        });
      }
      const idempotencyKey = getTrainingAssessmentSubmitKey(attempt.id) ?? persistTrainingAssessmentSubmitKey(attempt.id);
      return submitTrainingAssessment(attempt.quizId, attempt.id, idempotencyKey ?? undefined);
    },
    onSuccess: (result) => {
      if (attempt) clearTrainingAssessmentSubmitKey(attempt.id);
      submitLock.current = false;
      toast.success(result?.status === "PENDING_REVIEW" ? "Enviada para revisión" : `Resultado: ${result?.score}%`);
      onSubmitted?.();
      onClose();
    },
    onError: (error) => { submitLock.current = false; toast.error(getApiErrorMessage(error, "No se pudo enviar la evaluación")); },
  });
  const handleSubmit = () => {
    if (!acquireTrainingAssessmentSubmit(submitLock, submit.isPending)) return;
    submit.mutate();
  };
  return (
    <Dialog open={Boolean(attempt)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{attempt?.quiz.title}</DialogTitle><DialogDescription>Responde todas las preguntas antes de enviar. El envío es definitivo.</DialogDescription></DialogHeader>
        {remainingSeconds !== null ? <div className={`sticky top-0 z-10 rounded-xl border p-3 text-sm ${remainingSeconds <= 60 ? "border-status-danger/40 bg-status-danger/10 text-status-danger" : "bg-surface-section"}`} role="timer" aria-live="polite"><strong>Tiempo restante:</strong> {formatTrainingRemainingTime(remainingSeconds)}{remainingSeconds === 0 ? " · El intento expiró" : ""}</div> : null}
        <div className="space-y-5">
          {attempt?.quiz.questions.map((question, index) => (
            <fieldset key={question.id} className="rounded-xl border p-4">
              <legend className="px-2 font-semibold">{index + 1}. {question.prompt}</legend>
              <div className="mt-3 space-y-2">
                {question.questionType === "TEXT" ? <Input aria-label={`Respuesta para ${question.prompt}`} value={String(answers[question.id] || "")} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} onBlur={(event) => updateAnswer(question.id, event.target.value)} /> : question.options.map((option) => <label key={option.id} className="flex min-h-11 items-center gap-3 rounded-lg border px-3"><input type={question.questionType === "MULTIPLE_CHOICE" ? "checkbox" : "radio"} name={question.id} checked={Array.isArray(answers[question.id]) ? (answers[question.id] as string[]).includes(option.id) : answers[question.id] === option.id} onChange={() => { const existing = answers[question.id]; if (question.questionType !== "MULTIPLE_CHOICE") return updateAnswer(question.id, option.id); const values = Array.isArray(existing) ? existing : []; updateAnswer(question.id, values.includes(option.id) ? values.filter((id) => id !== option.id) : [...values, option.id]); }} />{option.label}</label>)}
              </div>
            </fieldset>
          ))}
          <Button className="w-full" disabled={submit.isPending || saveAnswer.isPending || remainingSeconds === 0 || attempt?.quiz.questions.some((question) => !isAnswered(question.id))} onClick={handleSubmit}>{submit.isPending ? "Enviando…" : remainingSeconds === 0 ? "Intento expirado" : "Enviar evaluación"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getInitialAnswers(attempt: AssessmentPlayerAttempt | null) {
  return Object.fromEntries(attempt?.recoveredAnswers?.map((answer) => [
    answer.questionId,
    answer.textAnswer ?? (answer.selectedOptionIds.length > 1 ? answer.selectedOptionIds : answer.selectedOptionIds[0] ?? answer.optionId ?? ""),
  ]) ?? []) as Record<string, string | string[]>;
}


export function TrainingResults() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["training-assessment-results", page], queryFn: () => fetchTrainingAssessmentResults(page) });
  const grade = useMutation({
    mutationFn: (attempt: TrainingQuizAttemptDto) => gradeTrainingAssessment(attempt.id, {
      answers: (attempt.answers ?? []).map((answer) => ({ answerId: answer.id, awardedPoints: answer.awardedPoints ?? 0 })),
      feedback: "Revisión completada",
    }),
    onSuccess: () => { toast.success("Calificación publicada"); queryClient.invalidateQueries({ queryKey: ["training-assessment-results"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo publicar la calificación")),
  });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Aprendizaje" title="Resultados" description="Supervisa intentos, calificaciones y revisiones pendientes." />
      {query.isLoading ? <AsyncState state="loading" title="Cargando resultados" /> : null}
      {query.data ? <ResultsSummary items={query.data.items} total={query.data.total} /> : null}
      {query.data?.items.length ? (
        <div className="grid gap-3">
          {query.data.items.map((attempt) => (
            <Card key={attempt.id}>
              <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <strong className="block truncate">{attempt.quiz?.title ?? "Evaluación"}</strong>
                  <p className="text-sm text-muted-foreground">
                    {attempt.user ? `${attempt.user.firstName} ${attempt.user.lastName}` : "Participante"} · {new Date(attempt.startedAt).toLocaleDateString("es")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <ResultStatusBadge attempt={attempt} />
                  {attempt.status === "PENDING_REVIEW" ? <Button onClick={() => grade.mutate(attempt)} disabled={grade.isPending}>Revisar y publicar</Button> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : query.isSuccess ? <EmptyCard title="Aún no hay intentos" /> : null}
      {query.data ? <Pagination page={query.data.page - 1} totalPages={Math.max(1, Math.ceil(query.data.total / query.data.pageSize))} totalItems={query.data.total} pageSize={query.data.pageSize} onPageChange={(nextPage) => setPage(nextPage + 1)} /> : null}
    </div>
  );
}

function ResultsSummary({ items, total }: { items: TrainingQuizAttemptDto[]; total: number }) {
  const pending = items.filter((attempt) => attempt.status === "PENDING_REVIEW").length;
  const graded = items.filter((attempt) => attempt.status === "GRADED").length;
  const passed = items.filter((attempt) => attempt.passed).length;
  return (
    <section aria-labelledby="results-summary-title" className="space-y-3">
      <div>
        <h2 id="results-summary-title" className="text-lg font-semibold">Resumen de resultados</h2>
        <p className="text-sm text-muted-foreground">{total} intentos en total · estados calculados para esta página.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ResultMetric label="Intentos totales" value={total} />
        <ResultMetric label="Revisión pendiente" value={pending} tone="warning" />
        <ResultMetric label="Calificados" value={graded} />
        <ResultMetric label="Aprobados" value={passed} tone="success" />
      </div>
    </section>
  );
}

function ResultMetric({ label, value, tone = "normal" }: { label: string; value: number; tone?: "normal" | "warning" | "success" }) {
  return <Card level={2}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-semibold ${tone === "warning" ? "text-status-warning" : tone === "success" ? "text-status-success" : "text-foreground"}`}>{value}</p></CardContent></Card>;
}

function ResultStatusBadge({ attempt }: { attempt: TrainingQuizAttemptDto }) {
  if (attempt.status === "PENDING_REVIEW") return <Badge variant="secondary">Revisión pendiente</Badge>;
  if (attempt.status === "GRADED") return <Badge variant={attempt.passed ? "success" : "destructive"}>{attempt.passed ? "Aprobado" : "No aprobado"} · {attempt.score ?? 0}%</Badge>;
  if (attempt.status === "SUBMITTED") return <Badge variant="secondary">Enviado</Badge>;
  return <Badge>En curso</Badge>;
}

export function TrainingCertificates() {
  const { can } = useAppStore();
  const admin = can("certificates.issue");
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["training-certificates", admin], queryFn: admin ? fetchTrainingAdminCertificates : fetchMyTrainingCertificates });
  const revoke = useMutation({
    mutationFn: (certificate: TrainingCertificateDto) => revokeTrainingCertificate(certificate.id, "Revocado por administración"),
    onSuccess: () => { toast.success("Certificado revocado"); queryClient.invalidateQueries({ queryKey: ["training-certificates"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo revocar el certificado")),
  });
  const renew = useMutation({
    mutationFn: (certificate: TrainingCertificateDto) => renewTrainingCertificate(certificate.id, "Renovación administrativa"),
    onSuccess: () => { toast.success("Certificado renovado"); queryClient.invalidateQueries({ queryKey: ["training-certificates"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo renovar el certificado")),
  });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Aprendizaje" title="Certificados" description="Consulta credenciales verificables, evidencia, vigencia y cadena de renovación." />
      {query.isLoading ? <AsyncState state="loading" title="Cargando certificados" /> : null}
      {query.data ? <CertificateSummary certificates={query.data.items} admin={admin} /> : null}
      {query.data?.items.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {query.data.items.map((certificate) => {
            const status = certificate.status ?? (certificate.revokedAt ? "REVOKED" : "VALID");
            const statusLabel = status === "VALID" ? "Vigente" : status === "EXPIRED" ? "Vencido" : status === "RENEWED" ? "Renovado" : "Revocado";
            return (
              <Card key={certificate.id}>
                <CardHeader>
                  <div className="flex justify-between gap-3">
                    <Award className="size-8 text-brand" />
                    <Badge variant={status === "VALID" ? "success" : status === "RENEWED" ? "secondary" : "destructive"}>{statusLabel}</Badge>
                  </div>
                  <CardTitle>{certificate.course?.title ?? certificate.curriculum?.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{certificate.user ? `${certificate.user.firstName} ${certificate.user.lastName}` : `Emitido ${new Date(certificate.issuedAt).toLocaleDateString("es")}`}</p>
                  <div className="grid gap-2 rounded-xl bg-surface-section p-3 text-sm">
                    <span><strong>Número:</strong> {certificate.certificateNumber}</span>
                    <span><strong>Emisión:</strong> {new Date(certificate.issuedAt).toLocaleDateString("es")}</span>
                    <span><strong>Vigencia:</strong> {certificate.expiresAt ? new Date(certificate.expiresAt).toLocaleDateString("es") : "Sin vencimiento"}</span>
                    {certificate.renewedFrom ? <span><strong>Renueva:</strong> {certificate.renewedFrom.certificateNumber}</span> : null}
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-3 font-mono text-sm"><ShieldCheck className="size-4" />{certificate.verificationCode}</div>
                  {admin && certificate.renewalEligible ? <Button className="w-full" onClick={() => renew.mutate(certificate)} disabled={renew.isPending}><Award />Renovar certificado</Button> : null}
                  <Button asChild variant="secondary" className="w-full"><Link href={`/certificates/verify/${encodeURIComponent(certificate.verificationCode)}`}><CheckCircle2 />Verificar credencial</Link></Button>
                  {admin && status === "VALID" ? <Button variant="destructive" className="w-full" onClick={() => revoke.mutate(certificate)}>Revocar certificado</Button> : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : query.isSuccess ? <EmptyCard title="Aún no hay certificados" /> : null}
    </div>
  );
}

function CertificateSummary({ certificates, admin }: { certificates: TrainingCertificateDto[]; admin: boolean }) {
  const valid = certificates.filter((certificate) => (certificate.status ?? (certificate.revokedAt ? "REVOKED" : "VALID")) === "VALID").length;
  const expired = certificates.filter((certificate) => certificate.status === "EXPIRED").length;
  const revoked = certificates.filter((certificate) => certificate.status === "REVOKED" || certificate.revokedAt).length;
  const renewable = certificates.filter((certificate) => certificate.renewalEligible).length;
  return (
    <section aria-labelledby="certificate-summary-title" className="space-y-3">
      <div>
        <h2 id="certificate-summary-title" className="text-lg font-semibold">Estado de credenciales</h2>
        <p className="text-sm text-muted-foreground">{admin ? "Prioriza las credenciales que requieren gestión administrativa." : "Consulta rápidamente qué credenciales siguen vigentes."}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CertificateMetric label="Vigentes" value={valid} tone="success" />
        <CertificateMetric label="Vencidos" value={expired} tone={expired ? "warning" : "normal"} />
        <CertificateMetric label="Revocados" value={revoked} tone={revoked ? "danger" : "normal"} />
        <CertificateMetric label={admin ? "Renovables" : "Para renovar"} value={renewable} />
      </div>
    </section>
  );
}

function CertificateMetric({ label, value, tone = "normal" }: { label: string; value: number; tone?: "normal" | "success" | "warning" | "danger" }) {
  return <Card level={2}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-semibold ${tone === "success" ? "text-status-success" : tone === "warning" ? "text-status-warning" : tone === "danger" ? "text-status-danger" : "text-foreground"}`}>{value}</p></CardContent></Card>;
}

function EmptyCard({ title, description }: { title: string; description?: string }) {
  return <Card className="border-dashed"><CardContent className="py-12 text-center"><h2 className="text-lg font-semibold">{title}</h2>{description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}</CardContent></Card>;
}
