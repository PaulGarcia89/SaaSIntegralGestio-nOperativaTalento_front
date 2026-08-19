"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ApiError } from "@/lib/backend";

export type FormSummaryError = { fieldId: string; label: string; message: string };

function getServerFormTitle(error: unknown, context: "form" | "authentication") {
  if (context === "authentication") return "No pudimos iniciar sesión";
  if (error instanceof ApiError && error.status >= 500) return "El servidor no pudo guardar la vacante";
  if (error instanceof ApiError && error.status === 403) return "No tienes permiso para guardar esta vacante";
  return "Revisa el formulario";
}

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
  if (error.status >= 500) {
    const reference = error.requestId ? ` Referencia de soporte: ${error.requestId}.` : "";
    const code = error.code ? ` (${error.code})` : "";
    return `El servidor rechazó la operación con HTTP ${error.status}${code}: ${error.message}.${reference}`;
  }
  return error.message || fallback;
}

export function FormErrorSummary({ errors, serverError, success, context = "form" }: { errors?: FormSummaryError[]; serverError?: unknown; success?: string; context?: "form" | "authentication" }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasError = Boolean(errors?.length || serverError);
  useEffect(() => { if (hasError) ref.current?.focus(); }, [hasError]);
  if (success) return <div className="flex gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950" role="status"><CheckCircle2 className="size-5 shrink-0" />{success}</div>;
  if (!hasError) return null;
  return <div ref={ref} tabIndex={-1} className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 outline-none focus-visible:ring-2 focus-visible:ring-destructive" role="alert" aria-labelledby="form-errors-title">
    <div className="flex gap-3"><AlertCircle className="size-5 shrink-0 text-destructive" /><div><h2 id="form-errors-title" className="font-semibold">{serverError ? getServerFormTitle(serverError, context) : "Revisa el formulario"}</h2>{serverError ? <p className="mt-1 text-sm text-muted-foreground">{getServerFormMessage(serverError, context)}</p> : null}</div></div>
    {errors?.length ? <ul className="mt-3 list-disc space-y-1 pl-8 text-sm">{errors.map((error) => <li key={error.fieldId}><a href={`#${error.fieldId}`} onClick={() => document.getElementById(error.fieldId)?.focus()} className="underline underline-offset-2">{error.label}: {error.message}</a></li>)}</ul> : null}
  </div>;
}
