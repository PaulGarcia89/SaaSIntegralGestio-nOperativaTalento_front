"use client";

import { createPlaybackSessionId } from "@/lib/playback-session-id";

import { useUiText } from "@/components/ui-copy";

import { useEffect, useRef, useState } from "react";
import type { LearnerTrainingCourseDto } from "@/lib/contracts";
import type { VideoProgressEvent } from "@/components/training-learning-hub";

export function StrictVideoLesson({ lesson, assignmentId, url, onProgress }: {
  lesson: LearnerTrainingCourseDto["modules"][number]["lessons"][number]; assignmentId: string; url: string;
  onProgress: (event: VideoProgressEvent) => Promise<unknown> | void;
}) {
  const uiText = useUiText();
  const videoRef = useRef<HTMLVideoElement>(null);
  const callback = useRef(onProgress);
  const initial = useRef(lesson.videoProgress);
  const [percent, setPercent] = useState(lesson.videoProgress?.completionPercentage ?? 0);
  const [message, setMessage] = useState("Debes ver el video completo. Puedes pausar y continuar después.");
  useEffect(() => { callback.current = onProgress; }, [onProgress]);
  useEffect(() => {
    const video = videoRef.current;
    const duration = lesson.durationSeconds;
    if (!video || !assignmentId || !duration) return;
    const session = createPlaybackSessionId();
    let queue = Promise.resolve();
    let reached = initial.current?.watchedSeconds ?? 0;
    let done = initial.current?.completionPercentage === 100;
    let alive = true;
    const send = (eventType: VideoProgressEvent["eventType"]) => {
      const event = { assignmentId, lessonId: lesson.id, playbackSessionId: session, eventType,
        currentTimeSeconds: Math.min(duration, Math.round(video.currentTime)), durationSeconds: duration };
      queue = queue.then(async () => {
        const response = await callback.current(event) as { serverCompletionPercentage?: number; completedAt?: string } | undefined;
        if (response?.serverCompletionPercentage !== undefined) {
          if (alive) setPercent(response.serverCompletionPercentage);
          if (response.serverCompletionPercentage === 100 && !done) {
            await callback.current({ ...event, eventType: "COMPLETED" });
            done = true;
            if (alive) setMessage("Video visto al 100 %. Curso completado y guardado.");
          } else if (alive && !done) setMessage("Avance guardado. Continúa hasta el final.");
        }
      }).catch(() => { video.pause(); if (alive) setMessage("No se pudo guardar el avance. Reanuda para volver a intentarlo."); });
    };
    const restore = () => { video.currentTime = initial.current?.watchedSeconds ?? 0; };
    const play = () => { video.playbackRate = 1; send("PLAY"); };
    const pause = () => { if (!done) send("HEARTBEAT"); send("PAUSE"); };
    const end = () => { if (!done) send("HEARTBEAT"); send("ENDED"); };
    const seeking = () => { if (!done && video.currentTime > reached + 0.5) { video.currentTime = reached; setMessage("Primero debes ver esta parte del video."); } };
    const time = () => { if (!video.seeking && !video.paused) reached = Math.max(reached, video.currentTime); };
    const rate = () => { if (video.playbackRate !== 1) video.playbackRate = 1; };
    const hidden = () => { if (document.hidden) video.pause(); };
    const timer = window.setInterval(() => { if (!video.paused && !video.ended && !done) send("HEARTBEAT"); }, 5000);
    video.addEventListener("loadedmetadata", restore);
    video.addEventListener("play", play); video.addEventListener("pause", pause); video.addEventListener("ended", end);
    video.addEventListener("seeking", seeking); video.addEventListener("timeupdate", time); video.addEventListener("ratechange", rate);
    document.addEventListener("visibilitychange", hidden);
    if (video.readyState >= 1) restore();
    return () => { alive = false; window.clearInterval(timer);
      video.removeEventListener("loadedmetadata", restore); video.removeEventListener("play", play); video.removeEventListener("pause", pause);
      video.removeEventListener("ended", end); video.removeEventListener("seeking", seeking); video.removeEventListener("timeupdate", time); video.removeEventListener("ratechange", rate);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [assignmentId, lesson.id, lesson.durationSeconds]);
  return <div className="space-y-3 rounded-xl border p-3">
    <video ref={videoRef} src={url} controls playsInline preload="metadata" controlsList="nodownload noplaybackrate" className="aspect-video w-full rounded-lg bg-black" aria-label={lesson.title} onError={() => setMessage("No fue posible cargar el video. Actualiza la página para reintentar.")} />
    <progress value={percent} max={100} className="h-3 w-full" aria-label={uiText("Porcentaje de video visto y validado")} />
    <p className="text-sm font-medium">{percent} {uiText(" % visto · Obligatorio: 100 %")}</p>
    <p className="text-sm text-muted-foreground" aria-live="polite">{uiText(assignmentId ? message : "Necesitas una asignación para registrar tu avance.")}</p>
  </div>;
}
