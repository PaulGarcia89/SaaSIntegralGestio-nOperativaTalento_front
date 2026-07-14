"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Building2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { authenticateUser } from "@/lib/mock-backend";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";

const loginSchema = z.object({
  email: z.email("Ingresa un correo corporativo valido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "ava.thompson@talentoscloud.com",
      password: "secret123",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => authenticateUser(values.email),
    onSuccess: (_, values) => {
      signIn(values.email);
      router.push("/dashboard");
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 md:px-6">
      <Card className="w-full max-w-6xl overflow-hidden border-border/70 bg-card/85">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-8 bg-[radial-gradient(circle_at_top_left,rgba(14,165,183,0.22),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.97),rgba(20,33,61,0.95))] p-8 text-white md:p-10">
            <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">
              Iniciar sesion
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
                Accede a tu espacio de trabajo por empresa con autenticacion segura y sensible al rol.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/72">
                Listo para JWT, RBAC, modulos dinamicos y futuras mejoras como SSO, MFA y resolucion de empresa por dominio.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: <Building2 className="size-5 text-cyan-200" />,
                  title: "Consciente del modelo multiempresa",
                  copy: "Cada sesion de acceso resuelve la empresa y los modulos habilitados.",
                },
                {
                  icon: <ShieldCheck className="size-5 text-cyan-200" />,
                  title: "Sensible a permisos",
                  copy: "La navegacion y las acciones se adaptan al rol autenticado en tiempo real.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/6 p-5">
                  <div className="mb-3">{item.icon}</div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-white/68">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <CardContent className="flex items-center p-6 md:p-10">
            <form
              className="w-full space-y-5"
              onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
            >
              <div className="space-y-2">
                <Badge variant="secondary" className="rounded-full">
                  Credenciales demo disponibles
                </Badge>
                <h2 className="text-3xl font-semibold tracking-tight">Bienvenido de nuevo</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  Usa un correo corporativo de prueba para entrar con otro rol y otra empresa.
                </p>
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
                    {...form.register("email")}
                  />
                )}
              </FormField>

              <FormField
                label="Contrasena"
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
                      aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
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
                  Recordar mi sesion en este dispositivo
                </Label>
              </div>

              <div className="grid gap-3">
                <Button size="lg" type="submit" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Ingresando..." : "Iniciar sesion"}
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/forgot-password">Olvide mi contrasena</Link>
                </Button>
              </div>

              <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 text-sm text-muted-foreground">
                Usuarios demo sugeridos: `ava.thompson@talentoscloud.com`, `olivia.carter@sunrisehealthfl.com`,
                `emma.collins@gulfshorelogistics.com`
              </div>
            </form>
          </CardContent>
        </div>
      </Card>
    </main>
  );
}
