"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useUiText } from "@/components/ui-copy";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TAP_TARGET } from "@/components/simple/simple-ui";
import { fetchInterviewerProfiles, getApiErrorMessage, scheduleRecruitmentInterview } from "@/lib/backend";
import type { ApplicationInterviewType, VacancyApplicationDto } from "@/lib/contracts";
import { formatApplicationDate } from "@/lib/applications";
import { cn } from "@/lib/utils";

/**
 * Agendar una entrevista desde la ficha simple.
 *
 * Antes, en la fase de entrevista el único camino era un enlace a la ficha
 * avanzada: quien gestionaba el proceso desde la ficha simple tenía que salir
 * de la pantalla, encontrar la sección correcta en una página con diez bloques
 * más y volver. El paso siguiente del proceso vivía fuera de la pantalla que
 * dice cuál es el paso siguiente.
 *
 * Aquí se agenda en el sitio, con el mismo endpoint y el mismo contrato que
 * usa la ficha avanzada (`POST /recruitment/interviews`): no hay un segundo
 * camino con reglas propias, solo el mismo formulario donde hace falta.
 *
 * Los campos van con etiqueta visible, controles altos y texto de 16 px: el
 * formulario se rellena con una mano en un teléfono, que es donde se agenda
 * cuando se acaba de hablar con la persona.
 */

const CAMPO = "w-full rounded-xl border border-line-control bg-surface-1 px-3 text-base text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus";

function proximaFecha() {
  const fecha = new Date(Date.now() + 24 * 60 * 60 * 1000);
  fecha.setHours(10, 0, 0, 0);
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60_000).toISOString();
  return { dia: local.slice(0, 10), hora: local.slice(11, 16) };
}

