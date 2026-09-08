"use client";

import { useUiText } from "@/components/ui-copy";

import { useEffect } from "react";
import { ErrorState } from "@/components/system";
import { Button } from "@/components/ui/button";

/**
 * Fallo no controlado en cualquier punto de la aplicación.
 *
 * El icono estaba dentro de un degradado `from-amber-100 to-rose-100` con su
 * variante oscura escrita a mano: dos colores crudos que no pertenecen a la
 * paleta y que no existen en ninguna otra pantalla del producto. Es además la
 * pantalla que aparece justo cuando algo ha fallado, o sea el peor momento
 * para que el producto deje de parecerse a sí mismo.
 */
export default function Error({
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
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-4 px-4 py-6">
      <ErrorState
        title={uiText("Algo salió mal")}
        detail="Ocurrió un error inesperado al cargar esta vista. Puedes reintentar o volver al panel."
        requestId={error.digest}
        onRetry={reset}
      />
      <div className="flex justify-center">
        <Button asChild variant="secondary">
          <a href="/dashboard">{uiText("Volver al panel")}</a>
        </Button>
      </div>
    </main>
  );
}
