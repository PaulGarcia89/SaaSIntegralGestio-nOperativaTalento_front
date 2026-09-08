"use client";

import { useUiText } from "@/components/ui-copy";

import { useEffect } from "react";
import { ErrorState } from "@/components/system";
import { Button } from "@/components/ui/button";

/**
 * Fallo no controlado dentro del armazón de la aplicación.
 *
 * Mismo caso que el error global: el icono vivía en un degradado
 * `from-amber-100 to-rose-100` fuera de la paleta. Aquí el armazón sigue
 * montado, así que basta con el estado de error del sistema en el hueco del
 * contenido.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const uiText = useUiText();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <ErrorState
        title={uiText("Error en esta sección")}
        detail="Ocurrió un error al cargar esta vista. El resto del producto sigue funcionando."
        requestId={error.digest}
        onRetry={reset}
      />
      <div className="flex justify-center">
        <Button asChild variant="secondary">
          <a href="/dashboard">{uiText("Volver al panel")}</a>
        </Button>
      </div>
    </div>
  );
}
