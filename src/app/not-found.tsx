import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6">
      <Card className="w-full max-w-lg border-border/70 bg-card/85">
        <CardContent className="flex flex-col items-center gap-6 px-6 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30">
            <FileQuestion className="size-8 text-brand" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Página no encontrada</h1>
            <p className="text-sm leading-7 text-muted-foreground">
              La ruta que intentas acceder no existe o fue movida. Verifica la URL o regresa al panel principal.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard">Volver al panel</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
