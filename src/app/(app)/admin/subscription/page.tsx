import { PageIntro, SectionCard, DataTable } from "@/components/ui";

const billing = [
  ["Enterprise", "ATS, IA, Inventario, Admin", "342 / 500", "Activa"],
  ["Facturacion junio", "USD 3,240", "Pagado", "30 jun 2026"],
  ["Renovacion", "Anual", "Auto-renovacion", "1 jul 2026"],
];

export default function SubscriptionPage() {
  return (
    <>
      <PageIntro
        eyebrow="Configuracion de suscripcion"
        title="Plan, modulos, consumo y decisiones de upgrade."
        description="La experiencia comercial interna debe hacer visible el valor del plan y los limites operativos."
      />
      <SectionCard title="Estado de suscripcion" subtitle="Billing y modulos">
        <DataTable columns={["Concepto", "Detalle", "Estado", "Fecha"]} rows={billing} />
      </SectionCard>
    </>
  );
}
