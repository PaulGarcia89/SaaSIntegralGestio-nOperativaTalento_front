"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  CircleDot,
  ClipboardCheck,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Play,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineNote, StatusBadge } from "@/components/system";
import { LocalVideoLesson, VideoLesson, type VideoProgressEvent } from "@/components/training-learning-hub";
import { getApiErrorMessage, resolveTrainingAssetUrl, updateTrainingLessonProgress } from "@/lib/backend";
import type { LearnerTrainingCourseDto, LearnerTrainingLessonDto } from "@/lib/contracts";
import { blockHtml } from "@/lib/training-rich-text";
import { formatMinutes } from "@/lib/training-labels";

/* ==========================================================================
   REPRODUCTOR GUIADO DE UN CURSO
   ==========================================================================
   Antes `/training/learn/[id]` pintaba TODOS los módulos con TODAS sus
   lecciones desplegadas, cada una con su video y sus bloques: una pared que
   había que recorrer entera para saber por dónde iba uno, y sin forma de dar
   por terminada una lección de lectura.

   Ahora hay UNA lección en pantalla, la que toca, y un índice al lado:

     · Índice (izquierda en escritorio, plegado arriba en móvil): módulos y
       lecciones con su estado —hecha, actual, pendiente—, minutos, y al final
       la evaluación y el certificado como pasos del mismo camino.
     · Lección: título, contenido (video o texto), y una sola decisión:
       «Marcar como completada» (lecturas, archivos, tareas) o el avance
       automático del video; después «Siguiente lección».
     · Barra de avance segmentada: un segmento por lección, se ve cuántas
       faltan sin leer un porcentaje.

   Las reglas no cambian: una lección de video se completa viéndola (el
   servidor lo comprueba), las demás con el botón (`PATCH
   /training/progress/lessons/:id`), y la evaluación sigue en su pantalla.
   ========================================================================== */

type Lesson = LearnerTrainingLessonDto;
type Step = { kind: "lesson"; lesson: Lesson; moduleTitle: string; index: number } | { kind: "quiz" } | { kind: "done" };

