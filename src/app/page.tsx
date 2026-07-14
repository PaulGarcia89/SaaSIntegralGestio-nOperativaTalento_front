import Link from "next/link";
import { ArrowRight, Building2, ChartColumnBig, ShieldCheck, Sparkles } from "lucide-react";
import { dashboardKpis, marketingModules } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-14 px-4 py-4 md:px-6 md:py-6">
      <section className="overflow-hidden rounded-2xl border border-white/30 bg-[radial-gradient(circle_at_top,rgba(25,45,75,0.92),rgba(15,23,42,1)_58%)] text-white shadow-[0_30px_100px_rgba(15,23,42,0.18)] dark:bg-[radial-gradient(circle_at_top,rgba(25,45,75,0.85),rgba(15,23,42,1)_58%)]">
        <div className="flex flex-col gap-8 p-6 lg:p-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-lg font-bold">
                T
              </div>
              <div>
                <p className="font-semibold">TalentOS</p>
                <p className="text-sm text-white/65">Suite multiempresa de RRHH</p>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm text-white/75">
              <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/jobs">Empleos publicos</Link>
              </Button>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/login">Iniciar sesion</Link>
              </Button>
              <Button asChild variant="secondary" className="border-white/15 bg-white/10 text-white hover:bg-white/15">
                <Link href="/register-company">Registrar empresa</Link>
              </Button>
            </nav>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-6">
              <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                Productividad con IA, ATS, onboarding, capacitacion e inventario
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                  Un frontend SaaS listo para produccion para operaciones multiempresa de RRHH.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-white/72">
                  Construido para modulos dinamicos, RBAC, autenticacion JWT, navegacion sensible a la empresa
                  y flujos empresariales de reclutamiento, onboarding, capacitacion, productividad y
                  administracion.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Abrir plataforma
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  <Link href="/jobs">Ver portal publico</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-white/70">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Next.js + TypeScript</div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Tailwind + shadcn/ui</div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">React Query + RHF + Zod</div>
              </div>
            </div>

            <Card className="border-white/10 bg-white/7 text-white backdrop-blur-xl">
              <CardContent className="space-y-5 p-5">
                <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-white/60">Vista previa del panel empresarial</p>
                    <h2 className="text-2xl font-semibold">Pulso operativo de hoy</h2>
                  </div>
                  <Badge className="rounded-full bg-emerald-400/15 text-emerald-100">Plan empresarial</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {dashboardKpis.map((kpi) => (
                    <div key={kpi.label} className="rounded-3xl border border-white/10 bg-white/6 p-4">
                      <p className="text-sm text-white/65">{kpi.label}</p>
                      <div className="mt-3 text-3xl font-semibold">{kpi.value}</div>
                      <p className="mt-2 text-sm text-white/60">{kpi.detail}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                    <div className="mb-4 flex items-center gap-2 text-sm text-white/65">
                      <ChartColumnBig className="size-4 text-cyan-300" />
                      Embudo de reclutamiento
                    </div>
                    <div className="flex h-44 items-end gap-3">
                      {[54, 72, 68, 91, 63, 77].map((height, index) => (
                        <div key={height} className="flex-1 rounded-t-[18px] bg-gradient-to-b from-cyan-300 to-blue-500" style={{ height: `${height}%`, opacity: 1 - index * 0.06 }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                    <div className="mb-4 flex items-center gap-2 text-sm text-white/65">
                      <Sparkles className="size-4 text-cyan-300" />
                      Senales de IA
                    </div>
                    <div className="space-y-3">
                      {[
                        "12 procesos de onboarding aun esperan firma en Orlando.",
                        "Inventario bajo detectado para escaneres y tablets clinicas.",
                        "3 certificaciones regulatorias vencen hoy en operaciones.",
                      ].map((item) => (
                        <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          {
            icon: <Building2 className="size-5 text-primary" />,
            title: "Navegacion dinamica por empresa",
            copy: "Los menus, vistas y modulos se generan desde capacidades del backend, no desde supuestos estaticos.",
          },
          {
            icon: <ShieldCheck className="size-5 text-primary" />,
            title: "Experiencias segun rol",
            copy: "Superadministradores, RRHH, supervisores, reclutadores y candidatos reciben experiencias adaptadas.",
          },
          {
            icon: <Sparkles className="size-5 text-primary" />,
            title: "UX empresarial mobile first",
            copy: "Tarjetas, tablas, busqueda, dialogos y flujos estan pensados para funcionar desde movil hasta escritorio 4K.",
          },
        ].map((item) => (
          <Card key={item.title} className="border-border/70 bg-card/85">
            <CardContent className="space-y-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                {item.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{item.copy}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline" className="rounded-full">
            Modulos habilitados
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight">Un sistema de diseno, muchos flujos empresariales.</h2>
          <p className="max-w-3xl text-base leading-8 text-muted-foreground">
            ATS, onboarding, capacitacion, inventario, productividad con IA y administracion empresarial
            comparten patrones reutilizables, movimiento sutil, contraste accesible y comportamiento mobile first.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {marketingModules.map((module) => (
            <Card key={module.title} className="border-border/70 bg-card/85">
              <CardHeader>
                <Badge variant="secondary" className="w-fit rounded-full">
                  Modulo
                </Badge>
                <CardTitle>{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-muted-foreground">{module.copy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
