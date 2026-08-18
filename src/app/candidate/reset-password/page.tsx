"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { resetCandidatePassword } from "@/lib/backend";
import { CandidateNav } from "@/components/candidate-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CandidateResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const lang = "es" as const;
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const reset = useMutation({ mutationFn: () => resetCandidatePassword(token, password) });
  const valid = token.length >= 32 && password.length >= 10 && password === confirmation;
  return <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-12 pt-2"><CandidateNav /><Card><CardHeader><CardTitle>Crear una nueva contraseña</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">El enlace seguro solo puede utilizarse una vez y caduca después de 30 minutos. Cuando termines, podrás volver al portal y revisar tus postulaciones, documentos y solicitudes activas.</p><div className="rounded-xl bg-surface-section p-4 text-sm text-text-secondary"><p className="font-medium text-text-primary">Consejos rápidos</p><ul className="mt-2 list-disc space-y-1 pl-5"><li>Usa al menos 10 caracteres.</li><li>Evita reutilizar contraseñas de otros servicios.</li><li>Guarda el acceso en un administrador de contraseñas si lo tienes.</li></ul></div><div className="space-y-2"><Label htmlFor="new-password">Nueva contraseña</Label><Input id="new-password" autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirmar contraseña</Label><Input id="confirm-password" autoComplete="new-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>{confirmation && password !== confirmation ? <p role="alert" className="text-sm text-destructive">Las contraseñas no coinciden.</p> : null}{reset.isError ? <p role="alert" className="text-sm text-destructive">El enlace es inválido o ya caducó. Si lo necesitas, pide uno nuevo desde el acceso del candidato.</p> : null}{reset.isSuccess ? <div role="status" className="space-y-3 rounded-xl bg-emerald-50 p-4 text-emerald-900"><p>Contraseña actualizada correctamente.</p><div className="flex flex-wrap gap-2"><Button asChild><Link href={"/candidate/portal?lang=" + lang}>Abrir centro del candidato</Link></Button><Button asChild variant="secondary"><Link href={"/application-status?lang=" + lang}>Ver postulaciones</Link></Button></div></div> : <Button disabled={!valid || reset.isPending} onClick={() => reset.mutate()}>{reset.isPending ? "Actualizando…" : "Actualizar contraseña"}</Button>}</CardContent></Card></main>;
}

export default function CandidateResetPasswordPage() { return <Suspense fallback={<p className="p-6">Cargando…</p>}><CandidateResetPasswordContent /></Suspense>; }
