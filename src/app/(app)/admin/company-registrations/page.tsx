"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Clock3, Mail, MapPin, X } from "lucide-react";
import {
  approveCompanyRegistrationRequest,
  fetchCompanyRegistrationRequests,
  getApiErrorMessage,
  rejectCompanyRegistrationRequest,
  type CompanyRegistrationRequestDto,
} from "@/lib/backend";
import {
  BlockedState,
  EmptyState,
  ErrorState,
  InlineNote,
  Metric,
  MetricRow,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
  type Tone,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { roleLabels } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";

/**
 * Solicitudes de alta de empresa.
 *
 * Era el archivo con peor relación defecto/tamaño de todo el producto: 42
 * líneas, de las cuales una tenía 4 800 caracteres.
 *
 * Qué cambió
 * ----------
 * · 28 colores crudos de Tailwind y dos hexadecimales fijos —`bg-white`,
 *   `text-slate-600`, `bg-slate-950/35`, un degradado `#ecfeff → #f8fafc`—
 *   hacían que la pantalla estuviera pintada solo para tema claro: en modo
 *   oscuro el modal quedaba blanco con texto gris claro encima. Ahora todo
 *   pasa por tokens.
 * · El diálogo de revisión era un `<div className="fixed inset-0">` montado a
 *   mano: sin trampa de foco, sin cierre con Escape y sin devolver el foco al
 *   cerrar. Quien navega con teclado quedaba atrapado detrás del velo.
 * · El texto que lee quien aprueba decía que se crearía «el acceso
 *   TENANT_ADMIN de forma transaccional»: un código de rol del backend y una
 *   palabra de base de datos, en la frase que sostiene la decisión.
 * · El plan se mostraba con su código (`BASIC`, `PRO`, `ENTERPRISE`).
 * · El error de guardado decía siempre «no fue posible, inténtalo
 *   nuevamente», ocultando lo que respondió el servidor.
 * · No había ningún encabezado del sistema: `<h1>` propio, badge de marca y
 *   una cifra suelta en una caja blanca.
 *
 * Lo que ya estaba bien y se conserva: es la única acción de alto impacto del
 * módulo que explicaba de antemano qué se iba a crear, y que exige un motivo
 * obligatorio al rechazar. Ese patrón se mantiene y se refuerza.
 */

const STATUS: Record<CompanyRegistrationRequestDto["status"], { label: string; tone: Tone }> = {
  PENDING: { label: "Pendiente de revisar", tone: "warning" },
  APPROVED: { label: "Aprobada", tone: "success" },
  REJECTED: { label: "Rechazada", tone: "neutral" },
};

const PLAN_LABELS: Record<CompanyRegistrationRequestDto["plan"], string> = {
  BASIC: "Básico",
  PRO: "Profesional",
  ENTERPRISE: "Empresarial",
};

export default function CompanyRegistrationsPage() {
  const { can } = useAppStore();
  const client = useQueryClient();

  const [active, setActive] = useState<CompanyRegistrationRequestDto | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");

  const registrations = useQuery({
    queryKey: ["company-registration-requests"],
    queryFn: () => fetchCompanyRegistrationRequests(),
  });

  const review = useMutation({
    mutationFn: async () => {
      if (!active || !decision) throw new Error("Selecciona una solicitud.");
      return decision === "approve"
        ? approveCompanyRegistrationRequest(active.id, notes)
        : rejectCompanyRegistrationRequest(active.id, notes);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["company-registration-requests"] });
      void client.invalidateQueries({ queryKey: ["admin-tenants"] });
      close();
    },
  });

  function open(item: CompanyRegistrationRequestDto, next: "approve" | "reject") {
    setActive(item);
    setDecision(next);
    setNotes("");
    review.reset();
  }

  function close() {
    setActive(null);
    setDecision(null);
    setNotes("");
  }

  if (!can("tenants.view")) {
    return (
      <BlockedState
        title="Sin acceso a las solicitudes"
        cause="Revisar altas de empresa es una tarea de la administración de la plataforma."
        owner="Quien administra la plataforma"
        resolution="Si necesitas revisarlas, pide el permiso «Ver empresas»."
      />
    );
  }

  const all = registrations.data ?? [];
  const pending = all.filter((item) => item.status === "PENDING");
  const approved = all.filter((item) => item.status === "APPROVED");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gobierno de la plataforma"
        title="Solicitudes de empresa"
        description="Revisa cada registro antes de crear la empresa, su suscripción, su sede principal y el acceso de quien la administrará."
      />

      {registrations.isLoading ? (
        <SkeletonRows rows={4} label="Cargando las solicitudes" />
      ) : registrations.isError ? (
        <ErrorState
          title="No fue posible cargar las solicitudes"
          detail={getApiErrorMessage(registrations.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void registrations.refetch()}
        />
      ) : (
        <>
          <MetricRow>
            <Metric
              label="Pendientes de revisar"
              value={String(pending.length)}
              tone={pending.length > 0 ? "warning" : undefined}
            />
            <Metric label="Aprobadas" value={String(approved.length)} tone="success" />
            <Metric label="Recibidas en total" value={String(all.length)} />
          </MetricRow>

          {all.length === 0 ? (
            <EmptyState
              reason="no-records"
              title="No hay solicitudes"
              description="Las altas enviadas desde el registro público aparecerán aquí para que alguien las revise."
            />
          ) : (
            <PageSection
              title={pending.length ? "Por revisar" : "Solicitudes"}
              description={
                pending.length
                  ? "Cada aprobación crea una empresa real con su suscripción y su primer acceso."
                  : "Historial de altas revisadas."
              }
            >
              <ul className="grid gap-4 xl:grid-cols-2">
                {all.map((item) => (
                  <li key={item.id} className="rounded-lg border border-line bg-surface-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-11 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-ink-2"
                        >
                          <Building2 className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-ink-1">{item.companyName}</h2>
                          <p className="text-sm text-ink-2">Plan {PLAN_LABELS[item.plan] ?? item.plan}</p>
                        </div>
                      </div>
                      <StatusBadge size="sm" tone={STATUS[item.status].tone} label={STATUS[item.status].label} />
                    </div>

                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="min-w-0 rounded-md border border-line bg-surface-2 p-3">
                        <dt className="flex items-center gap-2 text-2xs text-ink-3">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          Sede principal
                        </dt>
                        <dd className="mt-1 truncate font-medium text-ink-1">{item.branchName}</dd>
                        <dd className="truncate text-ink-2">{item.branchLocation}</dd>
                      </div>
                      <div className="min-w-0 rounded-md border border-line bg-surface-2 p-3">
                        <dt className="flex items-center gap-2 text-2xs text-ink-3">
                          <Mail className="size-3.5" aria-hidden="true" />
                          Quien la administrará
                        </dt>
                        <dd className="mt-1 truncate font-medium text-ink-1">{item.adminName}</dd>
                        <dd className="truncate text-ink-2">{item.adminEmail}</dd>
                      </div>
                    </dl>

                    <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-3">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" aria-hidden="true" />
                        {new Date(item.requestedAt).toLocaleString("es", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      {item.reviewNotes ? <span className="min-w-0 break-words">{item.reviewNotes}</span> : null}
                    </p>

                    {item.status === "PENDING" ? (
                      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                        <Button className="sm:flex-1" onClick={() => open(item, "approve")}>
                          <Check className="size-4" aria-hidden="true" />
                          Aprobar
                        </Button>
                        <Button className="sm:flex-1" variant="secondary" onClick={() => open(item, "reject")}>
                          <X className="size-4" aria-hidden="true" />
                          Rechazar
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </PageSection>
          )}
        </>
      )}

      <Dialog open={Boolean(active && decision)} onOpenChange={(next) => !next && close()}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <DialogHeader>
            <DialogTitle>
              {decision === "approve" ? "¿Aprobar la solicitud?" : "¿Rechazar la solicitud?"}
            </DialogTitle>
            <DialogDescription>{active?.companyName}</DialogDescription>
          </DialogHeader>

          {decision === "approve" ? (
            <InlineNote tone="warning" title="Qué se crea al aprobar">
              La empresa, su suscripción de prueba, la sede «{active?.branchName}» y el acceso de{" "}
              {active?.adminName} como {roleLabels.admin_empresa.toLocaleLowerCase("es")}. Se crea todo junto o no se
              crea nada: si algo falla, no queda una empresa a medias.
            </InlineNote>
          ) : (
            <InlineNote tone="info" title="Qué pasa al rechazar">
              La solicitud queda cerrada. Tu observación es lo único que quien la envió va a leer para saber qué
              corregir antes de volver a intentarlo.
            </InlineNote>
          )}

          <div>
            <Label htmlFor="registration-notes">
              Observación {decision === "reject" ? "(obligatoria)" : "(opcional)"}
            </Label>
            <textarea
              id="registration-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={
                decision === "approve"
                  ? "Aprobada para prueba de 14 días"
                  : "Indica qué debe corregir antes de volver a solicitarla"
              }
              className="min-h-28 w-full rounded-md border border-line-control bg-surface-1 p-3 text-base text-ink-1 sm:text-sm"
            />
          </div>

          {review.isError ? (
            <InlineNote tone="danger" title="No se pudo guardar la decisión">
              {getApiErrorMessage(review.error, "El servidor rechazó la operación.")}
            </InlineNote>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={close}>
              Cancelar
            </Button>
            <Button
              variant={decision === "approve" ? "default" : "destructive"}
              disabled={decision === "reject" && !notes.trim()}
              loading={review.isPending}
              loadingLabel="Guardando…"
              onClick={() => review.mutate()}
            >
              {decision === "approve" ? "Aprobar y crear la empresa" : "Rechazar la solicitud"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
