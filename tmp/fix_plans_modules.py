"""
Planes y módulos: los últimos códigos crudos de administración.

Ninguna de las dos pantallas estaba rota; les quedaba el mismo residuo que a
las demás: códigos del backend impresos como si fueran rótulos, un importe
con el signo de dólar pegado y un motivo de bloqueo que solo se lee al pasar
el ratón —es decir, nunca en un teléfono—.
"""

import unicodedata

PLANS = "src/app/(app)/admin/plans/page.tsx"
MODULES = "src/app/(app)/admin/modules/page.tsx"


def edit(path, pairs):
    src = open(path, encoding="utf-8").read()
    original = src
    for raw_old, raw_new in pairs:
        old = unicodedata.normalize("NFC", raw_old)
        new = unicodedata.normalize("NFC", raw_new)
        count = src.count(old)
        assert count == 1, f"{path}: {count} apariciones de\n{old[:160]}"
        src = src.replace(old, new)
    assert src != original
    open(path, "w", encoding="utf-8").write(src)
    print("ok", path, len(pairs), "cambios")


edit(
    PLANS,
    [
        # ── El código del catálogo como insignia junto al nombre del plan ──
        (
            '''                  <Badge variant="secondary">{plan.code}</Badge>''',
            '''                  <Badge variant="secondary">{catalogTierLabel(plan.code)}</Badge>''',
        ),
        # ── El desplegable de código ofrecía BASIC / PRO / ENTERPRISE ──────
        (
            '''                  options={(editing ? [editing.code] : availableCodes).map((code) => ({ value: code, label: code }))}''',
            '''                  options={(editing ? [editing.code] : availableCodes).map((code) => ({
                    value: code,
                    label: `${catalogTierLabel(code)} (${code})`,
                  }))}''',
        ),
        (
            '''              <Field label="Código">''',
            '''              <Field label="Nivel del plan">''',
        ),
        # ── `$49.5` con el signo pegado y sin moneda ───────────────────────
        (
            '''function Price({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border p-3"><p className="text-xs text-text-secondary">{label}</p><p className="mt-1 text-xl font-semibold">${value.toLocaleString("es-ES")}</p></div>;
}''',
            '''function Price({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-figures">{formatPrice(value)}</p>
    </div>
  );
}

/**
 * El catálogo del backend usa BASIC/PRO/ENTERPRISE y la suscripción usa
 * starter/growth/enterprise. Aquí se muestra el nombre en español del nivel,
 * dejando el código solo donde de verdad hace falta elegirlo.
 */
function catalogTierLabel(code: PlanAdminDto["code"]): string {
  const tier = code === "BASIC" ? "starter" : code === "PRO" ? "growth" : "enterprise";
  return planTierLabel(tier);
}''',
        ),
        # ── El realce del plan PRO estaba escrito a mano ───────────────────
        (
            '''          <Card key={plan.id} level={plan.code === "PRO" ? 1 : 2} className="flex flex-col">''',
            '''          <Card key={plan.id} level={2} className="flex min-w-0 flex-col">''',
        ),
        # ── «1 suscripciones», y el motivo del bloqueo solo en un `title` ──
        (
            '''              <div className="mt-auto flex items-center justify-between border-t pt-4">
                <span className="text-sm text-text-secondary">{plan.subscriptions} suscripciones</span>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={plan.subscriptions > 0 || remove.isPending}
                  title={plan.subscriptions > 0 ? "El plan tiene suscripciones asociadas" : undefined}''',
            '''              <div className="mt-auto space-y-2 border-t pt-4">
                {plan.subscriptions > 0 ? (
                  <p className="text-xs text-text-secondary">
                    No se puede eliminar: {plan.subscriptions === 1
                      ? "una empresa lo tiene contratado"
                      : `${plan.subscriptions} empresas lo tienen contratado`}.
                  </p>
                ) : (
                  <p className="text-xs text-text-secondary">Ninguna empresa lo tiene contratado.</p>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={plan.subscriptions > 0 || remove.isPending}''',
        ),
        # ── El diálogo no respetaba la zona segura del iPhone ─────────────
        (
            '''        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">''',
            '''        <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">''',
        ),
        # ── Sin acceso: un StateCard que no dice quién lo concede ─────────
        (
            '''    return <StateCard tone="restricted" title="Sin acceso al catálogo de planes" description="Tu rol no puede administrar precios, módulos ni límites globales." />;''',
            '''    return (
      <BlockedState
        title="Sin acceso al catálogo de planes"
        cause="Los precios y los topes de cada plan alcanzan a todas las empresas de la plataforma."
        owner="Quien administra la plataforma"
        resolution="Si necesitas consultarlo, pide el permiso «Administrar suscripciones»."
      />
    );''',
        ),
        (
            '''import { InlineFeedback, PageHeader } from "@/components/design-system";''',
            '''import { InlineFeedback, PageHeader } from "@/components/design-system";
import { BlockedState } from "@/components/system";
import { formatPrice, planTierLabel } from "@/lib/platform-labels";''',
        ),
    ],
)

