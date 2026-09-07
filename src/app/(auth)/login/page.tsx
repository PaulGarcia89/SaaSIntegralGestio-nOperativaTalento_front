"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { authenticateUser } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { DEMO_MODE_ENABLED } from "@/components/integration-state";
import { FormErrorSummary } from "@/components/form-error-summary";
import { LanguageSelector } from "@/components/language-selector";
import { useLocale } from "@/components/locale-provider";

const loginSchema = z.object({
  email: z.email("Ingresa un correo corporativo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) =>
      authenticateUser({
        email: values.email,
        password: values.password,
      }),
    onSuccess: () => {
      const requestedPath = new URLSearchParams(window.location.search).get("returnTo");
      const destination =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : "/dashboard";

      // Conserva el token de acceso en memoria durante el cambio de ruta. Un
      // recargo completo forzaría un intercambio innecesario de la cookie de actualización.
      router.replace(destination);
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 md:px-6">
      <div className="w-full max-w-6xl">
      <div className="mb-4 flex justify-end"><LanguageSelector /></div>
      <Card className="w-full max-w-6xl overflow-hidden border-border/70 bg-card/85">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-8 bg-[radial-gradient(circle_at_top_left,hsl(38_94%_52%_/_0.22),transparent_30%),linear-gradient(180deg,hsl(213_40%_10%_/_0.97),hsl(213_34%_15%_/_0.95))] p-8 text-surface-dark-ink md:p-10">
            <Badge className="w-fit rounded-full bg-surface-dark-ink/10 text-surface-dark-ink hover:bg-surface-dark-ink/10">
              Iniciar sesión
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
                Todo tu trabajo, en el contexto correcto desde el primer momento.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-surface-dark-ink/72">
                Accede de forma segura a las personas, tareas y operaciones que te corresponden.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: <Building2 className="size-5 text-accent-fill" />,
                  title: "Tu empresa y sucursal correctas",
                  copy: "Al entrar verás claramente el espacio de trabajo en el que estás operando.",
                },
                {
                  icon: <ShieldCheck className="size-5 text-accent-fill" />,
                  title: "Una experiencia adaptada a ti",
                  copy: "La navegación muestra únicamente las tareas y herramientas que puedes utilizar.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-surface-dark-ink/10 bg-surface-1/6 p-5">
                  <div className="mb-3">{item.icon}</div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-surface-dark-ink/68">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <CardContent className="flex items-center p-6 md:p-10">
            <form
              method="post"
              className="w-full space-y-5"
              onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
            >
              <FormErrorSummary
                errors={Object.entries(form.formState.errors).map(([field, issue]) => ({ fieldId: `login-${field}`, label: field === "email" ? "Correo corporativo" : "Contraseña", message: issue?.message ?? "Revisa este campo" }))}
                serverError={loginMutation.error}
                context="authentication"
              />
              <div className="space-y-2">
                <Badge variant="secondary" className="rounded-full">Acceso seguro</Badge>
                <h2 className="text-3xl font-semibold tracking-tight">Bienvenido de nuevo</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  Ingresa con el correo y la contraseña de tu organización.
                </p>
              </div>

              <FormField
                id="login-email"
                label={t("auth.email")}
                error={form.formState.errors.email?.message}
                required
              >
                {(fieldProps) => (
                  <Input
                    id={fieldProps.id}
                    aria-describedby={fieldProps["aria-describedby"]}
                    aria-invalid={fieldProps["aria-invalid"]}
                    {...form.register("email")}
                  />
                )}
              </FormField>

              <FormField
                id="login-password"
                label={t("auth.password")}
                error={form.formState.errors.password?.message}
                required
              >
                {(fieldProps) => (
                  <div className="relative">
                    <Input
                      id={fieldProps.id}
                      aria-describedby={fieldProps["aria-describedby"]}
                      aria-invalid={fieldProps["aria-invalid"]}
                      type={showPassword ? "text" : "password"}
                      className="pr-11"
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                )}
              </FormField>

              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="size-4 rounded border-border accent-primary"
                />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                  {t("auth.remember")}
                </Label>
              </div>

              <div className="grid gap-3">
                <Button size="lg" type="submit" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? t("actions.loading") : t("auth.login")}
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/forgot-password">{t("auth.forgotPassword")}</Link>
                </Button>
              </div>

              {DEMO_MODE_ENABLED ? <Button type="button" variant="secondary" className="w-full" onClick={() => { form.setValue("email", "ava.thompson@talentoscloud.com"); form.setValue("password", "ChangeMe123!"); }}>Entrar al entorno de prueba local</Button> : null}
              <Button asChild type="button" variant="ghost" className="w-full">
                <Link href="/">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Volver al sitio público
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">¿Necesitas ayuda? Contacta al administrador de tu empresa o al equipo de soporte.</p>
            </form>
          </CardContent>
        </div>
      </Card>
      </div>
    </main>
  );
}
