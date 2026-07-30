import { FlaskConical } from "lucide-react";
import { InlineFeedback } from "@/components/design-system";

export const DEMO_MODE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK_BACKEND === "true";

export function DemoModeBanner() {
  if (!DEMO_MODE_ENABLED) return null;

  return (
    <div className="sticky top-0 z-[100000] flex min-h-11 items-center justify-center gap-2 border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950" role="status">
      <FlaskConical className="size-4" aria-hidden="true" />
      Modo demostración: los datos y acciones de esta sesión no son productivos.
    </div>
  );
}

export function IntegrationUnavailable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return <InlineFeedback tone="info" title={`${title} · Disponible próximamente`}><p>{description}</p><p className="mt-2 text-xs">Esta vista no muestra datos simulados ni confirma acciones sin persistencia real.</p></InlineFeedback>;
}
