import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetricCard, SectionCard } from "@/components/ui";

const nextSteps = [
  {
    title: "Datos personales",
    description: "Completa nombre, correo y un breve resumen profesional para iniciar tu postulación.",
    status: "En curso",
  },
  {
    title: "Documentos requeridos",
    description: "CV actualizado, identificación y certificaciones si aplican al cargo.",
    status: "Pendiente",
  },
  {
    title: "Preguntas del cargo",
    description: "La vacante puede activar preguntas dinámicas según área y modalidad.",
    status: "Siguiente",
  },
];

export default function ApplyPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 pb-10 pt-2 md:gap-10 md:pb-14">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/92 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.28)]">
        <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6 p-6 md:p-8 xl:p-10">
            <div className="space-y-4">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Aplicacion a vacantes
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                  Postulacion clara, guiada y lista para completarse desde mobile o desktop.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  Completa tu perfil en pasos simples, guarda avance cuando lo necesites y continua con los documentos y preguntas del cargo.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Paso actual" value="1 de 5" detail="Perfil y experiencia base" />
              <MetricCard label="Tiempo estimado" value="8 min" detail="Con documentos listos y formulario completo" />
              <MetricCard label="Guardado parcial" value="Activo" detail="La informacion se conserva durante el proceso" />
            </div>
          </div>

          <div className="grid gap-4 border-t border-border/60 bg-secondary/20 p-6 md:p-8 xl:border-l xl:border-t-0 xl:p-10">
            <div className="rounded-3xl border border-border/70 bg-card/95 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vacante seleccionada</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Especialista senior de adquisicion de talento
                  </h2>
                  <p className="text-sm text-muted-foreground">Miami, FL · Equipo de RRHH · Publicada esta semana</p>
                </div>
                <Badge className="rounded-full">Hibrido</Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Postulantes</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">38</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Area</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">RRHH</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Estado</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">Activa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard title="Completa tu perfil" subtitle="Paso 1 · Perfil y experiencia">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-secondary/35 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Vacante seleccionada</p>
                <p className="text-sm text-muted-foreground">Especialista senior de adquisicion de talento · Miami, FL</p>
              </div>
              <Badge variant="secondary" className="rounded-full">
                Hibrido
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="candidate-name">Nombre completo</Label>
                <Input id="candidate-name" className="h-12 rounded-2xl" placeholder="Ingresa tu nombre" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidate-email">Email</Label>
                <Input id="candidate-email" className="h-12 rounded-2xl" placeholder="tu@email.com" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="candidate-phone">Telefono</Label>
                <Input id="candidate-phone" className="h-12 rounded-2xl" placeholder="+1 (305) 555-0188" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="candidate-summary">Resumen profesional</Label>
                <textarea
                  id="candidate-summary"
                  className="min-h-40 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/40"
                  placeholder="Cuéntanos por qué eres un gran match para esta vacante"
                  rows={6}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/20 p-4">
              <p className="text-sm font-medium text-foreground">Sugerencia</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Menciona experiencia en reclutamiento, coordinación con hiring managers y manejo de procesos en empresas de servicios o salud.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-border/60 pt-2 sm:flex-row sm:justify-end">
              <Button asChild variant="secondary" className="rounded-full px-6">
                <Link href="/application-status">Ver seguimiento</Link>
              </Button>
              <Button variant="secondary" className="rounded-full px-6">
                Guardar borrador
              </Button>
              <Button className="rounded-full px-6">Siguiente paso</Button>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Tu progreso" subtitle="Resumen de candidatura">
            <div className="space-y-3">
              {nextSteps.map((step) => (
                <div key={step.title} className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{step.title}</p>
                      <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                    </div>
                    <Badge variant={step.status === "En curso" ? "default" : "secondary"} className="rounded-full">
                      {step.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Documentos recomendados" subtitle="Antes de continuar">
            <div className="space-y-3">
              {[
                "CV o resume actualizado en PDF.",
                "Documento de identidad o permiso de trabajo.",
                "Certificaciones relevantes para el cargo, si aplican.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border/70 bg-secondary/30 px-4 py-3 text-sm leading-6 text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
