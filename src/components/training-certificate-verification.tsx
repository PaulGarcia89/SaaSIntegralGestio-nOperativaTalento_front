"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, Building2, CalendarDays, Hash, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ErrorState, InlineNote, SkeletonBlock, StatusBadge, type Tone } from "@/components/system";
import { Button } from "@/components/ui/button";
import { verifyPublicTrainingCertificate } from "@/lib/backend";
import { formatDateTime } from "@/lib/training-labels";

/**
 * Verificación pública de un certificado.
 *
 * Es la única pantalla del producto que ve alguien de fuera —un empleador
 * comprobando una credencial— y estaba pintada con diez colores hexadecimales
 * fijos (`#f3efe4`, `#315c50`, `#d9a441`…): ilegible en modo oscuro y ajena a
 * la paleta del producto. Ahora usa los tokens de grafito y ámbar, que ya dan
 * el aire de credencial impresa sin salirse del sistema.
 *
 * Además:
 * · Un certificado REVOCADO decía «Revocado» y nada más, cuando el servidor
 *   devuelve `revocationReason`. Quien verifica necesita saber por qué.
 * · «Credencial no encontrada» no explicaba qué hacer.
 * · Cargar reemplazaba la tarjeta entera por un aro girando; ahora hay una
 *   silueta con la forma del certificado.
 * · El título del curso puede venir vacío y se pintaba como un hueco.
 */

const STATUS: Record<string, { label: string; tone: Tone; note?: string }> = {
  VALID: { label: "Vigente", tone: "success" },
  EXPIRED: { label: "Vencido", tone: "warning", note: "La credencial caducó. Quien la obtuvo debe renovarla." },
  RENEWED: {
    label: "Renovado",
    tone: "info",
    note: "Existe una versión más reciente de esta credencial; esta quedó sustituida.",
  },
  REVOKED: { label: "Revocado", tone: "danger", note: "La organización emisora retiró esta credencial." },
};

export function TrainingCertificateVerification({ code }: { code: string }) {
  const query = useQuery({
    queryKey: ["public-training-certificate", code],
    queryFn: () => verifyPublicTrainingCertificate(code),
  });

  const data = query.data;
  const status = data ? (STATUS[data.status] ?? { label: data.status, tone: "neutral" as Tone }) : null;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canvas px-5 py-12">
      {/* Trama sutil: da profundidad sin competir con el texto ni costar
          repintados. Se apaga sola en modo oscuro porque usa el token de
          línea, no un color fijo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60 [background-image:radial-gradient(hsl(var(--line-strong))_1px,transparent_1px)] [background-size:22px_22px]"
      />

      <div className="relative w-full max-w-3xl">
        {query.isLoading ? (
          <div aria-busy="true" aria-live="polite" className="rounded-lg border border-line bg-surface-1 p-8">
            <span className="sr-only">Verificando la credencial</span>
            <SkeletonBlock className="h-72" />
          </div>
        ) : null}

        {query.isError ? (
          <div className="rounded-lg border border-line bg-surface-1 p-6">
            <ErrorState
              title="No encontramos esta credencial"
              detail="El código puede estar mal copiado, o la credencial ya no existe. Comprueba el código con quien te lo entregó."
              onRetry={() => void query.refetch()}
            />
            <Button asChild variant="secondary" className="mt-4 w-full">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        ) : null}

        {data && status ? (
          <article className="overflow-hidden rounded-lg border border-line bg-surface-1 shadow-lg">
            {/* Filete superior: el único adorno de la pieza. */}
            <div
              aria-hidden="true"
              className="h-2 bg-[linear-gradient(90deg,hsl(var(--accent-fill)),hsl(var(--action)),hsl(var(--accent-fill)))]"
            />

            <div className="p-7 sm:p-12">
              <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-[0.26em] text-accent-ink">
                    Credencial verificable
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-1 sm:text-4xl">
                    Certificado de aprendizaje
                  </h1>
                </div>
                <div
                  aria-hidden="true"
                  className="flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-accent-line bg-accent-fill/15"
                >
                  <Award className="size-10 text-accent-ink" />
                </div>
              </div>

              <div className="my-8 border-y border-line py-8">
                <p className="text-sm text-ink-2">Otorgado a</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-ink-1">{data.learnerName}</p>
                <p className="mt-5 text-sm text-ink-2">Por completar</p>
                <p className="mt-1 text-xl font-medium text-ink-1">
                  {data.title || "Formación sin título registrado"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Detail icon={<Building2 />} label="Organización" value={data.organization} />
                <Detail icon={<Hash />} label="Número" value={data.certificateNumber} mono />
                <Detail icon={<CalendarDays />} label="Emisión" value={formatDateTime(data.issuedAt)} />
                <Detail
                  icon={<CalendarDays />}
                  label="Vigencia"
                  value={data.expiresAt ? formatDateTime(data.expiresAt) : "Sin vencimiento"}
                />
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-surface-2 p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <ShieldCheck className="size-6 shrink-0 text-ink-2" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-medium text-ink-1">Verificación oficial</p>
                    <p className="truncate font-mono text-xs text-ink-2">{data.verificationCode}</p>
                  </div>
                </div>
                <StatusBadge tone={status.tone} label={status.label} />
              </div>

              {/* Un estado que no es «Vigente» necesita explicarse: quien
                  verifica está decidiendo si acepta la credencial. */}
              {status.note || data.revocationReason ? (
                <div className="mt-4">
                  <InlineNote
                    tone={status.tone === "danger" ? "danger" : status.tone === "warning" ? "warning" : "info"}
                    title={`Esta credencial figura como «${status.label.toLocaleLowerCase("es")}»`}
                  >
                    {data.revocationReason ? `Motivo: ${data.revocationReason}` : status.note}
                  </InlineNote>
                </div>
              ) : null}
            </div>
          </article>
        ) : null}
      </div>
    </main>
  );
}

function Detail({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-line p-4">
      <span className="mt-0.5 text-ink-3 [&>svg]:size-5" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xs text-ink-3">{label}</p>
        <p className={`mt-1 break-words font-medium text-ink-1 ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
