"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl items-start justify-center px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full border-border/70 bg-card/90 shadow-xl shadow-slate-900/5">
        <CardContent className="grid gap-6 px-6 py-8 text-center sm:px-8 sm:py-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">Error en esta sección</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Ocurrió un error al cargar esta vista. Puedes intentar recargar o volver al panel principal.
            </p>
            {error.digest ? (
              <p className="mx-auto max-w-md rounded-xl bg-secondary/60 px-3 py-2 font-mono text-xs text-muted-foreground">
                {error.digest}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={reset}>
              <RefreshCw className="size-4" />
              Reintentar
            </Button>
            <Button asChild variant="secondary">
              <a href="/dashboard">Volver al panel</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
