"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { sendPasswordReset } from "@/lib/mock-backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

const forgotSchema = z.object({
  email: z.email("Ingresa un correo corporativo valido"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const resetMutation = useMutation({
    mutationFn: async (values: ForgotFormValues) => sendPasswordReset(values.email),
    onSuccess: () => {
      setSent(true);
      toast.success("Enlace de recuperacion enviado");
    },
    onError: () => toast.error("Error al enviar el enlace de recuperacion"),
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 md:px-6">
      <Card className="w-full max-w-4xl border-border/70 bg-card/85">
        <div className="grid lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5 bg-slate-950 p-8 text-white md:p-10">
            <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">
              Recuperacion de acceso
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight">
              Envia un enlace seguro de recuperacion sin perder el contexto empresarial.
            </h1>
            <p className="text-base leading-8 text-white/72">
              Este flujo esta listo para soportar confirmacion de envio, enlaces vencidos, reintentos y mensajes de seguridad definidos por backend.
            </p>
          </div>
          <CardContent className="flex items-center p-6 md:p-10">
            {sent ? (
              <div className="w-full space-y-5 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">Revisa tu correo</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  Si existe una cuenta asociada a <strong>{form.getValues("email")}</strong>, recibiras un enlace de recuperacion.
                </p>
                <Button asChild size="lg" className="w-full">
                  <Link href="/login">Volver al inicio de sesion</Link>
                </Button>
              </div>
            ) : (
              <form
                className="w-full space-y-5"
                onSubmit={form.handleSubmit((values) => resetMutation.mutate(values))}
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">Recuperar acceso</h2>
                  <p className="text-sm leading-7 text-muted-foreground">Ingresa el correo corporativo asociado a tu cuenta empresarial.</p>
                </div>
                <FormField
                  label="Correo corporativo"
                  error={form.formState.errors.email?.message}
                  required
                >
                  {(fieldProps) => (
                    <Input
                      id={fieldProps.id}
                      aria-describedby={fieldProps["aria-describedby"]}
                      aria-invalid={fieldProps["aria-invalid"]}
                      placeholder="tu@empresa.com"
                      {...form.register("email")}
                    />
                  )}
                </FormField>
                <Button size="lg" type="submit" className="w-full" disabled={resetMutation.isPending}>
                  {resetMutation.isPending ? "Enviando..." : "Enviar enlace de recuperacion"}
                </Button>
              </form>
            )}
          </CardContent>
        </div>
      </Card>
    </main>
  );
}
