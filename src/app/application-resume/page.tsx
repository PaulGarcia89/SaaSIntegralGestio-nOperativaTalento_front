"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3, PauseCircle, ShieldCheck } from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { CandidateNav } from "@/components/candidate-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPublicApplicationDraft, fetchPublicVacancy } from "@/lib/backend";

function ResumeContent() {
  const params = useSearchParams();
  const vacancyId = params.get("vacancyId") ?? "";
  const draft = useQuery({ queryKey: ["public-application-draft", vacancyId], queryFn: () => fetchPublicApplicationDraft(vacancyId), enabled: Boolean(vacancyId), retry: false });
  const vacancy = useQuery({ queryKey: ["public-vacancy", vacancyId], queryFn: () => fetchPublicVacancy(vacancyId), enabled: Boolean(vacancyId), retry: false });
  if (!vacancyId) return <main className="mx-auto w-full max-w-3xl pb-12 pt-2"><CandidateNav /><Card><CardContent className="space-y-4 py-12 text-center"><h1 className="text-2xl font-semibold">No encontramos una postulación para reanudar</h1><p className="text-sm text-muted-foreground">Abre el enlace de la vacante o explora nuevas oportunidades.</p><Button asChild><Link href="/jobs">Explorar vacantes</Link></Button></CardContent></Card></main>;
  if (draft.isLoading || vacancy.isLoading) return <AsyncState state="loading" title="Buscando tu progreso" />;
  if (draft.isError || vacancy.isError) return <AsyncState state="error" title="No pudimos recuperar el borrador" description="Verifica tu conexión o vuelve a abrir este enlace desde el navegador donde comenzaste." onRetry={() => { void draft.refetch(); void vacancy.refetch(); }} />;
  const draftResponse = draft.data;
  const progress = draftResponse?.value;
  if (!progress || !vacancy.data || !draftResponse) return <main className="mx-auto w-full max-w-3xl pb-12 pt-2"><CandidateNav /><Card><CardContent className="space-y-4 py-12 text-center"><h1 className="text-2xl font-semibold">No hay un borrador activo</h1><p className="text-sm text-muted-foreground">Es posible que ya hayas enviado esta postulación o que el borrador haya vencido.</p><Button asChild><Link href="/jobs">Explorar vacantes</Link></Button></CardContent></Card></main>;
  const expiry = draftResponse.expiresAt ? new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(new Date(draftResponse.expiresAt)) : "próximamente";
  const step = progress.flowVersion === 2 ? Math.min(progress.step, 4) : [0, 1, 1, 2, 3, 4][Math.min(progress.step, 5)] ?? 0;
  return <main className="mx-auto w-full max-w-3xl space-y-6 pb-12 pt-2"><CandidateNav /><Card className="overflow-hidden"><div className="h-2 bg-primary" /><CardHeader><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><PauseCircle className="size-6" /></div><div><p className="text-sm font-medium text-primary">Postulación pausada</p><CardTitle className="mt-1 text-2xl">Tu progreso está listo para continuar</CardTitle></div></div></CardHeader><CardContent className="space-y-6"><div className="rounded-xl bg-secondary/50 p-4"><p className="font-semibold">{vacancy.data.title}</p><p className="mt-1 text-sm text-muted-foreground">Volverás al paso {step + 1} con los datos que ya completaste.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="flex gap-3 rounded-xl border p-4"><Clock3 className="size-5 shrink-0 text-primary" /><div><p className="font-medium">Disponible hasta</p><p className="text-sm text-muted-foreground">{expiry}</p></div></div><div className="flex gap-3 rounded-xl border p-4"><ShieldCheck className="size-5 shrink-0 text-primary" /><div><p className="font-medium">Guardado seguro</p><p className="text-sm text-muted-foreground">Tu borrador está persistido en Railway.</p></div></div></div><div className="flex flex-wrap gap-3"><Button asChild><Link href={`/apply?vacancyId=${encodeURIComponent(vacancyId)}`}>Continuar postulación<ArrowRight className="size-4" /></Link></Button><Button asChild variant="secondary"><Link href="/jobs">Ver otras vacantes</Link></Button></div><p className="text-xs text-muted-foreground">Para proteger tu información, abre este enlace desde el mismo navegador donde pausaste la postulación.</p></CardContent></Card></main>;
}

export default function ApplicationResumePage() { return <Suspense fallback={<AsyncState state="loading" title="Preparando reanudación" />}><ResumeContent /></Suspense>; }
