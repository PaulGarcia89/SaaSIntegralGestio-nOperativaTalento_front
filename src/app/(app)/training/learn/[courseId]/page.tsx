"use client";

import { ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AsyncState } from "@/components/async-state";
import { CourseContent, type VideoProgressEvent } from "@/components/training-learning-hub";
import { Button } from "@/components/ui/button";
import { fetchLearnerTrainingCourse, getApiErrorMessage, heartbeatTrainingVideo, recordTrainingVideoEvent, startTrainingVideo, updateTrainingLessonProgress } from "@/lib/backend";

export default function TrainingCourseLearnPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["learner-course", courseId], queryFn: () => fetchLearnerTrainingCourse(courseId) });
  const progress = useMutation({
    mutationFn: async (event: VideoProgressEvent) => {
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          if (event.eventType === "PLAY") return await startTrainingVideo(event);
          if (event.eventType === "HEARTBEAT") return await heartbeatTrainingVideo({ ...event, clientTimestamp: new Date().toISOString(), isPlaying: true });
          if (event.eventType === "COMPLETED") return await updateTrainingLessonProgress(event.lessonId, true);
          if (event.eventType === "PAUSE" || event.eventType === "SEEK" || event.eventType === "ENDED") return await recordTrainingVideoEvent(event.eventType === "ENDED" ? "ended" : "pause", event);
          return null;
        } catch (error) {
          lastError = error;
          if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 500 * 2 ** attempt));
        }
      }
      throw lastError;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-training-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["learner-course", courseId] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible sincronizar tu avance.")),
  });

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
    <Button asChild variant="ghost" className="-ml-3"><Link href="/training"><ArrowLeft className="size-4" />Volver a mis capacitaciones</Link></Button>
    {query.isLoading ? <AsyncState state="loading" title="Cargando capacitación" /> : query.isError ? <AsyncState state="error" onRetry={() => query.refetch()} /> : query.data ? <><header><p className="text-sm font-medium text-brand">Capacitación</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{query.data.title}</h1><p className="mt-2 max-w-3xl text-text-secondary">{query.data.summary}</p></header><CourseContent course={query.data} onVideoProgress={(event) => progress.mutateAsync(event)} /></> : null}
  </main>;
}
