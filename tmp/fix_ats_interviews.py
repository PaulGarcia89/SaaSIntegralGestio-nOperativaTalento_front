"""
Entrevistas: dos acciones de alto impacto sin revisión, y el estado en crudo.

Cancelar una entrevista avisa al candidato y al panel, libera la sala y no se
deshace: se hacía con un clic, y el botón está en el mismo pie que «Confirmar
nueva fecha» —a un dedo de distancia en un teléfono—. Desconectar el
calendario deja de sincronizar todas las entrevistas futuras de la empresa, y
también era un clic.

Lo demás es el residuo de siempre: el estado de la entrevista impreso como
constante mientras el filtro de la misma pantalla lo muestra en español, los
mensajes del servidor en crudo, y una cadena que nombra al proveedor de
alojamiento dentro de un texto que lee una persona de recursos humanos.
"""

import unicodedata

P = "src/app/(app)/ats/interviews/page.tsx"

PAIRS = [
    # ── Cancelar una entrevista: un clic, sin decir a quién avisa ──────────
    (
        '''<Button variant="destructive" onClick={() => editingInterview && updateInterview.mutate({ id: editingInterview.id, input: { status: "CANCELED" } })} disabled={updateInterview.isPending}><CalendarX className="size-4" />{t("interviews.cancel")}</Button>''',
        '''<Button
                variant="destructive"
                disabled={updateInterview.isPending}
                onClick={() =>
                  editingInterview &&
                  void confirmAction({
                    title: `¿Cancelar «${editingInterview.title}»?`,
                    description: `${editingInterview.application?.candidate.fullName ?? "La persona candidata"} y el panel recibirán el aviso de cancelación.`,
                    consequence:
                      "Se libera la sala reservada y se borra el evento del calendario conectado. Reprogramar exige volver a coordinar con todo el panel: si solo cambia la hora, usa «Confirmar nueva fecha» en vez de cancelar.",
                    confirmLabel: "Cancelar la entrevista",
                    irreversible: true,
                  }).then((ok) => ok && updateInterview.mutate({ id: editingInterview.id, input: { status: "CANCELED" } }))
                }
              ><CalendarX className="size-4" />{t("interviews.cancel")}</Button>''',
    ),
    # ── Desconectar el calendario de toda la empresa ───────────────────────
    (
        '''<Button className="mt-3" size="sm" variant="ghost" onClick={() => disconnect.mutate(provider)} disabled={disconnect.isPending}>Desconectar</Button>''',
        '''<Button className="mt-3" size="sm" variant="ghost" disabled={disconnect.isPending} onClick={() => void confirmAction({ title: `¿Desconectar ${provider === "GOOGLE" ? "Google Calendar" : provider === "MICROSOFT" ? "Outlook" : "Zoom"}?`, description: "Las entrevistas futuras dejarán de aparecer en ese calendario.", consequence: "Los eventos ya creados se quedan donde están, pero no se actualizan si se reprograma ni se borran si se cancela. Volver a conectar exige autorizar la cuenta otra vez.", confirmLabel: "Desconectar el calendario" }).then((ok) => ok && disconnect.mutate(provider))}>Desconectar</Button>''',
    ),
    # ── El estado de la entrevista, en constante ──────────────────────────
    (
        '''<div className="flex flex-wrap gap-2"><Badge>{interview.status}</Badge>''',
        '''<div className="flex flex-wrap gap-2"><Badge variant={interview.status === "CANCELED" || interview.status === "NO_SHOW" ? "destructive" : interview.status === "COMPLETED" || interview.status === "CONFIRMED" ? "default" : "secondary"}>{technicalLabel(interview.status)}</Badge>''',
    ),
    # ── El proveedor de alojamiento dentro de un texto de usuario ─────────
    (
        '''"Faltan credenciales OAuth en Railway"''',
        '''t("interviews.missingCredentials")''',
    ),
    # ── El tono del aviso se decidía buscando una palabra en el texto ─────
    (
        '''  const [oauthFeedback, setOauthFeedback] = useState("");''',
        '''  // Antes el tono salía de `oauthFeedback.includes("correctamente")`: al
  // cambiar la traducción, un error se habría pintado como éxito.
  const [oauthFeedback, setOauthFeedback] = useState<{ tone: "success" | "danger"; message: string } | null>(null);''',
    ),
    (
        '''    {oauthFeedback ? <InlineFeedback tone={oauthFeedback.includes("correctamente") ? "success" : "danger"} title={t("interviews.calendarConnection")}>{oauthFeedback}</InlineFeedback> : null}''',
        '''    {oauthFeedback ? <InlineFeedback tone={oauthFeedback.tone} title={t("interviews.calendarConnection")}>{oauthFeedback.message}</InlineFeedback> : null}''',
    ),
    (
        '''      .then(async () => { setOauthFeedback(t("interviews.providerConnected", { provider })); await queryClient.invalidateQueries({ queryKey: ["calendar-connections"] }); })
      .catch((error: unknown) => setOauthFeedback(error instanceof Error ? error.message : t("interviews.connectionFailed")))''',
        '''      .then(async () => { setOauthFeedback({ tone: "success", message: t("interviews.providerConnected", { provider }) }); await queryClient.invalidateQueries({ queryKey: ["calendar-connections"] }); })
      .catch((error: unknown) => setOauthFeedback({ tone: "danger", message: getApiErrorMessage(error, t("interviews.connectionFailed")) }))''',
    ),
    # ── Mensajes del servidor en crudo ────────────────────────────────────
    (
        '''{availability.isError ? <InlineFeedback tone="danger" title={t("interviews.availabilityError")}>{availability.error instanceof Error ? availability.error.message : "Intenta nuevamente."}</InlineFeedback> : null}''',
        '''{availability.isError ? <InlineFeedback tone="danger" title={t("interviews.availabilityError")}>{getApiErrorMessage(availability.error, "Intenta nuevamente.")}</InlineFeedback> : null}''',
    ),
    (
        '''{schedule.isError ? <InlineFeedback tone="danger" title={t("interviews.scheduleError")}>{schedule.error instanceof Error ? schedule.error.message : t("interviews.scheduleErrorBody")}</InlineFeedback> : null}''',
        '''{schedule.isError ? <InlineFeedback tone="danger" title={t("interviews.scheduleError")}>{getApiErrorMessage(schedule.error, t("interviews.scheduleErrorBody"))}</InlineFeedback> : null}''',
    ),
    (
        '''{saveAvailability.isError ? <InlineFeedback tone="danger" title={t("interviews.saveError")}>{saveAvailability.error instanceof Error ? saveAvailability.error.message : t("interviews.checkSchedules")}</InlineFeedback> : null}''',
        '''{saveAvailability.isError ? <InlineFeedback tone="danger" title={t("interviews.saveError")}>{getApiErrorMessage(saveAvailability.error, t("interviews.checkSchedules"))}</InlineFeedback> : null}''',
    ),
    # ── Reprogramar: el error real se sustituía por «revisa las fechas» ───
    (
        '''{updateInterview.isError ? <InlineFeedback tone="danger" title={t("interviews.updateError")}>{t("interviews.checkDates")}</InlineFeedback> : null}''',
        '''{updateInterview.isError ? <InlineFeedback tone="danger" title={t("interviews.updateError")}>{getApiErrorMessage(updateInterview.error, t("interviews.checkDates"))}</InlineFeedback> : null}''',
    ),
    # ── Acciones sin ningún aviso cuando fallan ──────────────────────────
    (
        '''  const disconnect = useMutation({ mutationFn: disconnectCalendar, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["calendar-connections"] }) });
  const retrySync = useMutation({ mutationFn: retryInterviewCalendarSync, onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] }) });''',
        '''  const disconnect = useMutation({
    mutationFn: disconnectCalendar,
    onSuccess: async () => { toast.success("Calendario desconectado"); await queryClient.invalidateQueries({ queryKey: ["calendar-connections"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible desconectar el calendario.")),
  });
  const retrySync = useMutation({
    mutationFn: retryInterviewCalendarSync,
    onSuccess: async () => { toast.success("Sincronización reintentada"); await queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] }); },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible reintentar la sincronización.")),
  });''',
    ),
    (
        '''  const updateInterview = useMutation({ mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateRecruitmentInterview>[1] }) => updateRecruitmentInterview(id, input), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] }); setEditingInterview(null); } });''',
        '''  const updateInterview = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateRecruitmentInterview>[1] }) => updateRecruitmentInterview(id, input),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["recruitment-interviews"] });
      await queryClient.invalidateQueries({ queryKey: ["interview-coordination-queue"] });
      toast.success(variables.input.status === "CANCELED" ? "Entrevista cancelada. Se avisó al panel." : "Entrevista reprogramada");
      setEditingInterview(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible actualizar la entrevista.")),
  });''',
    ),
    (
        '''  const schedule = useMutation({ mutationFn: async (input: ScheduleInterviewInput) => {''',
        '''  const schedule = useMutation({ onError: (error) => toast.error(getApiErrorMessage(error, t("interviews.scheduleErrorBody"))), mutationFn: async (input: ScheduleInterviewInput) => {''',
    ),
    (
        '''  const downloadIcs = useMutation({ mutationFn: async (interviewId: string) => ({ interviewId, blob: await downloadInterviewInvitation(interviewId) }), onSuccess:''',
        '''  const downloadIcs = useMutation({ onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible descargar la invitación.")), mutationFn: async (interviewId: string) => ({ interviewId, blob: await downloadInterviewInvitation(interviewId) }), onSuccess:''',
    ),
    (
        '''  const invitationResponse = useMutation({ mutationFn: ({ interviewId, accepted }: { interviewId: string; accepted: boolean }) => respondInterviewInvitation(interviewId, accepted), onSuccess:''',
        '''  const invitationResponse = useMutation({ onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible registrar tu respuesta.")), mutationFn: ({ interviewId, accepted }: { interviewId: string; accepted: boolean }) => respondInterviewInvitation(interviewId, accepted), onSuccess:''',
    ),
    (
        '''  const connectCalendar = useMutation({ mutationFn: async (provider: CalendarProvider) => {''',
        '''  const connectCalendar = useMutation({ onError: (error) => toast.error(getApiErrorMessage(error, "No fue posible iniciar la autorización del calendario.")), mutationFn: async (provider: CalendarProvider) => {''',
    ),
    (
        '''  const saveAvailability = useMutation({ mutationFn: updateAvailabilitySettings, onSuccess: async (saved) => { queryClient.setQueryData(["availability-settings"], saved); setAvailabilityOpen(false); } });''',
        '''  const saveAvailability = useMutation({ mutationFn: updateAvailabilitySettings, onSuccess: async (saved) => { queryClient.setQueryData(["availability-settings"], saved); toast.success("Disponibilidad guardada"); setAvailabilityOpen(false); } });''',
    ),
    # ── Fechas con el idioma del navegador, no el del producto ───────────
    (
        '''<p className="text-sm text-text-secondary">{new Date(interview.startsAt).toLocaleString()} · {interview.application?.candidate.fullName}</p>''',
        '''<p className="text-sm text-text-secondary">{new Date(interview.startsAt).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })} · {interview.application?.candidate.fullName}</p>''',
    ),
    (
        '''<p className="font-medium">{new Date(interview.startsAt).toLocaleString([], { timeZone: interview.timezone })}</p>''',
        '''<p className="font-medium">{new Date(interview.startsAt).toLocaleString("es", { timeZone: interview.timezone, dateStyle: "full", timeStyle: "short" })}</p>''',
    ),
    (
        '''{new Date(slot.startsAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}''',
        '''{new Date(slot.startsAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}''',
    ),
    # ── El diálogo más largo del módulo, sin zona segura y con vh ─────────
    (
        '''<DialogContent className="max-h-[92vh] overflow-y-auto">''',
        '''<DialogContent className="max-h-[92dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">''',
    ),
    # ── Importaciones ────────────────────────────────────────────────────
    (
        '''import { useAppStore } from "@/store/app-store";''',
        '''import { getApiErrorMessage } from "@/lib/backend";
import { confirmAction } from "@/components/confirm-action";
import { useAppStore } from "@/store/app-store";''',
    ),
]


def main():
    src = open(P, encoding="utf-8").read()
    original = src
    for raw_old, raw_new in PAIRS:
        old = unicodedata.normalize("NFC", raw_old)
        new = unicodedata.normalize("NFC", raw_new)
        count = src.count(old)
        assert count == 1, f"{count} apariciones de:\n{old[:200]}"
        src = src.replace(old, new)
    assert src != original
    open(P, "w", encoding="utf-8").write(src)
    print("ok", P, len(PAIRS), "cambios")


main()
