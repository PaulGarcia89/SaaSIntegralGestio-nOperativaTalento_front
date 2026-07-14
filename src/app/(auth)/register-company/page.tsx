"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { registerCompany } from "@/lib/mock-backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

const registerSchema = z.object({
  companyName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  adminName: z.string().min(2, "Ingresa el nombre del administrador"),
  plan: z.string().min(1, "Selecciona un plan"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterCompanyPage() {
  const [success, setSuccess] = useState(false);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { companyName: "", adminName: "", plan: "" },
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) => registerCompany(values),
    onSuccess: () => {
      setSuccess(true);
      toast.success("Empresa registrada correctamente");
    },
    onError: () => toast.error("Error al registrar la empresa"),
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-6 md:px-6">
      <Card className="w-full border-border/70 bg-card/85">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6 bg-slate-950 p-8 text-white md:p-10">
            <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">
              Registro empresarial
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Activa una nueva empresa con un flujo guiado de onboarding SaaS.
              </h1>
              <p className="text-base leading-8 text-white/72">
                Perfil de empresa, administrador principal, suscripcion, modulos habilitados y confirmacion final conviven en un flujo escalable para operaciones enterprise.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["1. Empresa", "2. Administrador", "3. Plan", "4. Modulos", "5. Confirmacion"].map((step) => (
                <div key={step} className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/80">
                  {step}
                </div>
              ))}
            </div>
          </div>
          <CardContent className="flex items-center p-6 md:p-10">
            {success ? (
              <div className="w-full space-y-5 text-center">
                <h2 className="text-3xl font-semibold tracking-tight">Empresa registrada</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  La empresa <strong>{form.getValues("companyName")}</strong> fue creada. Ya puedes acceder al panel.
                </p>
                <Button asChild size="lg" className="w-full">
                  <Link href="/login">Ir al inicio de sesion</Link>
                </Button>
              </div>
            ) : (
              <form
                className="w-full space-y-5"
                onSubmit={form.handleSubmit((values) => registerMutation.mutate(values))}
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight">Registrar empresa</h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Completa los datos basicos para activar tu empresa en el SaaS.
                  </p>
                </div>
                <FormField
                  label="Nombre de la empresa"
                  error={form.formState.errors.companyName?.message}
                  required
                >
                  {(fieldProps) => (
                    <Input
                      id={fieldProps.id}
                      aria-describedby={fieldProps["aria-describedby"]}
                      aria-invalid={fieldProps["aria-invalid"]}
                      placeholder="Grupo Andina"
                      {...form.register("companyName")}
                    />
                  )}
                </FormField>
                <FormField
                  label="Administrador principal"
                  error={form.formState.errors.adminName?.message}
                  required
                >
                  {(fieldProps) => (
                    <Input
                      id={fieldProps.id}
                      aria-describedby={fieldProps["aria-describedby"]}
                      aria-invalid={fieldProps["aria-invalid"]}
                      placeholder="Nombre y apellido"
                      {...form.register("adminName")}
                    />
                  )}
                </FormField>
                <FormField
                  label="Plan inicial"
                  error={form.formState.errors.plan?.message}
                  required
                >
                  {(fieldProps) => (
                    <Input
                      id={fieldProps.id}
                      aria-describedby={fieldProps["aria-describedby"]}
                      aria-invalid={fieldProps["aria-invalid"]}
                      placeholder="Empresarial"
                      {...form.register("plan")}
                    />
                  )}
                </FormField>
                <Button size="lg" type="submit" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Registrando..." : "Registrar empresa"}
                </Button>
              </form>
            )}
          </CardContent>
        </div>
      </Card>
    </main>
  );
}
