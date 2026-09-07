"use client";

import { useEffect, useRef } from "react";
import { ApiError } from "@/lib/backend";
import { InlineNote } from "@/components/system";
import { useLocale } from "@/components/locale-provider";

type Traducir = (key: string, params?: Record<string, string | number>) => string;

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

function getServerFormTitle(error: unknown, context: "form" | "authentication", subject: string, t: Traducir) {
  if (context === "authentication") return t("formError.signInFailed");
  if (error instanceof ApiError && error.status >= 500) return t("formError.serverCouldNotSave", { subject });
  if (error instanceof ApiError && error.status === 403) return t("formError.noPermission", { subject });
  return t("formError.checkForm");
}

export function getServerFormMessage(error: unknown, context: "form" | "authentication", t: Traducir) {
  const fallback = context === "authentication" ? t("formError.signInFallback") : t("formError.saveFallback");
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 401) return t("formError.badCredentials");
  if (error.status === 403) return t("formError.noWorkspace");
  // El mensaje del servidor NO se oculta: se antepone la orientación y se
  // conserva lo que respondió, que es lo único que dice qué campo corregir.
  if (error.status === 400) return t("formError.checkValues", { detail: error.message });
  if (error.status === 409) return t("formError.conflict");
  if (error.status === 422) return t("formError.unprocessable");
  if (error.status === 429) return t("formError.tooMany");
  if (error.status >= 500) {
    const reference = error.requestId ? t("formError.supportReference", { id: error.requestId }) : "";
    const code = error.code ? ` (${error.code})` : "";
    return t("formError.serverRejected", { status: error.status, code, message: error.message, reference });
  }
  return error.message || fallback;
}

export function FormErrorSummary({
  errors,
  serverError,
  success,
  context = "form",
  subject,
}: {
  errors?: FormSummaryError[];
  serverError?: unknown;
  success?: string;
  context?: "form" | "authentication";
  /** Qué se está guardando, en minúscula y con artículo: "la vacante", "el curso". */
  subject?: string;
}) {
  const { t } = useLocale();
  const asunto = subject ?? t("formError.defaultSubject");
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
        title={serverError ? getServerFormTitle(serverError, context, asunto, t) : t("formError.checkForm")}
      >
        {serverError ? <p>{getServerFormMessage(serverError, context, t)}</p> : null}
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
