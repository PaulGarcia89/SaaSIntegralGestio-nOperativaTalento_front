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
import { useLocale } from "@/components/locale-provider";

function CandidateResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { locale, t } = useLocale();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const reset = useMutation({ mutationFn: () => resetCandidatePassword(token, password) });
  const valid = token.length >= 32 && password.length >= 10 && password === confirmation;
  return <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-12 pt-2"><CandidateNav /><Card><CardHeader><CardTitle>{t("password.title")}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{t("password.description")}</p><div className="rounded-xl bg-surface-section p-4 text-sm text-text-secondary"><p className="font-medium text-text-primary">{t("password.tips")}</p><ul className="mt-2 list-disc space-y-1 pl-5"><li>{t("password.tipLength")}</li><li>{t("password.tipReuse")}</li><li>{t("password.tipManager")}</li></ul></div><div className="space-y-2"><Label htmlFor="new-password">{t("password.new")}</Label><Input id="new-password" autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">{t("password.confirm")}</Label><Input id="confirm-password" autoComplete="new-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>{confirmation && password !== confirmation ? <p role="alert" className="text-sm text-destructive">{t("password.mismatch")}</p> : null}{reset.isError ? <p role="alert" className="text-sm text-destructive">{t("password.invalidLink")}</p> : null}{reset.isSuccess ? <div role="status" className="space-y-3 rounded-xl bg-emerald-50 p-4 text-emerald-900"><p>{t("password.updated")}</p><div className="flex flex-wrap gap-2"><Button asChild><Link href={`/candidate/portal?lang=${locale}`}>{t("password.openPortal")}</Link></Button><Button asChild variant="secondary"><Link href={`/application-status?lang=${locale}`}>{t("password.viewApplications")}</Link></Button></div></div> : <Button disabled={!valid || reset.isPending} onClick={() => reset.mutate()}>{reset.isPending ? t("password.updating") : t("password.update")}</Button>}</CardContent></Card></main>;
}

export default function CandidateResetPasswordPage() { return <Suspense fallback={<p className="p-6">Cargando…</p>}><CandidateResetPasswordContent /></Suspense>; }
