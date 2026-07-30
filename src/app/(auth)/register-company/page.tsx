import Link from "next/link";
import { IntegrationUnavailable } from "@/components/integration-state";
import { Button } from "@/components/ui/button";

export default function RegisterCompanyPage() {
  return <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-5 p-6"><IntegrationUnavailable title="Registro de empresa en integración" description="La creación permanecerá bloqueada hasta que empresa, administrador y suscripción se guarden de forma transaccional." /><Button asChild variant="secondary"><Link href="/login">Volver al inicio de sesión</Link></Button></main>;
}