export function CoursePlayerView({
  course,
  onVideoProgress,
}: {
  course: LearnerTrainingCourseDto;
  onVideoProgress: (event: VideoProgressEvent) => Promise<unknown> | void;
}) {
  const queryClient = useQueryClient();
  const lessons = useMemo(
    () => course.modules.flatMap((module) => module.lessons.map((lesson) => ({ lesson, moduleTitle: module.title }))),
    [course.modules],
  );
  const total = lessons.length;
  const done = lessons.filter(({ lesson }) => lesson.completed).length;
  const currentIndex = lessons.findIndex(({ lesson }) => lesson.isRequired && !lesson.completed);
  const pendingQuiz = course.quizSummary?.find((quiz) => !quiz.latestAttempt?.passed) ?? null;
  const allLessonsDone = currentIndex === -1;
  const courseCompleted = course.progress?.status === "COMPLETED";

  const [selected, setSelected] = useState<string>(() =>
    currentIndex >= 0 ? lessons[currentIndex].lesson.id : pendingQuiz ? "quiz" : "done",
  );

  // Si la lección seleccionada dejó de existir (el curso cambió), se cae a la
  // que toca. Se resuelve al derivar, no en un efecto: no hay estado que
  // corregir después de pintar.
  const fallback = currentIndex >= 0 ? lessons[currentIndex].lesson.id : pendingQuiz ? "quiz" : "done";
  const resolved = selected === "quiz" || selected === "done" || lessons.some(({ lesson }) => lesson.id === selected) ? selected : fallback;

  const step: Step =
    resolved === "quiz"
      ? { kind: "quiz" }
      : resolved === "done"
        ? { kind: "done" }
        : (() => {
            const index = lessons.findIndex(({ lesson }) => lesson.id === resolved);
            const entry = lessons[index] ?? lessons[0];
            return { kind: "lesson", lesson: entry.lesson, moduleTitle: entry.moduleTitle, index: index < 0 ? 0 : index };
          })();

  const complete = useMutation({
    mutationFn: (lessonId: string) => updateTrainingLessonProgress(lessonId, true),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["learner-course", course.id] });
      await queryClient.invalidateQueries({ queryKey: ["my-training-assignments"] });
    },
  });

  const goNext = () => {
    if (step.kind !== "lesson") return;
    const next = lessons[step.index + 1];
    setSelected(next ? next.lesson.id : pendingQuiz ? "quiz" : "done");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goPrev = () => {
    if (step.kind === "lesson" && step.index > 0) setSelected(lessons[step.index - 1].lesson.id);
    else if (step.kind !== "lesson" && lessons.length) setSelected(lessons[lessons.length - 1].lesson.id);
  };

  const assignmentStatus = course.assignment?.effectiveStatus ?? course.assignment?.status ?? course.progress?.status;
  const dueAt = course.assignment?.dueAt;

  const outline = (
            <nav aria-label="Lecciones del curso" className="border-t border-line p-2">
              {course.modules.map((module) => (
                <div key={module.id} className="py-1">
                  <p className="px-2 pb-1 pt-2 text-2xs font-semibold uppercase tracking-[0.12em] text-ink-3">{module.title}</p>
                  <ol className="space-y-0.5">
                    {module.lessons.map((lesson) => {
                      const index = lessons.findIndex((entry) => entry.lesson.id === lesson.id);
                      const isCurrent = step.kind === "lesson" && step.lesson.id === lesson.id;
                      const isNext = index === currentIndex;
                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(lesson.id)}
                            aria-current={isCurrent ? "step" : undefined}
                            className={cn(
                              "flex w-full min-h-[var(--control-h-base)] items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                              isCurrent ? "bg-accent-fill/10 text-ink-1" : "text-ink-2 hover:bg-surface-2 hover:text-ink-1",
                            )}
                          >
                            <LessonMark completed={lesson.completed} current={isCurrent || isNext} />
                            <span className="min-w-0 flex-1">
                              <span className={cn("block truncate", isCurrent && "font-semibold")}>{lesson.title}</span>
                              <span className="block text-2xs text-ink-3">
                                {lessonKindLabel(lesson)}
                                {lesson.estimatedMinutes ? ` · ${lesson.estimatedMinutes} min` : ""}
                                {lesson.isRequired ? "" : " · opcional"}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
              {course.quizSummary?.length ? (
                <div className="border-t border-line py-1">
                  <p className="px-2 pb-1 pt-2 text-2xs font-semibold uppercase tracking-[0.12em] text-ink-3">Para terminar</p>
                  <button
                    type="button"
                    onClick={() => setSelected("quiz")}
                    aria-current={step.kind === "quiz" ? "step" : undefined}
                    className={cn(
                      "flex w-full min-h-[var(--control-h-base)] items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      step.kind === "quiz" ? "bg-accent-fill/10 text-ink-1" : "text-ink-2 hover:bg-surface-2 hover:text-ink-1",
                    )}
                  >
                    <LessonMark completed={!pendingQuiz} current={step.kind === "quiz" || (allLessonsDone && Boolean(pendingQuiz))} />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate", step.kind === "quiz" && "font-semibold")}>Evaluación</span>
                      <span className="block text-2xs text-ink-3">{pendingQuiz ? `${pendingQuiz.questionsCount} preguntas` : "Aprobada"}</span>
                    </span>
                  </button>
                </div>
              ) : null}
            </nav>
  );

  return (
    <div className="space-y-6">
      {/* ---- Cabecera: qué curso, cuánto falta ------------------------- */}
      <section aria-labelledby="course-title" className="rounded-lg border border-line bg-surface-1 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            {course.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveTrainingAssetUrl(course.coverImageUrl) ?? course.coverImageUrl} alt="" className="size-16 shrink-0 rounded-md object-cover" />
            ) : (
              <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-md bg-accent-fill/15 text-accent-ink">
                <BookOpen className="size-7" strokeWidth={1.5} />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-3">{course.category?.name ?? "Capacitación"}</p>
              <h1 id="course-title" className="mt-1 text-2xl font-semibold leading-tight text-ink-1 sm:text-3xl">{course.title}</h1>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-4 text-ink-3" aria-hidden="true" />
                  {formatMinutes(course.estimatedMinutes)}
                </span>
                {dueAt ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-ink-3" aria-hidden="true" />
                    Vence el {formatDate(dueAt)}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <div className="shrink-0 self-start">
            {courseCompleted ? (
              <StatusBadge tone="success" label="Completado" />
            ) : assignmentStatus === "OVERDUE" ? (
              <StatusBadge tone="danger" label="Vencido" />
            ) : done > 0 ? (
              <StatusBadge tone="progress" label="En progreso" />
            ) : (
              <StatusBadge tone="neutral" label="Sin empezar" />
            )}
          </div>
        </div>

        {/* Barra segmentada: un tramo por lección. */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <p className="font-medium text-ink-1">
              {courseCompleted ? "Curso completado" : `${done} de ${total} lecciones completadas`}
            </p>
            <p className="font-mono text-ink-2 tabular-figures">{course.progress?.progressPercent ?? 0} %</p>
          </div>
          <ol
            className="mt-2 flex gap-1"
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuetext={`${done} de ${total} lecciones completadas`}
          >
            {lessons.map(({ lesson }) => (
              <li
                key={lesson.id}
                className={cn(
                  "h-2 flex-1 rounded-full",
                  lesson.completed ? "bg-status-success" : step.kind === "lesson" && step.lesson.id === lesson.id ? "bg-accent-fill" : "bg-surface-3",
                )}
              />
            ))}
          </ol>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        {/* ---- Índice -------------------------------------------------
            En escritorio siempre visible; en móvil plegado bajo «Contenido
            del curso», para que la lección ocupe la pantalla. */}
        <aside className="hidden rounded-lg border border-line bg-surface-1 lg:block">
          <p className="flex items-center justify-between gap-3 px-4 py-3 text-base font-semibold text-ink-1">
            Contenido del curso
            <span className="font-mono text-sm font-normal text-ink-2 tabular-figures">
              {done}/{total}
            </span>
          </p>
          {outline}
        </aside>
        <details className="group rounded-lg border border-line bg-surface-1 lg:hidden">
          <summary className="flex min-h-[var(--control-h-touch)] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-semibold text-ink-1 [&::-webkit-details-marker]:hidden">
            Contenido del curso
            <span className="font-mono text-sm font-normal text-ink-2 tabular-figures">
              {done}/{total}
            </span>
          </summary>
          {outline}
        </details>

        {/* ---- Paso actual ------------------------------------------- */}
        <section aria-live="polite" className="min-w-0 rounded-lg border border-line bg-surface-1 p-5 sm:p-6">
          {step.kind === "lesson" ? (
            <LessonView
              course={course}
              lesson={step.lesson}
              moduleTitle={step.moduleTitle}
              index={step.index}
              total={total}
              onVideoProgress={onVideoProgress}
              completing={complete.isPending}
              completeError={complete.error}
              onComplete={() => complete.mutate(step.lesson.id)}
              onPrev={step.index > 0 ? goPrev : undefined}
              onNext={goNext}
              nextLabel={lessons[step.index + 1] ? `Siguiente: ${lessons[step.index + 1].lesson.title}` : pendingQuiz ? "Ir a la evaluación" : "Terminar"}
            />
          ) : step.kind === "quiz" && pendingQuiz ? (
            <div className="space-y-5">
              <StepEyebrow>Para terminar</StepEyebrow>
              <h2 className="text-xl font-semibold text-ink-1">{pendingQuiz.title}</h2>
              {pendingQuiz.description ? <p className="text-base text-ink-2">{pendingQuiz.description}</p> : null}
              <dl className="grid gap-3 sm:grid-cols-3">
                <Fact label="Preguntas" value={String(pendingQuiz.questionsCount)} />
                <Fact label="Para aprobar" value={`${pendingQuiz.passingScore} %`} />
                <Fact label="Tiempo" value={pendingQuiz.timeLimitMinutes ? `${pendingQuiz.timeLimitMinutes} min` : "Sin límite"} />
              </dl>
              {!allLessonsDone ? (
                <InlineNote tone="warning" title="Antes, termina las lecciones">
                  Te faltan {total - done} {total - done === 1 ? "lección" : "lecciones"}. La evaluación se abre cuando el contenido esté completo.
                </InlineNote>
              ) : null}
              {pendingQuiz.latestAttempt && pendingQuiz.latestAttempt.passed === false ? (
                <InlineNote tone="info" title="Ya lo intentaste">
                  Último resultado: {pendingQuiz.latestAttempt.score ?? 0} %. Puedes volver a intentarlo
                  {pendingQuiz.maxAttempts ? ` (máximo ${pendingQuiz.maxAttempts} intentos)` : ""}.
                </InlineNote>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {allLessonsDone ? (
                  <Button asChild size="lg">
                    <Link href={`/training/evaluations?courseId=${encodeURIComponent(course.id)}`}>
                      <ClipboardCheck className="size-5" aria-hidden="true" />
                      Comenzar evaluación
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" disabled>
                    <ClipboardCheck className="size-5" aria-hidden="true" />
                    Comenzar evaluación
                  </Button>
                )}
                <Button variant="ghost" onClick={goPrev}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Volver a las lecciones
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-status-success text-white">
                  <Check className="size-6" strokeWidth={2.5} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink-1">{courseCompleted ? "Curso completado" : "Contenido completado"}</h2>
                  <p className="text-base text-ink-2">
                    {courseCompleted ? "Ya no queda nada pendiente en esta capacitación." : "El servidor está cerrando el curso; en unos segundos aparecerá como completado."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant={courseCompleted ? "default" : "secondary"}>
                  <Link href="/training/certificates">
                    <Award className="size-5" aria-hidden="true" />
                    Ver mi certificado
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/training">Volver a mis cursos</Link>
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function LessonView({
  course,
  lesson,
  moduleTitle,
  index,
  total,
  onVideoProgress,
  completing,
  completeError,
  onComplete,
  onPrev,
  onNext,
  nextLabel,
}: {
  course: LearnerTrainingCourseDto;
  lesson: Lesson;
  moduleTitle: string;
  index: number;
  total: number;
  onVideoProgress: (event: VideoProgressEvent) => Promise<unknown> | void;
  completing: boolean;
  completeError: unknown;
  onComplete: () => void;
  onPrev?: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  const isVideo = lesson.type === "VIDEO" || Boolean(lesson.videoUrl);
  const assignmentId = course.assignment?.id ?? "";
  const videoBlocks = lesson.blocks.filter((block) => block.type === "VIDEO" && block.resourceUrl);
  const otherBlocks = lesson.blocks.filter((block) => !(block.type === "VIDEO" && (block.resourceUrl || lesson.type === "VIDEO")));

  return (
    <div className="space-y-5">
      <div>
        <StepEyebrow>
          Lección {index + 1} de {total} · {moduleTitle}
        </StepEyebrow>
        <h2 className="mt-1 text-xl font-semibold text-ink-1 sm:text-2xl">{lesson.title}</h2>
        {lesson.description ? <p className="mt-1 text-base text-ink-2">{lesson.description}</p> : null}
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            {isVideo ? <Video className="size-4 text-ink-3" aria-hidden="true" /> : <FileText className="size-4 text-ink-3" aria-hidden="true" />}
            {lessonKindLabel(lesson)}
          </span>
          {lesson.estimatedMinutes ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-4 text-ink-3" aria-hidden="true" />
              {lesson.estimatedMinutes} min
            </span>
          ) : null}
          {lesson.completed ? (
            <span className="inline-flex items-center gap-1.5 text-status-success">
              <Check className="size-4" aria-hidden="true" />
              Completada
            </span>
          ) : null}
        </p>
      </div>

      {/* Contenido */}
      <div className="space-y-4">
        {isVideo ? (
          lesson.videoUrl ? (
            <VideoLesson lesson={lesson} assignmentId={assignmentId} url={resolveTrainingAssetUrl(lesson.videoUrl) ?? lesson.videoUrl} onProgress={onVideoProgress} />
          ) : videoBlocks.length === 0 ? (
            <LocalVideoLesson courseId={course.id} lesson={lesson} assignmentId={assignmentId} onProgress={onVideoProgress} />
          ) : null
        ) : null}
        {videoBlocks.map((block) => (
          <VideoLesson key={block.id} lesson={lesson} assignmentId={assignmentId} url={resolveTrainingAssetUrl(block.resourceUrl) ?? block.resourceUrl!} onProgress={onVideoProgress} />
        ))}
        {otherBlocks.map((block) => (
          <ContentBlock key={block.id} block={block} />
        ))}
        {!isVideo && lesson.blocks.length === 0 ? (
          <EmptyState reason="no-records" title="Esta lección no tiene contenido todavía" description="Quien administra el curso puede añadirlo desde «Gestionar cursos»." />
        ) : null}
      </div>

      {completeError ? (
        <InlineNote tone="danger" title="No se pudo guardar el avance">
          {getApiErrorMessage(completeError, "Reintenta en unos segundos.")}
        </InlineNote>
      ) : null}

      {/* Una decisión: completar (si no es video) y seguir */}
      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {!lesson.completed && !isVideo ? (
            <Button size="lg" onClick={onComplete} loading={completing} loadingLabel="Guardando…">
              <Check className="size-5" aria-hidden="true" />
              Marcar como completada
            </Button>
          ) : null}
          {!lesson.completed && isVideo ? (
            <p className="text-sm text-ink-2">Se marca como completada al terminar de ver el video.</p>
          ) : null}
          <Button size="lg" variant={lesson.completed ? "default" : "secondary"} onClick={onNext}>
            {nextLabel}
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        </div>
        {onPrev ? (
          <Button variant="ghost" onClick={onPrev}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Anterior
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ContentBlock({ block }: { block: Lesson["blocks"][number] }) {
  const html = blockHtml(block.content);
  if (block.type === "RICH_TEXT" && html) {
    return (
      <div className="space-y-2">
        {block.title ? <h3 className="text-base font-semibold text-ink-1">{block.title}</h3> : null}
        {/* Saneado en `blockHtml`: solo etiquetas de texto y enlaces http(s). */}
        <div className="text-base leading-7 text-ink-1 [&_a]:underline [&_a]:underline-offset-4 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-3 [&_blockquote]:text-ink-2" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }
  if (block.type === "FILE" || block.type === "LINK") {
    const href = block.resourceUrl ? (resolveTrainingAssetUrl(block.resourceUrl) ?? block.resourceUrl) : null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-4">
        <span className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-1 text-ink-2">
            {block.type === "FILE" ? <Download className="size-5" /> : <ExternalLink className="size-5" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink-1">{block.title ?? (block.type === "FILE" ? "Archivo" : "Enlace")}</span>
            {html ? <span className="block truncate text-sm text-ink-2" dangerouslySetInnerHTML={{ __html: html }} /> : null}
          </span>
        </span>
        {href ? (
          <Button asChild variant="secondary">
            <a href={href} target="_blank" rel="noreferrer noopener">
              {block.type === "FILE" ? "Descargar" : "Abrir"}
            </a>
          </Button>
        ) : null}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4">
      <p className="font-medium text-ink-1">{block.title ?? blockTypeLabel(block.type)}</p>
      {html ? <div className="mt-2 text-base leading-7 text-ink-2" dangerouslySetInnerHTML={{ __html: html }} /> : null}
      {block.resourceUrl ? (
        <a className="mt-2 inline-flex min-h-[var(--control-h-base)] items-center text-sm font-medium text-ink-1 underline-offset-4 hover:underline" href={resolveTrainingAssetUrl(block.resourceUrl) ?? block.resourceUrl} target="_blank" rel="noreferrer noopener">
          Abrir recurso
        </a>
      ) : null}
    </div>
  );
}

function LessonMark({ completed, current }: { completed: boolean; current: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
        completed ? "border-status-success bg-status-success text-white" : current ? "border-accent-line bg-accent-fill/15 text-accent-ink" : "border-line-strong text-ink-3",
      )}
    >
      {completed ? <Check className="size-4" strokeWidth={3} /> : current ? <Play className="size-3.5 fill-current" /> : <CircleDot className="size-3.5" />}
    </span>
  );
}

function StepEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-ink">{children}</p>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-ink-1">{value}</dd>
    </div>
  );
}

function lessonKindLabel(lesson: Lesson) {
  switch (lesson.type) {
    case "VIDEO":
      return "Video";
    case "QUIZ":
      return "Cuestionario";
    case "FILE":
      return "Archivo";
    case "TASK":
      return "Tarea";
    default:
      return lesson.videoUrl ? "Video" : "Lectura";
  }
}

function blockTypeLabel(type: Lesson["blocks"][number]["type"]) {
  const labels: Record<string, string> = { RICH_TEXT: "Texto", VIDEO: "Video", FILE: "Archivo", LINK: "Enlace", QUIZ: "Cuestionario", TASK: "Tarea" };
  return labels[type] ?? type;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(date);
}
