"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, ReceiptText } from "lucide-react";
import { fetchBillingOverview } from "@/lib/backend";
import { AsyncState } from "@/components/async-state";
import { PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function BillingPage() {
  const billing = useQuery({ queryKey: ["billing-overview"], queryFn: fetchBillingOverview });
  if (billing.isLoading) return <AsyncState state="loading" title="Cargando facturación" />;
  if (billing.isError) return <AsyncState state="error" title="No fue posible cargar la facturación" onRetry={() => void billing.refetch()} />;
  const data = billing.data;
  return <div className="space-y-5"><PageHeader eyebrow="Gobierno de plataforma" title="Facturación" description="Consulta el plan, cliente de facturación y las facturas disponibles del contexto de empresa autorizado." /><div className="grid gap-4 md:grid-cols-3"><Metric icon={CreditCard} label="Plan" value={data?.plan?.name ?? data?.plan?.code ?? "Sin plan"} /><Metric icon={ReceiptText} label="Estado" value={data?.subscription?.status ?? "Sin suscripción"} /><Metric icon={CreditCard} label="Proveedor" value={data?.billingCustomer?.provider ?? "No configurado"} /></div><section className="space-y-3"><h2 className="font-semibold">Facturas recientes</h2>{data?.recentInvoices.length ? <div className="grid gap-3">{data.recentInvoices.map((invoice) => <Card key={invoice.id} level={2}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{invoice.number ?? invoice.id}</p><p className="text-sm text-text-secondary">Emitida {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(invoice.issuedAt))}</p></div><div className="flex items-center gap-3"><p className="font-semibold">{invoice.currency ?? "USD"} {invoice.amount ?? "-"}</p><Badge variant="secondary">{invoice.status ?? "Pendiente"}</Badge></div></CardContent></Card>)}</div> : <Card level={3}><CardContent className="p-6 text-sm text-text-secondary">No hay facturas registradas para este contexto.</CardContent></Card>}</section></div>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string }) { return <Card level={2}><CardContent className="p-5"><Icon className="size-5 text-primary" /><p className="mt-4 text-sm text-text-secondary">{label}</p><p className="mt-1 font-semibold">{value}</p></CardContent></Card>; }
