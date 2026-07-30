"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, CheckCircle2, ClipboardCheck, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
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
  deleteTrainingAssessment,
  fetchLearnerTrainingCourse,
  fetchMyTrainingAssignments,
  fetchMyTrainingCertificates,
  fetchTrainingAdminCertificates,
  fetchTrainingAssessmentResults,
  fetchTrainingAssessments,
  fetchTrainingCourses,
  getApiErrorMessage,
  gradeTrainingAssessment,
  revokeTrainingCertificate,
  saveTrainingAssessmentAnswer,
  startTrainingAssessment,
  submitTrainingAssessment,
} from "@/lib/backend";
import type {
  TrainingCertificateDto,
  TrainingQuestionType,
  TrainingQuizAttemptDto,
  TrainingQuizDto,
} from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";

export function TrainingEvaluations() {
  const { can } = useAppStore();
  return can("assessments.manage") ? <AssessmentBuilder /> : <LearnerAssessments />;
}

function AssessmentBuilder() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [questionQuiz, setQuestionQuiz] = useState<TrainingQuizDto | null>(null);
  const query = useQuery({ queryKey: ["training-assessments"], queryFn: fetchTrainingAssessments });
  const remove = useMutation({
    mutationFn: deleteTrainingAssessment,
    onSuccess: () => {
      toast.success("Evaluación eliminada");
      queryClient.invalidateQueries({ queryKey: ["training-assessments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar la evaluación")),
  });

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
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setQuestionQuiz(quiz)}>
                    <Plus />Agregar pregunta
                  </Button>
                  <Button variant="destructive" size="icon" aria-label={`Eliminar ${quiz.title}`} onClick={() => remove.mutate(quiz.id)}>
                    <Trash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : query.isSuccess ? <EmptyCard title="Aún no hay evaluaciones" description="Crea la primera evaluación y vincúlala con un curso." /> : null}
      <CreateAssessmentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CreateQuestionDialog quiz={questionQuiz} onClose={() => setQuestionQuiz(null)} />
    </div>
  );
}

function CreateAssessmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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
      },
    });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nueva evaluación</DialogTitle><DialogDescription>Define las reglas generales. Después podrás agregar preguntas.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div><Label>Curso</Label><Select name="courseId" required><SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger><SelectContent>{courses.data?.items.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="assessment-title">Título</Label><Input id="assessment-title" name="title" required /></div>
          <div><Label htmlFor="assessment-description">Descripción</Label><Input id="assessment-description" name="description" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label htmlFor="passingScore">Aprobación %</Label><Input id="passingScore" name="passingScore" type="number" min="1" max="100" defaultValue="80" required /></div>
            <div><Label htmlFor="maxAttempts">Intentos</Label><Input id="maxAttempts" name="maxAttempts" type="number" min="1" defaultValue="3" /></div>
            <div><Label htmlFor="timeLimitMinutes">Minutos</Label><Input id="timeLimitMinutes" name="timeLimitMinutes" type="number" min="1" /></div>
          </div>
          <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="shuffleQuestions" /> Mezclar preguntas</label>
          <Button className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Creando…" : "Crear evaluación"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateQuestionDialog({ quiz, onClose }: { quiz: TrainingQuizDto | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<TrainingQuestionType>("SINGLE_CHOICE");
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof createTrainingAssessmentQuestion>[1]) => createTrainingAssessmentQuestion(quiz!.id, input),
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
    const labels = [String(data.get("option1") || ""), String(data.get("option2") || ""), String(data.get("option3") || ""), String(data.get("option4") || "")].filter(Boolean);
    const correct = Number(data.get("correct") || 0);
    mutation.mutate({
      prompt: String(data.get("prompt")),
      questionType: type,
      explanation: String(data.get("explanation") || ""),
      points: Number(data.get("points") || 1),
      requiresManualGrading: type === "TEXT",
      options: type === "TEXT" ? [] : labels.map((label, index) => ({ label, isCorrect: index === correct })),
    });
  }
  return (
    <Dialog open={Boolean(quiz)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Agregar pregunta</DialogTitle><DialogDescription>{quiz?.title}</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div><Label htmlFor="question-prompt">Enunciado</Label><Input id="question-prompt" name="prompt" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label><Select value={type} onValueChange={(value) => setType(value as TrainingQuestionType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SINGLE_CHOICE">Selección única</SelectItem><SelectItem value="MULTIPLE_CHOICE">Selección múltiple</SelectItem><SelectItem value="TRUE_FALSE">Verdadero/Falso</SelectItem><SelectItem value="TEXT">Respuesta corta</SelectItem></SelectContent></Select></div>
            <div><Label htmlFor="question-points">Puntos</Label><Input id="question-points" name="points" type="number" min="1" defaultValue="1" required /></div>
          </div>
          {type !== "TEXT" ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((index) => <Input key={index} name={`option${index + 1}`} placeholder={`Opción ${index + 1}${index < 2 ? " (obligatoria)" : ""}`} required={index < 2} />)}
              <div><Label>Opción correcta</Label><Select name="correct" defaultValue="0"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[0, 1, 2, 3].map((index) => <SelectItem key={index} value={String(index)}>Opción {index + 1}</SelectItem>)}</SelectContent></Select></div>
            </div>
          ) : null}
          <div><Label htmlFor="question-explanation">Explicación posterior</Label><Input id="question-explanation" name="explanation" /></div>
          <Button className="w-full" disabled={mutation.isPending}>Guardar pregunta</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LearnerAssessments() {
  const [attempt, setAttempt] = useState<(TrainingQuizAttemptDto & { quiz: TrainingQuizDto }) | null>(null);
  const query = useQuery({
    queryKey: ["learner-assessments"],
    queryFn: async () => {
      const assignments = await fetchMyTrainingAssignments({ pageSize: 100 });
      const courses = await Promise.all(assignments.items.filter((item) => item.courseId).map((item) => fetchLearnerTrainingCourse(item.courseId!)));
      return courses.flatMap((course) => course.quizSummary ?? []);
    },
  });
  const start = useMutation({
    mutationFn: startTrainingAssessment,
    onSuccess: (data) => setAttempt(data),
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo iniciar la evaluación")),
  });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Aprendizaje" title="Mis evaluaciones" description="Completa tus evaluaciones pendientes y consulta claramente el resultado de cada intento." />
      {query.isLoading ? <AsyncState state="loading" title="Cargando evaluaciones" /> : null}
      {query.data?.length ? <div className="grid gap-4 md:grid-cols-2">{query.data.map((quiz) => <Card key={quiz.id}><CardHeader><CardTitle>{quiz.title}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex gap-2"><Badge>{quiz.passingScore}% para aprobar</Badge><Badge variant="secondary">{quiz.questionsCount} preguntas</Badge></div><Button className="w-full" onClick={() => start.mutate(quiz.id)}><ClipboardCheck />Comenzar evaluación</Button></CardContent></Card>)}</div> : query.isSuccess ? <EmptyCard title="No tienes evaluaciones pendientes" /> : null}
      <AssessmentPlayer attempt={attempt} onClose={() => setAttempt(null)} />
    </div>
  );
}

function AssessmentPlayer({ attempt, onClose }: { attempt: (TrainingQuizAttemptDto & { quiz: TrainingQuizDto }) | null; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
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
      return submitTrainingAssessment(attempt.quizId, attempt.id);
    },
    onSuccess: (result) => {
      toast.success(result?.status === "PENDING_REVIEW" ? "Enviada para revisión" : `Resultado: ${result?.score}%`);
      onClose();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo enviar la evaluación")),
  });
  return (
    <Dialog open={Boolean(attempt)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{attempt?.quiz.title}</DialogTitle><DialogDescription>Responde todas las preguntas antes de enviar. El envío es definitivo.</DialogDescription></DialogHeader>
        <div className="space-y-5">
          {attempt?.quiz.questions.map((question, index) => (
            <fieldset key={question.id} className="rounded-xl border p-4">
              <legend className="px-2 font-semibold">{index + 1}. {question.prompt}</legend>
              <div className="mt-3 space-y-2">
                {question.questionType === "TEXT" ? <Input value={String(answers[question.id] || "")} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} /> : question.options.map((option) => <label key={option.id} className="flex min-h-11 items-center gap-3 rounded-lg border px-3"><input type={question.questionType === "MULTIPLE_CHOICE" ? "checkbox" : "radio"} name={question.id} checked={Array.isArray(answers[question.id]) ? (answers[question.id] as string[]).includes(option.id) : answers[question.id] === option.id} onChange={() => setAnswers((current) => { const existing = current[question.id]; if (question.questionType !== "MULTIPLE_CHOICE") return { ...current, [question.id]: option.id }; const values = Array.isArray(existing) ? existing : []; return { ...current, [question.id]: values.includes(option.id) ? values.filter((id) => id !== option.id) : [...values, option.id] }; })} />{option.label}</label>)}
              </div>
            </fieldset>
          ))}
          <Button className="w-full" disabled={submit.isPending || attempt?.quiz.questions.some((question) => !answers[question.id])} onClick={() => submit.mutate()}>{submit.isPending ? "Enviando…" : "Enviar evaluación"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TrainingResults() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["training-assessment-results"], queryFn: () => fetchTrainingAssessmentResults() });
  const grade = useMutation({
    mutationFn: (attempt: TrainingQuizAttemptDto) => gradeTrainingAssessment(attempt.id, {
      answers: (attempt.answers ?? []).map((answer) => ({ answerId: answer.id, awardedPoints: answer.awardedPoints ?? 0 })),
      feedback: "Revisión completada",
    }),
    onSuccess: () => { toast.success("Calificación publicada"); queryClient.invalidateQueries({ queryKey: ["training-assessment-results"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo publicar la calificación")),
  });
  return <div className="space-y-6"><PageHeader eyebrow="Aprendizaje" title="Resultados" description="Supervisa intentos, calificaciones y revisiones pendientes." />{query.isLoading ? <AsyncState state="loading" title="Cargando resultados" /> : null}{query.data?.items.length ? <div className="grid gap-3">{query.data.items.map((attempt) => <Card key={attempt.id}><CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between"><div><strong>{attempt.quiz?.title}</strong><p className="text-sm text-muted-foreground">{attempt.user ? `${attempt.user.firstName} ${attempt.user.lastName}` : "Participante"} · {new Date(attempt.startedAt).toLocaleDateString("es")}</p></div><div className="flex items-center gap-3"><Badge variant={attempt.passed ? "success" : attempt.status === "PENDING_REVIEW" ? "secondary" : "destructive"}>{attempt.status === "PENDING_REVIEW" ? "Revisión pendiente" : `${attempt.score ?? 0}%`}</Badge>{attempt.status === "PENDING_REVIEW" ? <Button onClick={() => grade.mutate(attempt)}>Revisar y publicar</Button> : null}</div></CardContent></Card>)}</div> : query.isSuccess ? <EmptyCard title="Aún no hay intentos" /> : null}</div>;
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
  return <div className="space-y-6"><PageHeader eyebrow="Aprendizaje" title="Certificados" description="Consulta credenciales verificables, su vigencia y su trazabilidad." />{query.isLoading ? <AsyncState state="loading" title="Cargando certificados" /> : null}{query.data?.items.length ? <div className="grid gap-4 md:grid-cols-2">{query.data.items.map((certificate) => { const status = certificate.status ?? (certificate.revokedAt ? "REVOKED" : "VALID"); return <Card key={certificate.id}><CardHeader><div className="flex justify-between gap-3"><Award className="size-8 text-primary" /><Badge variant={status === "VALID" ? "success" : "destructive"}>{status === "VALID" ? "Vigente" : status === "EXPIRED" ? "Vencido" : "Revocado"}</Badge></div><CardTitle>{certificate.course?.title ?? certificate.curriculum?.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{certificate.user ? `${certificate.user.firstName} ${certificate.user.lastName}` : `Emitido ${new Date(certificate.issuedAt).toLocaleDateString("es")}`}</p><div className="flex items-center gap-2 rounded-lg bg-muted p-3 font-mono text-sm"><ShieldCheck className="size-4" />{certificate.verificationCode}</div>{admin && status === "VALID" ? <Button variant="destructive" className="w-full" onClick={() => revoke.mutate(certificate)}>Revocar certificado</Button> : <Button variant="secondary" className="w-full"><CheckCircle2 />Verificar credencial</Button>}</CardContent></Card>; })}</div> : query.isSuccess ? <EmptyCard title="Aún no hay certificados" /> : null}</div>;
}

function EmptyCard({ title, description }: { title: string; description?: string }) {
  return <Card className="border-dashed"><CardContent className="py-12 text-center"><h2 className="text-lg font-semibold">{title}</h2>{description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}</CardContent></Card>;
}