export function ScheduleInterviewPanel({ application, canSchedule }: { application: VacancyApplicationDto; canSchedule: boolean }) {
  const uiText = useUiText();
  const { t } = useLocale();
  const client = useQueryClient();
  const [inicial] = useState(proximaFecha);
  const [ahora, setAhora] = useState(() => Date.now());

  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    if (!abierto) return;
    const timer = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [abierto]);
  const [titulo, setTitulo] = useState(`Entrevista · ${application.vacancy.title}`);
  const [tipo, setTipo] = useState<ApplicationInterviewType>("VIRTUAL");
  const [entrevistador, setEntrevistador] = useState("");
  const [dia, setDia] = useState(inicial.dia);
  const [hora, setHora] = useState(inicial.hora);
  const [duracion, setDuracion] = useState("60");
  const [enlace, setEnlace] = useState("");
  const [lugar, setLugar] = useState("");

  const zona = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const entrevistadores = useQuery({ queryKey: ["interviewer-profiles"], queryFn: fetchInterviewerProfiles, enabled: abierto && canSchedule });

  const agendadas = application.interviews ?? [];
  const inicio = useMemo(() => new Date(`${dia}T${hora}`), [dia, hora]);
  const enElPasado = Number.isFinite(inicio.getTime()) && inicio.getTime() < ahora;
  const listo = Boolean(entrevistador) && titulo.trim().length > 0 && Number.isFinite(inicio.getTime());

  const agendar = useMutation({
    mutationFn: () => {
      const fin = new Date(inicio.getTime() + Number(duracion) * 60_000);
      return scheduleRecruitmentInterview({
        applicationId: application.id,
        interviewerUserId: entrevistador,
        title: titulo.trim(),
        type: tipo,
        timezone: zona,
        startsAt: inicio.toISOString(),
        endsAt: fin.toISOString(),
        meetingUrl: tipo === "VIRTUAL" ? enlace.trim() || undefined : undefined,
        location: tipo === "PRESENTIAL" ? lugar.trim() || undefined : undefined,
      });
    },
    onSuccess: async () => {
      setAbierto(false);
      toast.success(uiText("Entrevista agendada."));
      await client.invalidateQueries({ queryKey: ["application", application.id] });
      await client.invalidateQueries({ queryKey: ["recruitment-interviews"] });
    },
  });

  // Sin permiso y sin nada agendado no queda nada que enseñar: se evita
  // dibujar un separador que no separa nada.
  if (!canSchedule && !agendadas.length) return null;

  return (
    <div className="mt-4 border-t border-line pt-4">
      {agendadas.length ? (
        <ul className="mb-4 space-y-2">
          {agendadas.map((entrevista) => (
            <li key={entrevista.id} className="rounded-xl border border-line bg-surface-2 p-3">
              <p className="font-medium text-ink-1">{entrevista.title}</p>
              <p className="mt-0.5 text-sm text-ink-2">
                {formatApplicationDate(entrevista.startsAt)} · {entrevista.timezone}
              </p>
              <p className="text-sm text-ink-2">
                {uiText("Entrevista con {{persona}}", {
                  persona: entrevista.interviewer ? `${entrevista.interviewer.firstName} ${entrevista.interviewer.lastName}` : t("profile.unassigned"),
                })}
              </p>
              {entrevista.meetingUrl ? (
                <a
                  href={entrevista.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm text-ink-1 underline underline-offset-4"
                >
                  <ExternalLink className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
                  {uiText("Abrir la reunión")}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {canSchedule ? (
        <>
          <Button type="button" variant="secondary" className={cn(TAP_TARGET, "w-full sm:w-auto")} onClick={() => setAbierto(true)}>
            <CalendarPlus className="size-4" aria-hidden="true" />
            {agendadas.length ? uiText("Agendar otra entrevista") : uiText("Agendar una entrevista")}
          </Button>
          <p className="mt-2 text-sm text-ink-2">
            {uiText("Elige día, hora y quién entrevista. Al terminar, vuelve aquí para mover a la persona de fase.")}
          </p>
        </>
      ) : null}

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{uiText("Agendar una entrevista")}</DialogTitle>
            <DialogDescription>
              {uiText("Se avisa por correo a la persona candidata y a quien entrevista.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="block space-y-2 text-base font-medium text-ink-1" htmlFor="entrevista-titulo">
              {uiText("Nombre de la entrevista")}
              <input
                id="entrevista-titulo"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                className={cn(TAP_TARGET, CAMPO, "font-normal")}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-base font-medium text-ink-1" htmlFor="entrevista-dia">
                {uiText("Día")}
                <input
                  id="entrevista-dia"
                  type="date"
                  value={dia}
                  onChange={(event) => setDia(event.target.value)}
                  className={cn(TAP_TARGET, CAMPO, "font-normal")}
                />
              </label>
              <label className="block space-y-2 text-base font-medium text-ink-1" htmlFor="entrevista-hora">
                {uiText("Hora")}
                <input
                  id="entrevista-hora"
                  type="time"
                  value={hora}
                  onChange={(event) => setHora(event.target.value)}
                  className={cn(TAP_TARGET, CAMPO, "font-normal")}
                />
              </label>
            </div>

            {enElPasado ? (
              <p className="rounded-lg border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-sm text-ink-1">
                {uiText("Esa fecha y hora ya pasaron.")}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-base font-medium text-ink-1" htmlFor="entrevista-duracion">
                {uiText("Cuánto dura")}
                <select
                  id="entrevista-duracion"
                  value={duracion}
                  onChange={(event) => setDuracion(event.target.value)}
                  className={cn(TAP_TARGET, CAMPO, "font-normal")}
                >
                  <option value="30">{uiText("30 minutos")}</option>
                  <option value="45">{uiText("45 minutos")}</option>
                  <option value="60">{uiText("1 hora")}</option>
                  <option value="90">{uiText("1 hora y media")}</option>
                </select>
              </label>

              <label className="block space-y-2 text-base font-medium text-ink-1" htmlFor="entrevista-tipo">
                {uiText("Cómo será")}
                <select
                  id="entrevista-tipo"
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value as ApplicationInterviewType)}
                  className={cn(TAP_TARGET, CAMPO, "font-normal")}
                >
                  <option value="VIRTUAL">{uiText("Por videollamada")}</option>
                  <option value="PRESENTIAL">{uiText("En la oficina")}</option>
                  <option value="PHONE">{uiText("Por teléfono")}</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2 text-base font-medium text-ink-1" htmlFor="entrevista-persona">
              {uiText("Quién entrevista")}
              <select
                id="entrevista-persona"
                value={entrevistador}
                onChange={(event) => setEntrevistador(event.target.value)}
                className={cn(TAP_TARGET, CAMPO, "font-normal")}
              >
                <option value="">{entrevistadores.isLoading ? uiText("Cargando…") : uiText("Elige a una persona")}</option>
                {entrevistadores.data?.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.firstName} {persona.lastName}
                  </option>
                ))}
              </select>
            </label>

            {tipo === "VIRTUAL" ? (
              <label className="block space-y-2 text-base font-medium text-ink-1" htmlFor="entrevista-enlace">
                {uiText("Enlace de la videollamada")}
                <input
                  id="entrevista-enlace"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={enlace}
                  onChange={(event) => setEnlace(event.target.value)}
                  className={cn(TAP_TARGET, CAMPO, "font-normal")}
                />
              </label>
            ) : null}

            {tipo === "PRESENTIAL" ? (
              <label className="block space-y-2 text-base font-medium text-ink-1" htmlFor="entrevista-lugar">
                {uiText("Dónde")}
                <input
                  id="entrevista-lugar"
                  value={lugar}
                  onChange={(event) => setLugar(event.target.value)}
                  className={cn(TAP_TARGET, CAMPO, "font-normal")}
                />
              </label>
            ) : null}

            {agendar.isError ? (
              <p role="alert" className="rounded-lg border border-status-danger/40 bg-status-danger/10 px-3 py-2 text-sm text-ink-1">
                {getApiErrorMessage(agendar.error, uiText("No se pudo agendar. Revisa los datos e inténtalo otra vez."))}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" className={TAP_TARGET} onClick={() => setAbierto(false)}>
                {t("reason.cancel")}
              </Button>
              <Button
                type="button"
                className={TAP_TARGET}
                disabled={!listo}
                loading={agendar.isPending}
                loadingLabel={uiText("Agendando…")}
                onClick={() => agendar.mutate()}
              >
                {uiText("Confirmar la entrevista")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
