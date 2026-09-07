"use client";

import { useEffect, useRef } from "react";
import { ApiError } from "@/lib/backend";
import { InlineNote } from "@/components/system";

export type FormSummaryError = { fieldId: string; label: string; message: string };

/**
 * Resumen de errores de un formulario.
 *
 * Tenía un defecto que se leía en pantalla: los títulos decían «vacante»
 * siempre. Este componente lo usan cuatro formularios —vacantes, alta de
 * empresa, inicio de sesión y creación de cursos—, así que al registrar una
 * empresa y fallar el servidor aparecía «El servidor no pudo guardar la
 * vacante», y al no tener permiso, «No tienes permiso para guardar esta
 * vacante». Ahora el asunto del formulario es una prop y por defecto es
 * neutro.
 *
 * El aviso de éxito estaba pintado con `border-emerald-300 bg-status-success/10
 * text-emerald-950`: un recuadro verde claro fijo, que en tema oscuro
 * aparecía como un bloque luminoso en medio de una pantalla oscura. Ahora usa
 * el aviso del sistema, que responde al tema.
 */

function getServerFormTitle(error: unknown, context: "form" | "authentication", subject: string) {
  if (context === "authentication") return "No pudimos iniciar sesión";
  if (error instanceof ApiError && error.status >= 500) return `El servidor no pudo guardar ${subject}`;
  if (error instanceof ApiError && error.status === 403) return `No tienes permiso para guardar ${subject}`;
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

export function FormErrorSummary({
  errors,
  serverError,
  success,
  context = "form",
  subject = "los cambios",
}: {
  errors?: FormSummaryError[];
  serverError?: unknown;
  success?: string;
  context?: "form" | "authentication";
  /** Qué se está guardando, en minúscula y con artículo: "la vacante", "el curso". */
  subject?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hasError = Boolean(errors?.length || serverError);
  useEffect(() => {
    if (hasError) ref.current?.focus();
  }, [hasError]);

  if (success) {
    return <InlineNote tone="success" title={success} />;
  }
  if (!hasError) return null;

  return (
    <div ref={ref} tabIndex={-1} className="outline-none">
      <InlineNote
        tone="danger"
        title={serverError ? getServerFormTitle(serverError, context, subject) : "Revisa el formulario"}
      >
        {serverError ? <p>{getServerFormMessage(serverError, context)}</p> : null}
        {errors?.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error.fieldId}>
                {/* El enlace lleva el foco al campo: sin esto, en un formulario
                    largo hay que buscar a mano cuál falló. */}
                <a
                  href={`#${error.fieldId}`}
                  onClick={() => document.getElementById(error.fieldId)?.focus()}
                  className="underline underline-offset-2"
                >
                  {error.label}: {error.message}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </InlineNote>
    </div>
  );
}
