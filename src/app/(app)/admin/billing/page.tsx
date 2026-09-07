"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBillingOverview, getApiErrorMessage } from "@/lib/backend";
import { formatDate, formatPrice, humanizeCode, shortId } from "@/lib/platform-labels";
import { moduleLabels } from "@/lib/ui-labels";
import type { ModuleKey } from "@/lib/contracts";
import {
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

/**
 * Facturación de la empresa.
 *
 * Toda la pantalla cabía en una línea de 1 900 caracteres, y con ella los
 * defectos:
 *
 * · El importe de cada factura se imprimía como `USD 1250.5`: la moneda por
 *   delante como texto suelto y el número sin separadores. En la pantalla en
 *   la que se comprueba cuánto se pagó.
 * · El estado de la factura y el de la suscripción se mostraban con su código
 *   (`past_due`, `open`, `uncollectible`) y siempre con la misma insignia
 *   gris: una factura impagada tenía exactamente el mismo aspecto que una
 *   pagada.
 * · Cuando la factura no traía número se mostraba su UUID como si fuera el
 *   número de factura.
 * · Un importe ausente se imprimía como `-`.
 * · No se mostraba la fecha de vencimiento, que es justo lo que hay que mirar
 *   cuando algo está impagado.
 */

/**
 * Estados que devuelven las pasarelas de cobro. El tono lo decide lo que le
 * cuesta a la empresa, no el nombre del estado: `void` no es un problema,
 * `uncollectible` sí.
 */
const INVOICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  paid: { label: "Pagada", tone: "success" },
  open: { label: "Pendiente de pago", tone: "warning" },
  draft: { label: "Borrador", tone: "neutral" },
  past_due: { label: "Vencida", tone: "danger" },
  uncollectible: { label: "Incobrable", tone: "danger" },
  void: { label: "Anulada", tone: "neutral" },
};

const SUBSCRIPTION_STATUS: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Al día", tone: "success" },
  trialing: { label: "En prueba", tone: "info" },
  trial: { label: "En prueba", tone: "info" },
  past_due: { label: "Pago vencido", tone: "danger" },
  canceled: { label: "Cancelada", tone: "warning" },
  unpaid: { label: "Impagada", tone: "danger" },
};

function describe(table: Record<string, { label: string; tone: Tone }>, code: unknown, fallback: string) {
  if (typeof code !== "string" || code.trim() === "") return { label: fallback, tone: "neutral" as Tone };
  // Un estado que no reconocemos se muestra legible y en neutro: pintarlo de
  // rojo enseñaría a desconfiar del rojo.
  return table[code] ?? { label: humanizeCode(code), tone: "neutral" as Tone };
}

export default function BillingPage() {
  const billing = useQuery({ queryKey: ["billing-overview"], queryFn: fetchBillingOverview });

  if (billing.isLoading) return <SkeletonRows rows={5} label="Cargando la facturación" />;
  if (billing.isError) {
    return (
      <ErrorState
        title="No fue posible cargar la facturación"
        detail={getApiErrorMessage(billing.error, "Reintenta la consulta para continuar.")}
        onRetry={() => void billing.refetch()}
      />
    );
  }

  const data = billing.data;
  const invoices = data?.recentInvoices ?? [];
  const subscription = describe(SUBSCRIPTION_STATUS, data?.subscription?.status, "Sin suscripción");
  const unpaid = invoices.filter((invoice) => {
    const status = invoice.status ?? "";
    return status === "open" || status === "past_due" || status === "uncollectible";
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gobierno de la plataforma"
        title="Facturación"
        description="Plan contratado, quién figura como cliente de facturación y las últimas facturas emitidas."
      />

      <MetricRow>
        <Metric label="Plan" value={data?.plan?.name ?? (data?.plan?.code ? humanizeCode(data.plan.code) : "Sin plan")} />
        <Metric label="Estado del cobro" value={subscription.label} tone={subscription.tone === "danger" ? "danger" : undefined} />
        <Metric
          label="Pasarela de cobro"
          value={data?.billingCustomer?.provider ? humanizeCode(data.billingCustomer.provider) : "No configurada"}
          detail={data?.billingCustomer?.email ?? undefined}
        />
        <Metric
          label="Facturas sin pagar"
          value={String(unpaid.length)}
          tone={unpaid.length > 0 ? "warning" : undefined}
        />
      </MetricRow>

      {!data?.billingCustomer ? (
        <InlineNote tone="warning" title="No hay cliente de facturación configurado">
          Sin cliente configurado en la pasarela no se pueden emitir facturas ni cobrar renovaciones. Habla con quien
          administra la plataforma antes de que venza el periodo en curso.
        </InlineNote>
      ) : null}

      {data?.subscription?.endsAt ? (
        <InlineNote tone="info" title="La suscripción tiene fecha de fin">
          Termina el {formatDate(data.subscription.endsAt)}. A partir de esa fecha deja de renovarse sola.
        </InlineNote>
      ) : null}

      <PageSection
        title="Facturas recientes"
        description="Lo que se emitió y en qué estado quedó cada documento."
      >
        {invoices.length === 0 ? (
          <EmptyState
            reason="no-records"
            title="Todavía no hay facturas"
            description="Las facturas aparecerán aquí en cuanto la pasarela emita la primera."
          />
        ) : (
          <ul className="space-y-2">
            {invoices.map((invoice) => {
              const status = describe(INVOICE_STATUS, invoice.status, "Sin estado");
              const numbered = Boolean(invoice.number);
              return (
                <li key={invoice.id} className="rounded-lg border border-line bg-surface-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink-1">
                        {numbered ? `Factura ${invoice.number}` : "Factura sin número asignado"}
                      </p>
                      {!numbered ? (
                        <p className="text-2xs text-ink-3">Referencia interna {shortId(invoice.id)}</p>
                      ) : null}
                      <p className="mt-1 text-sm text-ink-2">
                        Emitida el {formatDate(invoice.issuedAt)}
                        {invoice.dueAt ? ` · vence el ${formatDate(invoice.dueAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="font-mono text-sm font-semibold text-ink-1 tabular-figures">
                        {formatPrice(invoice.amount, invoice.currency ?? "USD")}
                      </p>
                      <StatusBadge size="sm" tone={status.tone} label={status.label} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PageSection>

      {(data?.enabledModules ?? []).length > 0 ? (
        <PageSection title="Qué cubre el plan" description="Módulos incluidos en lo que se está pagando.">
          <div className="flex flex-wrap gap-1.5">
            {(data?.enabledModules ?? []).map((module) => (
              <span key={module} className="rounded-md border border-line bg-surface-2 px-2 py-1 text-2xs text-ink-2">
                {moduleLabels[module as ModuleKey] ?? humanizeCode(module)}
              </span>
            ))}
          </div>
        </PageSection>
      ) : null}
    </div>
  );
}
