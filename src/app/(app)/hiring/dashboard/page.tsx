import { redirect } from "next/navigation";

/**
 * Reclutamiento tiene UN dashboard. El panel de contratación vive dentro de
 * `/ats/dashboard` (sección «Contratación»); esta ruta se conserva por
 * compatibilidad y lleva allí.
 */
export default function HiringDashboardRedirect() {
  redirect("/ats/dashboard#contrataciones");
}
