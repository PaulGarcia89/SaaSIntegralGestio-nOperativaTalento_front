"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
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
    <main className="flex min-h-screen items-center justify-center px-4 py-6">
      <Card className="w-full max-w-lg border-border/70 bg-card/85">
        <CardContent className="flex flex-col items-center gap-6 px-6 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Algo salió mal</h1>
            <p className="text-sm leading-7 text-muted-foreground">
              Ocurrio un error inesperado al cargar esta vista. Puedes intentar recargar o volver al panel.
            </p>
            {error.digest ? (
              <p className="mt-2 rounded-xl bg-secondary/60 px-3 py-2 font-mono text-xs text-muted-foreground">
                {error.digest}
              </p>
            ) : null}
          </div>
          <div className="flex gap-3">
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
    </main>
  );
}