edit(
    MODULES,
    [
        # ── El UUID del tenant como nombre de empresa ─────────────────────
        (
            '''                  render: (assignment) =>
                    tenantsQuery.data?.find((tenant) => tenant.id === assignment.tenantId)?.name ?? assignment.tenantId,''',
            '''                  render: (assignment) =>
                    tenantsQuery.data?.find((tenant) => tenant.id === assignment.tenantId)?.name ??
                    `Empresa sin cargar (${shortId(assignment.tenantId)})`,''',
        ),
        # ── El plan y el estado de la empresa, en código ──────────────────
        (
            '''                    { title: "Origen", description: moduleSourceLabels[selectedAssignment.source], badge: selectedAssignment.source },
                    { title: "Plan de empresa", description: selectedTenant?.plan ?? "Sin plan", badge: selectedTenant?.status ?? "Sin estado" },''',
            '''                    { title: "Origen", description: moduleSourceLabels[selectedAssignment.source] },
                    {
                      title: "Plan de la empresa",
                      description: selectedTenant ? planTierLabel(selectedTenant.plan) : "Sin plan",
                      badge: tenantStatusInfo(selectedTenant?.status ?? "active").label,
                    },''',
        ),
        # ── «activacion» sin tilde, y una descripción que no dice el riesgo ─
        (
            '''        description="Consulta y modifica los módulos habilitados por empresa, de acuerdo con el plan o activacion manual."''',
            '''        description="Qué módulos ve cada empresa. Apagar uno lo quita del menú de todas sus personas de inmediato; los datos se conservan."''',
        ),
        # ── Sin acceso ────────────────────────────────────────────────────
        (
            '''      <StateCard
        tone="restricted"
        title="Sin acceso a módulos"
        description="El rol actual no puede configurar módulos por empresa."
      />''',
            '''      <BlockedState
        title="Sin acceso a los módulos por empresa"
        cause="Habilitar o apagar un módulo afecta al menú de todas las personas de una empresa."
        owner="Quien administra la plataforma"
        resolution="Si necesitas consultarlo, pide el permiso «Configuración de empresa»."
      />''',
        ),
        # ── La rejilla con la tabla dentro, sin min-w-0 ───────────────────
        (
            '''        <div className="grid gap-x-6 gap-y-8 2xl:gap-x-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">''',
            '''        <div className="grid min-w-0 gap-x-6 gap-y-8 2xl:gap-x-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] [&>*]:min-w-0">''',
        ),
        (
            '''import { Badge } from "@/components/ui/badge";''',
            '''import { Badge } from "@/components/ui/badge";
import { BlockedState } from "@/components/system";
import { planTierLabel, shortId, tenantStatusInfo } from "@/lib/platform-labels";''',
        ),
    ],
)
