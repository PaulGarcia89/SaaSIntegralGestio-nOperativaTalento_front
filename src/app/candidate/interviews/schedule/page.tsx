"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarCheck2, Clock3 } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookPublicInterviewScheduling, fetchPublicInterviewScheduling } from "@/lib/backend";
import { technicalLabel } from "@/lib/ui-labels";
import { useLocale } from "@/components/locale-provider";

function SchedulingContent() {
  const token = useSearchParams().get("token") ?? "";
  const { locale } = useLocale();
  const [selected, setSelected] = useState("");
  const context = useQuery({ queryKey: ["public-interview-scheduling", token, locale], queryFn: () => fetchPublicInterviewScheduling(token), enabled: Boolean(token), retry: false });
  const booking = useMutation({ mutationFn: () => bookPublicInterviewScheduling(token, selected) });

  if (!token) return <InlineFeedback tone="danger" title="Enlace incompleto">Solicita un nuevo enlace al equipo de reclutamiento.</InlineFeedback>;
  if (context.isLoading) return <AsyncState state="loading" title="Consultando horarios disponibles" />;
  if (context.isError) return <InlineFeedback tone="danger" title="Enlace no disponible">El enlace venció, fue utilizado o ya no es válido.</InlineFeedback>;
  if (!context.data) return null;
  if (booking.isSuccess) return <Card level={1}><CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck2 className="size-6 text-status-success" />Entrevista confirmada</CardTitle></CardHeader><CardContent><p>Tu entrevista quedó reservada para <strong>{new Date(booking.data.startsAt).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</strong>.</p><p className="mt-2 text-sm text-text-secondary">Zona horaria: {booking.data.timezone}. Recibirás la confirmación y los detalles por los canales configurados.</p></CardContent></Card>;

  return <div className="space-y-6"><header className="space-y-2"><p className="text-sm font-medium text-primary">Proceso de selección · {context.data.vacancy.title}</p><h1 className="text-3xl font-semibold">Elige el horario de tu entrevista</h1><p className="text-text-secondary">Hola {context.data.candidate.fullName}. Los horarios se validan nuevamente al confirmar para evitar cruces de agenda.</p></header><Card level={1}><CardHeader><CardTitle>{context.data.title}</CardTitle></CardHeader><CardContent className="space-y-5"><div className="flex gap-3 rounded-xl bg-surface-section p-4 text-sm"><Clock3 className="size-5" /><p>{context.data.durationMinutes} minutos · {technicalLabel(context.data.type)} · {context.data.timezone}</p></div>{context.data.slots.length ? <fieldset><legend className="font-semibold">Horarios disponibles</legend><div className="mt-3 grid max-h-[50vh] gap-2 overflow-y-auto sm:grid-cols-2">{context.data.slots.map((slot) => <label key={slot.startsAt} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 ${selected === slot.startsAt ? "border-primary bg-primary/5" : "border-border-default"}`}><input type="radio" name="slot" value={slot.startsAt} checked={selected === slot.startsAt} onChange={() => setSelected(slot.startsAt)} /><span><span className="block font-medium">{new Date(slot.startsAt).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</span><span className="text-sm text-text-secondary">{new Date(slot.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></span></label>)}</div></fieldset> : <InlineFeedback tone="warning" title="No hay horarios disponibles">Pide al coordinador que amplíe la ventana de disponibilidad.</InlineFeedback>}{booking.isError ? <InlineFeedback tone="danger" title="El horario ya no está disponible">Selecciona otro horario y vuelve a confirmar.</InlineFeedback> : null}<Button className="w-full" disabled={!selected || booking.isPending} onClick={() => booking.mutate()}>{booking.isPending ? "Confirmando…" : "Confirmar horario"}</Button></CardContent></Card></div>;
}

export default function CandidateInterviewSchedulingPage() {
  return <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6"><Suspense fallback={<AsyncState state="loading" title="Preparando agenda" />}><SchedulingContent /></Suspense></main>;
}
