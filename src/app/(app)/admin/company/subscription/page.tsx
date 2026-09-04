"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, CreditCard, PackageCheck, type LucideIcon } from "lucide-react";
import { fetchSubscriptions } from "@/lib/backend";
import { moduleLabels } from "@/lib/ui-labels";
import { useAppStore } from "@/store/app-store";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const statusLabel = { active: "Activa", trial: "En prueba", past_due: "Pago pendiente" } as const;

export default function CompanySubscriptionPage() {
  const { can, currentTenant } = useAppStore();
  const subscriptionQuery = useQuery({ queryKey: ["subscriptions"], queryFn: fetchSubscriptions, enabled: can("admin.subscription") });

  if (!can("admin.subscription")) {
    return <Card level={2}><CardContent className="p-6"><h1 className="font-semibold">Sin acceso a la suscripción</h1><p className="mt-2 text-sm text-text-secondary">Tu perfil no puede consultar el plan ni las condiciones de la empresa.</p></CardContent></Card>;
  }
  if (subscriptionQuery.isLoading) return <AsyncState state="loading" title="Cargando suscripción" />;
  if (subscriptionQuery.isError) return <AsyncState state="error" title="No fue posible cargar la suscripción" onRetry={() => void subscriptionQuery.refetch()} />;

  const subscription = subscriptionQuery.data?.find((item) => item.tenantId === currentTenant.id);
  const renewal = subscription ? new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(new Date(subscription.renewalDate)) : null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administración" title="Suscripción de mi empresa" description="Consulta el plan vigente, módulos habilitados y próxima renovación." />
      {!subscription ? (
        <Card level={2}><CardContent className="space-y-3 p-6"><CreditCard className="size-6 text-brand" /><h2 className="font-semibold">No hay una suscripción asociada</h2><p className="text-sm text-text-secondary">La empresa todavía no tiene un plan asignado. Contacta a la administración de la plataforma para regularizarla.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card level={2} className="lg:col-span-2"><CardContent className="space-y-6 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-text-secondary">Plan actual</p><h2 className="mt-1 text-2xl font-semibold capitalize">{subscription.plan}</h2></div><Badge variant={subscription.status === "active" ? "success" : subscription.status === "past_due" ? "destructive" : "secondary"}>{statusLabel[subscription.status]}</Badge></div><div className="grid gap-4 sm:grid-cols-3"><Summary icon={CreditCard} label="Ciclo" value={subscription.billingCycle === "annual" ? "Anual" : "Mensual"} /><Summary icon={CalendarClock} label="Renovación" value={renewal ?? "Sin fecha"} /><Summary icon={PackageCheck} label="Inversión" value={`$${subscription.price}`} /></div></CardContent></Card>
          <Card level={2}><CardContent className="space-y-3 p-6"><CheckCircle2 className="size-6 text-brand" /><h2 className="font-semibold">Módulos habilitados</h2><div className="flex flex-wrap gap-2">{currentTenant.enabledModules.map((module) => <Badge key={module} variant="secondary">{moduleLabels[module]}</Badge>)}</div><Button asChild variant="secondary" className="mt-2 w-full"><Link href="/admin/company">Configuración de empresa</Link></Button></CardContent></Card>
        </div>
      )}
    </div>
  );
}

function Summary({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="rounded-xl bg-muted/60 p-4"><Icon className="size-4 text-brand" aria-hidden="true" /><p className="mt-3 text-xs text-text-secondary">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
