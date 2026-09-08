"use client";

import { useUiText } from "@/components/ui-copy";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineNote } from "@/components/system";

/**
 * Confirmación de una acción, sin `window.confirm`.
 *
 * Por qué existe
 * --------------
 * Nueve operaciones del inventario de restaurante se confirmaban con el
 * diálogo del navegador: recibir una transferencia, aprobar un conteo,
 * aplicar un ajuste, cancelar un documento, confirmar una entrada, procesar
 * una importación de ventas y archivar una receta. Todas mueven existencias
 * reales o cierran documentos, y todas usaban una caja del sistema operativo
 * que no se puede diseñar, bloquea el hilo mientras está abierta, no dice
 * quién queda como responsable y presenta «Aceptar» y «Cancelar» con el mismo
 * peso, sea la acción reversible o no.
 *
 * Por qué es imperativo y no un hook
 * ----------------------------------
 * Los puntos de llamada están dentro de componentes escritos en una sola
 * línea de JSX. Un hook obligaría a declarar el estado y a colocar el
 * `{dialog}` en el sitio correcto de cada uno, que es justo donde se cuelan
 * los errores. En su lugar hay UN anfitrión montado con los proveedores de la
 * aplicación, y las pantallas solo importan una función.
 *
 *     onClick={() =>
 *       void confirmAction({
 *         title: "¿Recibir la transferencia?",
 *         consequence: "Se descuenta del origen y se suma al destino.",
 *         confirmLabel: "Recibir",
 *         irreversible: true,
 *       }).then((ok) => ok && action.mutate(…))
 *     }
 *
 * El nombre es `confirmAction` y no `confirm` a propósito: `confirm` es un
 * global del DOM, así que un olvido de importación no daría error de
 * compilación y volveríamos al diálogo del navegador sin enterarnos.
 */

export type ConfirmRequest = {
  title: string;
  description?: string;
  /** Qué cambia si se confirma. Es lo que `window.confirm` no dejaba decir. */
  consequence?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** `true` pinta la acción como destructiva y añade el aviso de que no se deshace. */
  irreversible?: boolean;
};

type PendingRequest = ConfirmRequest & { resolve: (value: boolean) => void };

let present: ((request: PendingRequest) => void) | null = null;

/**
 * Pide confirmación y resuelve a `true` si la persona acepta.
 *
 * Si el anfitrión no está montado —solo debería ocurrir en una prueba o si
 * alguien lo quita de los proveedores— la promesa resuelve a `false` y se
 * avisa por consola: cancelar es el resultado seguro; dar por confirmada una
 * operación que nadie vio sería mover existencias a espaldas de alguien.
 */
export function confirmAction(request: ConfirmRequest): Promise<boolean> {
  if (!present) {
    console.error("ConfirmActionHost no está montado: la acción se cancela por seguridad.");
    return Promise.resolve(false);
  }
  return new Promise<boolean>((resolve) => {
    present?.({ ...request, resolve });
  });
}

/** Se monta una sola vez, junto a los proveedores de la aplicación. */
export function ConfirmActionHost() {
  const uiText = useUiText();
  const [request, setRequest] = useState<PendingRequest | null>(null);

  useEffect(() => {
    present = setRequest;
    return () => {
      present = null;
    };
  }, []);

  const settle = useCallback((value: boolean) => {
    setRequest((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => !open && settle(false)}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{request?.title ?? ""}</DialogTitle>
          {request?.description ? <DialogDescription>{request.description}</DialogDescription> : null}
        </DialogHeader>

        {request?.consequence ? (
          <InlineNote tone={request.irreversible ? "warning" : "info"} title={uiText("Qué cambia")}>
            {request.consequence}
          </InlineNote>
        ) : null}

        {request?.irreversible ? (
          <InlineNote tone="danger" title={uiText("No se puede deshacer")}>
            {uiText("El movimiento queda en la auditoría. Corregirlo exige registrar otra operación en sentido contrario.")}</InlineNote>
        ) : null}

        {/* En el teléfono la acción peligrosa ocupa el ancho y «Cancelar»
            queda encima: el pulgar llega antes a lo de abajo. */}
        <div className="flex flex-col-reverse gap-2 pb-[max(0px,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => settle(false)}>
            {request?.cancelLabel ?? "Cancelar"}
          </Button>
          <Button variant={request?.irreversible ? "destructive" : "default"} onClick={() => settle(true)}>
            {request?.confirmLabel ?? "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
