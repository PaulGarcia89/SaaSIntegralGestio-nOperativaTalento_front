import { PageIntro, SectionCard, DataTable } from "@/components/ui";

const permissions = [
  ["Admin SaaS", "Completo", "Global", "Critico"],
  ["Admin Empresa", "Usuarios, reportes, modulos", "Tenant", "Alto"],
  ["RRHH", "ATS, onboarding, training", "Modulo", "Medio"],
  ["Empleado", "Perfil, cursos, documentos", "Propio", "Bajo"],
];

export default function RolesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Roles y permisos"
        title="Matriz clara para permisos heredados y reglas personalizadas."
        description="El diseño reduce errores de configuracion y ayuda a entender el impacto de cada cambio."
      />
      <SectionCard title="Matriz de permisos" subtitle="Seguridad">
        <DataTable columns={["Rol", "Capacidades", "Alcance", "Riesgo"]} rows={permissions} />
      </SectionCard>
    </>
  );
}
