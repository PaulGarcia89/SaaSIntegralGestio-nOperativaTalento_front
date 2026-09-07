"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchSubscriptions, getApiErrorMessage } from "@/lib/backend";
import { moduleLabels } from "@/lib/ui-labels";
import {
  billingCycleLabel,
  formatDate,
  formatPrice,
  planTierLabel,
  subscriptionStatusInfo,
} from "@/lib/platform-labels";
import { useAppStore } from "@/store/app-store";
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
} from "@/components/system";
import { Button } from "@/components/ui/button";

/**
 * Plan contratado, visto desde la propia empresa.
 *
 * · El plan se mostraba con `capitalize` sobre el código del backend, así que
 *   se leía «Starter» —el código en inglés, con la primera letra en mayúscula
 *   por CSS—.
 * · El importe salía como `$49`, sin separadores ni moneda, bajo el rótulo
 *   «Inversión».
 * · Había un cuarto diccionario local de estados de suscripción, distinto de
 *   los otros tres del proyecto.
 * · El «sin acceso» era una tarjeta suelta que no decía quién puede
 *   concederlo.
 *
 * Se añade lo que faltaba y aquí importa más que en la vista de plataforma:
 * cuánto falta para la renovación, y un aviso claro si el pago está vencido
 * —porque desde esta pantalla no se puede hacer nada al respecto, y conviene
 * decir a quién avisar—.
 */

export default function CompanySubscriptionPage() {
  const { can, currentTenant } = useAppStore();
  const subscriptionQuery = useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
    enabled: can("admin.subscription"),
  });

  if (!can("admin.subscription")) {
    return (
      <BlockedState
        title="Sin acceso al plan contratado"
        cause="El plan y sus condiciones económicas son información de administración."
        owner="Quien administra la empresa"
        resolution="Si necesitas consultarlo, pide el permiso «Administrar suscripción»."
      />
    );
  }

  if (subscriptionQuery.isLoading) return <SkeletonRows rows={4} label="Cargando el plan contratado" />;
  if (subscriptionQuery.isError) {
    return (
      <ErrorState
        title="No fue posible cargar el plan contratado"
        detail={getApiErrorMessage(subscriptionQuery.error, "Reintenta la consulta para continuar.")}
        onRetry={() => void subscriptionQuery.refetch()}
      />
    );
  }

  const subscription = subscriptionQuery.data?.find((item) => item.tenantId === currentTenant.id);
  const status = subscription ? subscriptionStatusInfo(subscription.status) : null;
  const daysToRenewal = subscription ? daysUntil(subscription.renewalDate) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={currentTenant.name}
        title="Plan contratado"
        description="Qué está contratado, qué se paga, cuándo renueva y qué módulos cubre."
      />

      {!subscription ? (
        <EmptyState
          reason="no-records"
          title="Esta empresa no tiene ningún plan asignado"
          description="Sin plan no hay renovación ni cobro registrados. Quien administra la plataforma puede asignar uno."
        />
      ) : (
        <>
          <MetricRow>
            <Metric label="Plan" value={planTierLabel(subscription.plan)} />
            <Metric
              label="Estado del cobro"
              value={status!.label}
              detail={status!.detail}
              tone={status!.tone === "danger" ? "danger" : undefined}
            />
            <Metric
              label="Importe"
              value={formatPrice(subscription.price)}
              detail={billingCycleLabel(subscription.billingCycle)}
            />
            <Metric
              label="Próxima renovación"
              value={formatDate(subscription.renewalDate)}
              detail={
                daysToRenewal === null
                  ? undefined
                  : daysToRenewal < 0
                    ? `Venció hace ${Math.abs(daysToRenewal)} días`
                    : daysToRenewal === 0
                      ? "Es hoy"
                      : `Faltan ${daysToRenewal} días`
              }
              tone={daysToRenewal !== null && daysToRenewal < 0 ? "warning" : undefined}
            />
          </MetricRow>

          {subscription.status === "past_due" ? (
            <InlineNote tone="danger" title="El último cobro no se completó">
              El acceso de tu gente sigue abierto por ahora, pero la empresa puede quedar suspendida si el pago no se
              regulariza. Desde aquí no se puede pagar: avisa a quien administra la plataforma.
            </InlineNote>
          ) : subscription.status === "trial" ? (
            <InlineNote tone="info" title="La empresa está en periodo de prueba">
              El acceso termina cuando venza la prueba, el {formatDate(subscription.renewalDate)}. Para continuar hay
              que contratar un plan con quien administra la plataforma.
            </InlineNote>
          ) : null}

          <PageSection
            title="Qué cubre el plan"
            description="Los módulos habilitados son los que aparecen en el menú de las personas de la empresa."
            actions={
              <Button asChild variant="secondary">
                <Link href="/admin/company">Configuración de empresa</Link>
              </Button>
            }
          >
            {currentTenant.enabledModules.length === 0 ? (
              <p className="text-sm text-ink-2">
                No hay ningún módulo habilitado. Quien administra la plataforma puede activarlos.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {currentTenant.enabledModules.map((module) => (
                  <span
                    key={module}
                    className="rounded-md border border-line bg-surface-2 px-2 py-1 text-2xs text-ink-2"
                  >
                    {moduleLabels[module]}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <StatusBadge size="sm" tone={status!.tone} label={status!.label} />
              <span className="text-2xs text-ink-3">
                {currentTenant.branchCount ?? 0} sucursales · {currentTenant.employeeCount ?? 0} personas cubiertas
              </span>
            </div>
          </PageSection>
        </>
      )}
    </div>
  );
}

/** Días que faltan para una fecha, contando desde hoy a medianoche. */
function daysUntil(value: string): number | null {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
