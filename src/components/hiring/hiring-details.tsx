"use client";

import { useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { InlineFeedback } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { HiringReasonDialog } from "@/components/hiring/hiring-action-dialog";
import { HiringContractMetadataEditor } from "@/components/hiring/hiring-contract-metadata-editor";
import { hiringErrorMessage } from "@/components/hiring/hiring-stage-panels";
import { longDate } from "@/components/hiring/hiring-case-header";
import { cancelHiringContract } from "@/lib/backend";
import type { HiringContractDocumentDto, HiringContractDto } from "@/lib/contracts";
import {
  hiringActionLabel,
  hiringDocumentStatusLabel,
  hiringDocumentTypeLabel,
  hiringOfferStatusLabel,
  hiringStatusLabels,
  type HiringCaseState,
} from "@/lib/hiring-ux";
import { useAppStore } from "@/store/app-store";

/**
 * Sección plegable.
 *
 * Se usa `<details>` a propósito: el navegador ya le da a esto teclado, foco y
 * anuncio correcto en lectores de pantalla, y no hay forma de equivocarse con
 * `aria-expanded`. Todas nacen cerradas — la pantalla anterior mostraba las
 * seis secciones abiertas a la vez y eso es justo lo que agobia.
 */
export function HiringDisclosure({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-border-default bg-surface-elevated">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-base font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus">
        <span>
          {title}
          {hint ? <span className="mt-0.5 block text-base font-normal text-text-secondary">{hint}</span> : null}
        </span>
        <ChevronDown className="size-5 shrink-0 text-text-secondary motion-safe:transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-border-default p-4">{children}</div>
    </details>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-border-default py-3 last:border-b-0">
      <dt className="text-base text-text-secondary">{label}</dt>
      <dd className="mt-1 text-base text-text-primary">{value}</dd>
    </div>
  );
}

export function HiringSecondaryDetails({ contract, state, documents, history, onRefresh }: {
  contract: HiringContractDto;
  state: HiringCaseState;
  documents: HiringContractDocumentDto[];
  history: NonNullable<HiringContractDto["stateHistory"]>;
  onRefresh: () => Promise<void>;
}) {
  const { can } = useAppStore();
  const canUpdate = can("applications.update");
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancel = useMutation({ mutationFn: (reason: string) => cancelHiringContract(contract.id, reason), onSuccess: onRefresh });

  return (
    <section aria-labelledby="hiring-more" className="space-y-3">
      <h2 id="hiring-more" className="text-xl font-semibold text-text-primary">Más información</h2>
      <p className="text-base text-text-secondary">Aquí está el resto del expediente. Ábrelo solo si lo necesitas.</p>

      <HiringDisclosure title="Oferta laboral" hint={hiringOfferStatusLabel(contract.jobOffer?.status)}>
        {contract.jobOffer?.versions?.length ? (
          <dl>
            {contract.jobOffer.versions.map((version) => (
              <Row
                key={version.id}
                label={`Versión ${version.version}`}
                value={`${version.jobTitle} · inicio ${longDate(version.employmentStartDate) ?? "sin definir"} · válida hasta ${longDate(version.validUntil) ?? "sin vencimiento"}`}
              />
            ))}
          </dl>
        ) : (
          <p className="text-base text-text-secondary">Todavía no hay ninguna oferta vinculada a esta contratación.</p>
        )}
      </HiringDisclosure>

      <HiringDisclosure title="Documentos" hint={documents.length ? `${documents.length} en total` : "Ninguno todavía"}>
        {documents.length ? (
          <dl>
            {documents.map((document) => (
              <Row
                key={document.id}
                label={document.title}
                value={`${hiringDocumentTypeLabel(document.type)} · ${hiringDocumentStatusLabel(document.status)}${document.required ? "" : " · Opcional"}`}
              />
            ))}
          </dl>
        ) : (
          <p className="text-base text-text-secondary">No se ha pedido ningún documento.</p>
        )}
      </HiringDisclosure>

      <HiringDisclosure title="Datos de la persona">
        <dl>
          <Row label="Nombre completo" value={contract.candidate.fullName} />
          <Row label="Correo electrónico" value={contract.candidate.email} />
          <Row label="Puesto" value={contract.roleTitle ?? contract.vacancy.title} />
          <Row label="Empresa y sucursal" value={`${contract.vacancy.tenant?.name ?? "Empresa activa"} · ${contract.branch.name}`} />
        </dl>
      </HiringDisclosure>

      <HiringDisclosure title="Historial" hint={history.length ? `${history.length} movimientos` : "Sin movimientos"}>
        {history.length ? (
          <ol className="space-y-3">
            {[...history].reverse().map((event) => (
              <li key={event.id} className="border-l-2 border-border-default pl-3">
                <p className="text-base font-medium text-text-primary">{hiringActionLabel(event.action, contract.status)}</p>
                <p className="mt-0.5 text-base text-text-secondary">
                  {longDate(event.occurredAt) ?? event.occurredAt}
                  {" · "}
                  {hiringStatusLabels[event.nextState as HiringContractDto["status"]] ?? event.nextState}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-base text-text-secondary">Aún no hay movimientos registrados.</p>
        )}
      </HiringDisclosure>

      <HiringDisclosure title="Auditoría" hint="Datos técnicos para soporte">
        <dl>
          <Row label="Identificador de la contratación" value={<code className="text-base">{contract.id}</code>} />
          <Row label="Estado interno" value={<code className="text-base">{contract.status}</code>} />
          <Row label="Etapa interna" value={<code className="text-base">{contract.currentStage}</code>} />
          <Row label="Creada el" value={longDate(contract.createdAt) ?? contract.createdAt} />
          <Row label="Última actualización" value={longDate(contract.updatedAt) ?? contract.updatedAt} />
        </dl>
      </HiringDisclosure>

      {canUpdate && !state.completed && !state.cancelled ? (
        <HiringDisclosure title="Opciones avanzadas" hint="Prioridad, fecha límite y cancelación">
          <div className="space-y-5">
            <HiringContractMetadataEditor
              key={`${contract.id}-${contract.priority ?? "MEDIUM"}-${contract.deadlineAt ?? ""}`}
              contract={contract}
            />
            <div className="rounded-2xl border border-status-danger/40 bg-status-danger/[0.04] p-4">
              <h3 className="text-lg font-semibold text-text-primary">Cancelar esta contratación</h3>
              <p className="mt-1 text-base text-text-secondary">
                La contratación se cerrará y no se podrá retomar desde aquí. Tendrás que escribir el motivo.
              </p>
              <Button variant="destructive" className="mt-3" onClick={() => setCancelOpen(true)}>
                Cancelar contratación
              </Button>
              {cancel.error ? <InlineFeedback tone="danger" title="No pudimos cancelar la contratación">{hiringErrorMessage(cancel.error)}</InlineFeedback> : null}
            </div>
          </div>
        </HiringDisclosure>
      ) : null}

      <HiringReasonDialog
        open={cancelOpen}
        title="Cancelar contratación"
        description="Escribe por qué se cancela. Quedará guardado en el historial y no se podrá deshacer desde aquí."
        confirmLabel="Sí, cancelar contratación"
        onOpenChange={setCancelOpen}
        onConfirm={(reason) => cancel.mutate(reason)}
      />
    </section>
  );
}
