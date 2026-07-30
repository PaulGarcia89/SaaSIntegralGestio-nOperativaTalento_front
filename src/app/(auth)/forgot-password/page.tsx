import Link from "next/link";
import { IntegrationUnavailable } from "@/components/integration-state";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-5 p-6"><IntegrationUnavailable title="Recuperación de contraseña en integración" description="No confirmaremos envíos simulados. Esta función estará disponible cuando el backend emita tokens seguros y correos reales." /><Button asChild variant="secondary"><Link href="/login">Volver al inicio de sesión</Link></Button></main>;
}
