"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Link2 } from "lucide-react";
import { authenticateCandidate, requestCandidatePasswordReset, startCandidateSocialLogin } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CandidateAuthCard({ onAuthenticated, returnPath = "/application-status" }: { onAuthenticated: () => void; returnPath?: string; lang?: "es" | "en" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recovering, setRecovering] = useState(false);
  const login = useMutation({ mutationFn: () => authenticateCandidate(email, password), onSuccess: onAuthenticated });
  const recovery = useMutation({ mutationFn: () => requestCandidatePasswordReset(email) });
  const social = useMutation({
    mutationFn: (provider: "linkedin" | "indeed") => startCandidateSocialLogin(provider, new URL(returnPath, window.location.origin).toString()),
    onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl),
  });
  return <Card className="mx-auto w-full max-w-lg" aria-labelledby="candidate-access-title"><CardHeader><CardTitle id="candidate-access-title">Acceso seguro del candidato</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">Usa la cuenta vinculada a tus postulaciones.</p>
    <div className="space-y-2"><Label htmlFor="candidate-email">Correo</Label><Input id="candidate-email" autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
    {!recovering ? <div className="space-y-2"><Label htmlFor="candidate-password">Contraseña</Label><Input id="candidate-password" autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div> : null}
    {login.isError || social.isError ? <p role="alert" className="text-sm text-destructive">No fue posible completar el acceso. Revisa tus credenciales o la configuración del proveedor.</p> : null}
    {recovery.isSuccess ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Si la cuenta existe, se programó el envío de un enlace de recuperación.</p> : null}
    {recovering ? <><Button className="w-full" onClick={() => recovery.mutate()} disabled={!email || recovery.isPending}><KeyRound className="size-4" />{recovery.isPending ? "Solicitando…" : "Enviar enlace de recuperación"}</Button><Button className="w-full" variant="ghost" onClick={() => setRecovering(false)}>Volver al ingreso</Button></> : <><Button className="w-full" onClick={() => login.mutate()} disabled={!email || password.length < 10 || login.isPending}>{login.isPending ? "Verificando…" : "Ingresar"}</Button><Button className="w-full" variant="ghost" onClick={() => setRecovering(true)}>¿Olvidaste tu contraseña?</Button></>}
    <div className="grid gap-2 border-t pt-4 sm:grid-cols-2"><Button variant="secondary" onClick={() => social.mutate("linkedin")} disabled={social.isPending}><Link2 className="size-4" />LinkedIn</Button><Button variant="secondary" onClick={() => social.mutate("indeed")} disabled={social.isPending}>Indeed</Button></div>
    <p className="text-xs text-muted-foreground">El acceso social se habilita únicamente después de la aprobación y configuración OAuth del proveedor.</p>
  </CardContent></Card>;
}
