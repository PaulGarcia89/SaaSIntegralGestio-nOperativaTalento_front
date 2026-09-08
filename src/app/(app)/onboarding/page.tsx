import { redirect } from "next/navigation";

/** La primera pantalla del módulo es su dashboard. La ruta corta se conserva por compatibilidad con enlaces guardados. */
export default function OnboardingIndexPage() {
  redirect("/onboarding/dashboard");
}
