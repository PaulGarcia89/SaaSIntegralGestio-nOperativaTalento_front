"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Link2 } from "lucide-react";
import { ApiError, authenticateCandidate, requestCandidatePasswordReset, startCandidateSocialLogin } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/locale-provider";

function candidateAuthErrorMessage(error: unknown, mode: "login" | "register", t: (key: string) => string) {
  if (mode === "register" && error instanceof ApiError && /Applicant account already exists/i.test(error.message)) {
    return t("candidate.existingAccount");
  }
  return t("candidate.accessError");
}

export function CandidateAuthCard({ onAuthenticated, returnPath = "/application-status", portalLabel = "portal del candidato", defaultMode = "login", allowRegistration = true }: { onAuthenticated: () => void; returnPath?: string; portalLabel?: string; defaultMode?: "login" | "register"; allowRegistration?: boolean; lang?: "es" | "en" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const { t } = useLocale();
  const login = useMutation({ mutationFn: () => authenticateCandidate(email, password, mode), onSuccess: onAuthenticated });
  const recovery = useMutation({ mutationFn: () => requestCandidatePasswordReset(email) });
  const social = useMutation({
    mutationFn: (provider: "linkedin" | "indeed") => startCandidateSocialLogin(provider, new URL(returnPath, window.location.origin).toString()),
    onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl),
  });
  return <Card className="mx-auto w-full max-w-lg" aria-labelledby="candidate-access-title"><CardHeader><CardTitle id="candidate-access-title">{mode === "register" ? t("candidate.createAccount") : t("candidate.secureAccess")}</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">{t(mode === "register" ? "candidate.createDescription" : "candidate.loginDescription", { portal: portalLabel })}</p>
    <div className="space-y-2"><Label htmlFor="candidate-email">{t("candidate.email")}</Label><Input id="candidate-email" autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
    {!recovering ? <div className="space-y-2"><Label htmlFor="candidate-password">{t("auth.password")}</Label><Input id="candidate-password" autoComplete={mode === "register" ? "new-password" : "current-password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /><p className="text-xs text-muted-foreground">{t("candidate.usePassword")}</p></div> : null}
    {login.isError || social.isError ? <p role="alert" className="text-sm text-destructive">{candidateAuthErrorMessage(login.error ?? social.error, mode, t)}</p> : null}
    {recovery.isSuccess ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{t("candidate.recoverySuccess")}</p> : null}
    {recovering ? <><Button className="w-full" onClick={() => recovery.mutate()} disabled={!email || recovery.isPending}><KeyRound className="size-4" />{recovery.isPending ? t("actions.loading") : t("candidate.requestRecovery")}</Button><p className="text-xs text-muted-foreground">{t("candidate.recoveryHint")}</p><Button className="w-full" variant="ghost" onClick={() => setRecovering(false)}>{t("candidate.backToLogin")}</Button></> : <><Button className="w-full" onClick={() => login.mutate()} disabled={!email || password.length < 10 || login.isPending}>{login.isPending ? t("candidate.verifying") : mode === "register" ? t("candidate.create") : t("candidate.signIn")}</Button>{mode === "login" ? <Button className="w-full" variant="ghost" onClick={() => setRecovering(true)}>{t("candidate.forgot")}</Button> : null}{allowRegistration ? <Button className="w-full" variant="ghost" onClick={() => { setMode((current) => current === "login" ? "register" : "login"); login.reset(); setRecovering(false); }}>{mode === "register" ? t("candidate.haveAccount") : t("candidate.newAccount")}</Button> : null}</>}
    <div className="grid gap-2 border-t pt-4 sm:grid-cols-2"><Button variant="secondary" onClick={() => social.mutate("linkedin")} disabled={social.isPending}><Link2 className="size-4" />LinkedIn</Button><Button variant="secondary" onClick={() => social.mutate("indeed")} disabled={social.isPending}>Indeed</Button></div>
    <p className="text-xs text-muted-foreground">{t("candidate.socialHint")}</p>
  </CardContent></Card>;
}
