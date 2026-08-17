"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ApiError } from "@/lib/backend";

export type FormSummaryError = { fieldId: string; label: string; message: string };

export function getServerFormMessage(error: unknown, context: "form" | "authentication" = "form") {
  const fallback = context === "authentication"
    ? "No pudimos iniciar sesión. Verifica tu conexión e inténtalo nuevamente."
    : "No pudimos guardar los cambios. Inténtalo nuevamente.";
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 401) return "El correo o la contraseña no son correctos.";
  if (error.status === 403) return "Tu cuenta no tiene acceso a este espacio de trabajo.";
  if (error.status === 400) return `Revisa los datos ingresados. ${error.message}`;
  if (error.status === 409) return "Otro registro utiliza estos datos. Revisa los valores e inténtalo nuevamente.";
  if (error.status === 422) return "El servidor encontró datos que necesitan corrección.";
  if (error.status === 429) return "Has realizado demasiados intentos. Espera un momento antes de continuar.";
  return fallback;
}

export function FormErrorSummary({ errors, serverError, success, context = "form" }: { errors?: FormSummaryError[]; serverError?: unknown; success?: string; context?: "form" | "authentication" }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasError = Boolean(errors?.length || serverError);
  useEffect(() => { if (hasError) ref.current?.focus(); }, [hasError]);
  if (success) return <div className="flex gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950" role="status"><CheckCircle2 className="size-5 shrink-0" />{success}</div>;
  if (!hasError) return null;
  return <div ref={ref} tabIndex={-1} className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 outline-none focus-visible:ring-2 focus-visible:ring-destructive" role="alert" aria-labelledby="form-errors-title">
    <div className="flex gap-3"><AlertCircle className="size-5 shrink-0 text-destructive" /><div><h2 id="form-errors-title" className="font-semibold">{context === "authentication" && serverError ? "No pudimos iniciar sesión" : "Revisa el formulario"}</h2>{serverError ? <p className="mt-1 text-sm text-muted-foreground">{getServerFormMessage(serverError, context)}</p> : null}</div></div>
    {errors?.length ? <ul className="mt-3 list-disc space-y-1 pl-8 text-sm">{errors.map((error) => <li key={error.fieldId}><a href={`#${error.fieldId}`} onClick={() => document.getElementById(error.fieldId)?.focus()} className="underline underline-offset-2">{error.label}: {error.message}</a></li>)}</ul> : null}
  </div>;
}
