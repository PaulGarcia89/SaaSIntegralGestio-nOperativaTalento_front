import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AsyncState({
  state,
  title,
  description,
  onRetry,
}: {
  state: "loading" | "error";
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const loading = state === "loading";
  return (
    <Card className="border-dashed border-border/70 bg-card/80" aria-live="polite" aria-busy={loading}>
      <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        {loading ? (
          <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
        ) : (
          <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
        )}
        <div>
          <h2 className="text-xl font-semibold">{title ?? (loading ? "Cargando información" : "No fue posible cargar la información")}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {description ?? (loading ? "Espera mientras consultamos los datos más recientes." : "Conservamos tu contexto. Reintenta la consulta para continuar.")}
          </p>
        </div>
        {!loading && onRetry ? (
          <Button type="button" variant="secondary" onClick={onRetry}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Reintentar
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
