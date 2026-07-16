"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BellRing,
  Clock3,
  FileText,
  MoveRight,
  SearchCheck,
} from "lucide-react";
import { fetchCandidateApplications } from "@/lib/mock-backend";
import { MetricCard, SectionCard } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function timelineTone(status: "completed" | "current" | "upcoming") {
  if (status === "completed") {
    return "bg-emerald-500 text-white";
  }
  if (status === "current") {
    return "bg-primary text-primary-foreground";
  }
  return "bg-secondary text-muted-foreground";
}

function documentBadge(status: "received" | "pending" | "required") {
  if (status === "received") return { label: "Recibido", variant: "secondary" as const };
  if (status === "pending") return { label: "Pendiente", variant: "outline" as const };
  return { label: "Requerido", variant: "outline" as const };
}

export default function ApplicationStatusPage() {
  const applicationsQuery = useQuery({
    queryKey: ["candidate-applications"],
    queryFn: fetchCandidateApplications,
  });
  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const [selectedId, setSelectedId] = useState("application-1");

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedId) ?? applications[0],
    [applications, selectedId],
  );

  if (applicationsQuery.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-10 pt-2">
        <SectionCard title="Cargando seguimiento" subtitle="Estado de candidatura">
          Obteniendo la línea de tiempo, documentos y mensajes de tu proceso.
        </SectionCard>
      </div>
    );
  }

  if (!selectedApplication) {
    return (
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-10 pt-2">
        <SectionCard title="No encontramos postulaciones" subtitle="Seguimiento del candidato">
          <div className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">
              Aun no hay procesos visibles en esta demo. Puedes explorar vacantes activas o iniciar una nueva postulacion.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/jobs">Ver vacantes</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/apply">Ir a postularme</Link>
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  const pendingDocuments = selectedApplication.documents.filter((document) => document.status !== "received");
  const unreadMessages = selectedApplication.messages.filter((message) => message.unread).length;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 pb-10 pt-2 md:gap-10 md:pb-14">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/92 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.28)]">
        <div className="grid gap-0 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-6 p-6 md:p-8 xl:p-10">
            <div className="space-y-4">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Seguimiento de candidatura
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                  Consulta el estado de tu proceso, próximos pasos y documentos pendientes en un solo lugar.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  Esta vista resume el avance de tu candidatura, la comunicación del equipo y las acciones que faltan para continuar.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Estado actual" value={selectedApplication.status} detail={selectedApplication.stage} />
              <MetricCard label="Progreso" value={`${selectedApplication.progress}%`} detail="Avance estimado dentro del proceso" />
              <MetricCard label="Mensajes nuevos" value={`${unreadMessages}`} detail="Actualizaciones del equipo reclutador" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="sm:min-w-48">
                <Link href="/jobs">Seguir explorando vacantes</Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="sm:min-w-48">
                <Link href="/apply">Actualizar postulacion</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 border-t border-border/60 bg-secondary/20 p-6 md:p-8 xl:border-l xl:border-t-0 xl:p-10">
            <div className="rounded-3xl border border-border/70 bg-card/95 p-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Consulta una postulacion</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{selectedApplication.candidateName}</h2>
                  <p className="text-sm text-muted-foreground">
                    Referencia {selectedApplication.reference} · {selectedApplication.tenantName}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Proceso visible</p>
                  <Select value={selectedApplication.id} onValueChange={setSelectedId}>
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((application) => (
                        <SelectItem key={application.id} value={application.id}>
                          {application.candidateName} · {application.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Vacante</p>
                    <p className="mt-2 font-medium text-foreground">{selectedApplication.role}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Ubicacion</p>
                    <p className="mt-2 font-medium text-foreground">{selectedApplication.location}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/20 p-4">
                  <p className="text-sm font-medium text-foreground">Proximo paso</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{selectedApplication.nextStep}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard title="Linea de tiempo de candidatura" subtitle="Estado del proceso">
          <div className="space-y-4">
            {selectedApplication.timeline.map((item, index) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`flex size-10 items-center justify-center rounded-2xl text-sm font-semibold ${timelineTone(item.status)}`}>
                    {index + 1}
                  </div>
                  {index < selectedApplication.timeline.length - 1 ? (
                    <div className="mt-2 h-full w-px min-h-10 bg-border/80" />
                  ) : null}
                </div>
                <div className="flex-1 rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant={item.status === "current" ? "default" : "secondary"} className="rounded-full">
                      {item.date}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Documentos pendientes" subtitle="Checklist del candidato">
            <div className="space-y-3">
              {selectedApplication.documents.map((document) => {
                const badge = documentBadge(document.status);
                return (
                  <div key={document.id} className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{document.name}</p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {document.dueDate ? `Fecha sugerida: ${document.dueDate}` : "Documento cargado correctamente."}
                        </p>
                      </div>
                      <Badge variant={badge.variant} className="rounded-full">
                        {badge.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {pendingDocuments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/15 p-4 text-sm leading-6 text-muted-foreground">
                  No tienes documentos pendientes por ahora.
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Mensajes y notificaciones" subtitle="Comunicacion del proceso">
            <div className="space-y-3">
              {selectedApplication.messages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-border/70 bg-card/90 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{message.title}</p>
                        {message.unread ? (
                          <Badge className="rounded-full px-2.5 py-0.5">Nuevo</Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">De: {message.from}</p>
                      <p className="text-sm leading-7 text-muted-foreground">{message.body}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{message.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-4">
        {[
          {
            icon: <SearchCheck className="size-5 text-primary" />,
            title: "Estado visible",
            detail: "Consulta en qué etapa está tu candidatura sin depender de correo o llamadas.",
          },
          {
            icon: <Clock3 className="size-5 text-primary" />,
            title: "Próximos pasos",
            detail: "Cada proceso resume qué falta y cuándo deberías esperar una actualización.",
          },
          {
            icon: <FileText className="size-5 text-primary" />,
            title: "Documentos pendientes",
            detail: "El candidato sabe qué soportes faltan antes de continuar a entrevista u oferta.",
          },
          {
            icon: <BellRing className="size-5 text-primary" />,
            title: "Mensajes del equipo",
            detail: "La comunicación del reclutador queda visible dentro del mismo seguimiento.",
          },
        ].map((item) => (
          <SectionCard key={item.title} title={item.title} className="h-full">
            <div className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                {item.icon}
              </div>
              <p className="text-sm leading-7 text-muted-foreground">{item.detail}</p>
            </div>
          </SectionCard>
        ))}
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.22)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="rounded-full">
              Siguiente mejora
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              El seguimiento ya está listo para evolucionar hacia portal de candidato completo.
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
              La siguiente iteración natural sería permitir autenticación del candidato, carga de documentos desde esta misma pantalla y respuesta directa a mensajes del reclutador.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/apply">
              Continuar postulacion
              <MoveRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
