import Link from "next/link";
import { EmptyState } from "@/components/system";
import { Button } from "@/components/ui/button";

/**
 * Ruta inexistente.
 *
 * El icono estaba dentro de un degradado `from-cyan-100 to-blue-100`: cian y
 * azul, dos colores que no aparecen en ninguna otra parte del producto y que
 * no son los de la marca elegida.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-4 px-4 py-6">
      <EmptyState
        reason="no-records"
        title="Página no encontrada"
        description="La dirección que abriste no existe o se movió. Comprueba el enlace o vuelve al panel."
        action={
          <Button asChild>
            <Link href="/dashboard">Volver al panel</Link>
          </Button>
        }
      />
    </main>
  );
}
