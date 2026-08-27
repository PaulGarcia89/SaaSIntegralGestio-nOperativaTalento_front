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
  const { locale, t } = useLocale();
  const [selected, setSelected] = useState("");
  const context = useQuery({ queryKey: ["public-interview-scheduling", token, locale], queryFn: () => fetchPublicInterviewScheduling(token), enabled: Boolean(token), retry: false });
  const booking = useMutation({ mutationFn: () => bookPublicInterviewScheduling(token, selected) });

  if (!token) return <InlineFeedback tone="danger" title={t("interview.incompleteLink")}>{t("interview.requestNewLink")}</InlineFeedback>;
  if (context.isLoading) return <AsyncState state="loading" title={t("interview.loading")} />;
  if (context.isError) return <InlineFeedback tone="danger" title={t("interview.unavailableLink")}>{t("interview.invalidLink")}</InlineFeedback>;
  if (!context.data) return null;
  if (booking.isSuccess) { const date = new Date(booking.data.startsAt).toLocaleString(locale, { dateStyle: "full", timeStyle: "short" }); return <Card level={1}><CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck2 className="size-6 text-status-success" />{t("interview.confirmed")}</CardTitle></CardHeader><CardContent><p>{t("interview.reservedFor", { date })}</p><p className="mt-2 text-sm text-text-secondary">{t("interview.timezone", { timezone: booking.data.timezone })}</p></CardContent></Card>; }

  return <div className="space-y-6"><header className="space-y-2"><p className="text-sm font-medium text-primary">{t("interview.selectionProcess")} · {context.data.vacancy.title}</p><h1 className="text-3xl font-semibold">{t("interview.chooseTime")}</h1><p className="text-text-secondary">{t("interview.greeting", { name: context.data.candidate.fullName })}</p></header><Card level={1}><CardHeader><CardTitle>{context.data.title}</CardTitle></CardHeader><CardContent className="space-y-5"><div className="flex gap-3 rounded-xl bg-surface-section p-4 text-sm"><Clock3 className="size-5" /><p>{context.data.durationMinutes} min · {technicalLabel(context.data.type)} · {context.data.timezone}</p></div>{context.data.slots.length ? <fieldset><legend className="font-semibold">{t("interview.availableSlots")}</legend><div className="mt-3 grid max-h-[50vh] gap-2 overflow-y-auto sm:grid-cols-2">{context.data.slots.map((slot) => <label key={slot.startsAt} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 ${selected === slot.startsAt ? "border-primary bg-primary/5" : "border-border-default"}`}><input type="radio" name="slot" value={slot.startsAt} checked={selected === slot.startsAt} onChange={() => setSelected(slot.startsAt)} /><span><span className="block font-medium">{new Date(slot.startsAt).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</span><span className="text-sm text-text-secondary">{new Date(slot.startsAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</span></span></label>)}</div></fieldset> : <InlineFeedback tone="warning" title={t("interview.noSlots")}>{t("interview.askCoordinator")}</InlineFeedback>}{booking.isError ? <InlineFeedback tone="danger" title={t("interview.slotUnavailable")}>{t("interview.selectAnother")}</InlineFeedback> : null}<Button className="w-full" disabled={!selected || booking.isPending} onClick={() => booking.mutate()}>{booking.isPending ? t("interview.confirming") : t("interview.confirm")}</Button></CardContent></Card></div>;
}

export default function CandidateInterviewSchedulingPage() {
  return <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6"><Suspense fallback={<AsyncState state="loading" title="Preparando agenda" />}><SchedulingContent /></Suspense></main>;
}
