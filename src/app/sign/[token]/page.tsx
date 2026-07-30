"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileSignature, ShieldCheck } from "lucide-react";
import { fetchPublicSigningContext, submitPublicSignature } from "@/lib/backend";
import { AsyncState } from "@/components/async-state";
import { InlineFeedback } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PublicSignaturePage() {
  const { token } = useParams<{ token: string }>();
  const [typedName, setTypedName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const context = useQuery({ queryKey: ["public-signature", token], queryFn: () => fetchPublicSigningContext(token), retry: false });
  const sign = useMutation({ mutationFn: () => submitPublicSignature(token, { accepted, typedName }) });

  if (context.isLoading) return <main className="flex min-h-screen items-center justify-center p-6"><AsyncState state="loading" title="Preparando documento seguro" /></main>;
  if (context.isError) return <main className="flex min-h-screen items-center justify-center p-6"><AsyncState state="error" title="La solicitud no está disponible" description="El enlace puede haber vencido, haber sido utilizado o no ser válido." /></main>;
  if (sign.isSuccess) return <main className="flex min-h-screen items-center justify-center bg-surface-page p-6"><Card className="w-full max-w-xl text-center"><CardContent className="space-y-5 py-12"><CheckCircle2 className="mx-auto size-14 text-status-success" /><h1 className="text-2xl font-semibold">Documento firmado correctamente</h1><p className="text-text-secondary">Registramos tu consentimiento y las evidencias de la firma. Puedes cerrar esta ventana.</p><Button asChild variant="secondary"><Link href="/">Ir al sitio público</Link></Button></CardContent></Card></main>;
  const data = context.data!;
  return <main className="min-h-screen bg-surface-page p-4 sm:p-8"><div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
    <Card><CardHeader><div className="flex items-center gap-3"><FileSignature className="size-6 text-primary" /><div><p className="text-sm text-text-secondary">{data.package.title}</p><CardTitle>{data.document.title}</CardTitle></div></div></CardHeader><CardContent><article className="whitespace-pre-wrap rounded-2xl border bg-surface-section p-6 leading-7">{data.document.content}</article><p className="mt-4 text-xs text-text-secondary">Versión {data.document.version} · El contenido se verifica mediante checksum al firmar.</p></CardContent></Card>
    <Card level={1} className="h-fit lg:sticky lg:top-8"><CardHeader><CardTitle>Consentimiento y firma</CardTitle><p className="text-sm text-text-secondary">{data.participant.fullName} · {data.participant.email}</p></CardHeader><CardContent className="space-y-5"><InlineFeedback tone="info" title="Firma protegida"><span className="flex gap-2"><ShieldCheck className="size-4 shrink-0" />Se guardarán fecha, versión, checksum y huellas no reversibles para la auditoría.</span></InlineFeedback><label className="flex items-start gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 size-5" /><span>{data.document.consentText}</span></label><div className="space-y-2"><Label htmlFor="typed-name">Escribe tu nombre completo</Label><Input id="typed-name" autoComplete="name" value={typedName} onChange={(event) => setTypedName(event.target.value)} placeholder={data.participant.fullName} /></div><Button className="w-full" disabled={!accepted || typedName.trim().length < 3 || sign.isPending} onClick={() => sign.mutate()}>{sign.isPending ? "Registrando firma…" : "Aceptar y firmar"}</Button>{sign.isError ? <p role="alert" className="text-sm text-status-danger">No pudimos registrar la firma. Comprueba que el nombre coincida y vuelve a intentarlo.</p> : null}</CardContent></Card>
  </div></main>;
}
