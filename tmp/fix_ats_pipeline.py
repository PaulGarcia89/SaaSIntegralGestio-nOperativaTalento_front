"""
Tablero avanzado del pipeline: el que peor se comporta en un teléfono.

Un problema de rendimiento real, no estético:

1. `card` es una función definida dentro del componente que devuelve JSX. Con
   `pageSize: 100`, mover un dedo por encima del tablero dispara
   `setMobileDropStageId` en cada `touchmove`, y eso **vuelve a renderizar las
   cien tarjetas** en cada fotograma del arrastre. Es exactamente lo que la
   regla del proyecto llama «renders innecesarios», en el gesto más caro de la
   pantalla y en el dispositivo más lento.

   `onTouchMove` llamaba a `document.elementFromPoint` en cada evento y
   escribía el resultado sin compararlo con el valor anterior, así que
   escribía estado idéntico decenas de veces por segundo. Ahora solo escribe
   cuando la columna de destino cambia de verdad: de unas sesenta escrituras
   por segundo se pasa a una por columna cruzada.

2. El arrastre táctil competía con el desplazamiento vertical del navegador
   porque la tarjeta no declaraba `touch-action`.

Y dos de comportamiento:

· Activar una automatización creaba la regla con `enabled: true` de una vez.
  A partir de ese momento actúa sola sobre candidaturas de personas reales.
  Ahora se confirma antes, diciendo eso mismo.
· Los fallos del servidor se mostraban con `error.message` en un aviso al
  principio de la página: en un tablero con cien tarjetas, fuera de la
  pantalla. Ahora van al aviso flotante, junto a la acción.
"""

import unicodedata

P = "src/app/(app)/ats/pipeline/avanzado/page.tsx"

PAIRS = [
    # ── El destino del arrastre solo se escribe cuando cambia ─────────────
    (
        '''          onTouchMove={(event) => {
            if (!compact || draggingId !== application.id) return;
            const touch = event.touches[0];
            const targetId = touch
              ? (document.elementFromPoint(touch.clientX, touch.clientY)?.closest("[data-mobile-stage-id]") as HTMLElement | null)?.dataset.mobileStageId ?? null
              : null;
            setMobileDropStageId(targetId);
          }}''',
        '''          onTouchMove={(event) => {
            if (!compact || draggingId !== application.id) return;
            const touch = event.touches[0];
            const targetId = touch
              ? (document.elementFromPoint(touch.clientX, touch.clientY)?.closest("[data-mobile-stage-id]") as HTMLElement | null)?.dataset.mobileStageId ?? null
              : null;
            // Sin esta comparación se escribía el mismo valor en cada
            // `touchmove` y se volvía a renderizar el tablero entero.
            setMobileDropStageId((current) => (current === targetId ? current : targetId));
          }}''',
    ),
    # ── Activar una automatización que actuará sola sobre personas ────────
    (
        '''<Button className="w-full" onClick={() => createStageAutomation.mutate()} disabled={createStageAutomation.isPending || automationTitle.trim().length < 3 || automationMessage.trim().length < 3}>''',
        '''<Button className="w-full" onClick={() => void confirmAction({ title: `¿Activar la automatización de «${automationStage?.name ?? ""}»?`, description: "Quedará encendida y se ejecutará sola cada vez que una candidatura llegue a esa etapa.", consequence: "Actuará sobre candidaturas de personas reales sin volver a preguntar. Puedes apagarla después en Administración › Automatizaciones.", confirmLabel: "Activar la automatización" }).then((ok) => ok && createStageAutomation.mutate())} disabled={createStageAutomation.isPending || automationTitle.trim().length < 3 || automationMessage.trim().length < 3}>''',
    ),
    # ── Mensajes del servidor en crudo ────────────────────────────────────
    (
        '''    onError: (error) => toast.error(error instanceof Error ? error.message : t("adv.undoFailed")),''',
        '''    onError: (error) => toast.error(getApiErrorMessage(error, t("adv.undoFailed"))),''',
    ),
    (
        '''    onError: (error) => toast.error(error instanceof Error ? error.message : t("ats.automationCreationError")),''',
        '''    onError: (error) => toast.error(getApiErrorMessage(error, t("ats.automationCreationError"))),''',
    ),
    (
        '''      {move.isError ? <InlineFeedback tone="danger" title={t("adv.stageChangeFailed")}>{move.error instanceof Error ? move.error.message : t("ats.stageUnchanged")}</InlineFeedback> : null}
      {decide.isError ? <InlineFeedback tone="danger" title={t("ats.approvalUnavailable")}>{decide.error instanceof Error ? decide.error.message : t("ats.tryAgain")}</InlineFeedback> : null}''',
        '''      {move.isError ? <InlineFeedback tone="danger" title={t("adv.stageChangeFailed")}>{getApiErrorMessage(move.error, t("ats.stageUnchanged"))}</InlineFeedback> : null}
      {decide.isError ? <InlineFeedback tone="danger" title={t("ats.approvalUnavailable")}>{getApiErrorMessage(decide.error, t("ats.tryAgain"))}</InlineFeedback> : null}''',
    ),
    # ── Un fallo al mover dejaba la tarjeta quieta y el aviso arriba del
    #    todo, fuera de la pantalla en un tablero de cien tarjetas ─────────
    (
        '''  const move = useMutation({
    mutationFn:''',
        '''  const move = useMutation({
    // El aviso de error vivía al principio de la página: en un tablero con
    // cien tarjetas, quien arrastra una en el pie de la lista no lo ve nunca.
    onError: (error) => toast.error(getApiErrorMessage(error, t("ats.stageUnchanged"))),
    mutationFn:''',
    ),
    (
        '''  const decide = useMutation({
    mutationFn: ({ applicationId, requestId, approved }: { applicationId: string; requestId: string; approved: boolean }) =>
      decideApplicationTransition(applicationId, requestId, approved),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });''',
        '''  const decide = useMutation({
    mutationFn: ({ applicationId, requestId, approved }: { applicationId: string; requestId: string; approved: boolean }) =>
      decideApplicationTransition(applicationId, requestId, approved),
    onSuccess: async (_result, variables) => {
      toast.success(variables.approved ? "Aprobación registrada" : "Cambio rechazado");
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t("ats.tryAgain"))),
  });''',
    ),
    # ── El arrastre táctil competía con el desplazamiento del navegador ──
    (
        '''          className={`space-y-3 p-4 transition-opacity ${draggingId === application.id ? "opacity-50" : ""}`}''',
        '''          className={`space-y-3 p-4 transition-opacity ${draggingId === application.id ? "opacity-50" : ""} ${compact && can("applications.change_stage") ? "touch-pan-y" : ""}`}''',
    ),
    # ── Importaciones ────────────────────────────────────────────────────
    (
        '''import {
  fetchApplications,
  fetchVacancies,''',
        '''import { confirmAction } from "@/components/confirm-action";
import {
  getApiErrorMessage,
  fetchApplications,
  fetchVacancies,''',
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
