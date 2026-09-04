import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonCards, SkeletonTable, SkeletonText } from "@/components/ui/skeleton";

/**
 * Silueta de carga acorde al contenido que se espera.
 *
 * `spinner` se conserva por compatibilidad, pero prefiere una silueta: el
 * spinner centrado ocupa una altura fija y provoca un salto de diseño cuando
 * llega el contenido real, que casi siempre es más alto.
 */
export type LoadingShape = "spinner" | "table" | "cards" | "text";

function LoadingBody({ shape, title, description }: { shape: LoadingShape; title?: string; description?: string }) {
  if (shape === "table") return <SkeletonTable />;
  if (shape === "cards") return <SkeletonCards />;
  if (shape === "text") return <SkeletonText lines={4} />;

  return (
    <Card className="w-full border-dashed border-border/70 bg-card/80 shadow-sm">
      <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-4 px-6 py-10 text-center sm:px-8">
        <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold">{title ?? "Cargando información"}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {description ?? "Espera mientras consultamos los datos más recientes."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Estado de una consulta: cargando, con error o sin resultados.
 *
 * `empty` se añadió porque no existía: cada pantalla resolvía el vacío por su
 * cuenta con `InlineFeedback`, y el resultado era desigual —unas ofrecían una
 * acción para salir del vacío y otras solo un texto—. Aquí la acción es parte
 * de la firma para que sea lo normal, no la excepción.
 */
export function AsyncState({
  state,
  title,
  description,
  onRetry,
  action,
  shape = "spinner",
}: {
  state: "loading" | "error" | "empty";
  title?: string;
  description?: string;
  onRetry?: () => void;
  /** Acción sugerida para salir del estado vacío (p. ej. "Publicar una vacante"). */
  action?: ReactNode;
  shape?: LoadingShape;
}) {
  if (state === "loading") {
    return (
      <div aria-live="polite" aria-busy="true">
        <span className="sr-only">{title ?? "Cargando información"}</span>
        <LoadingBody shape={shape} title={title} description={description} />
      </div>
    );
  }

  const isEmpty = state === "empty";

  return (
    <Card className="w-full border-dashed border-border/70 bg-card/80 shadow-sm" aria-live="polite">
      <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-4 px-6 py-10 text-center sm:px-8">
        {isEmpty ? (
          <Inbox className="size-8 text-text-secondary" aria-hidden="true" />
        ) : (
          <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
        )}
        <div>
          <h2 className="text-xl font-semibold">
            {title ?? (isEmpty ? "Todavía no hay registros" : "No fue posible cargar la información")}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {description ??
              (isEmpty
                ? "Cuando exista información dentro de tu alcance, aparecerá aquí."
                : "Conservamos tu contexto. Reintenta la consulta para continuar.")}
          </p>
        </div>
        {isEmpty
          ? action
          : onRetry
            ? (
                <Button type="button" variant="secondary" onClick={onRetry}>
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Reintentar
                </Button>
              )
            : null}
      </CardContent>
    </Card>
  );
}
