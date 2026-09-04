"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TAP_TARGET } from "@/components/simple/simple-ui";

/**
 * Diálogo de motivo para una acción que no se puede deshacer sola.
 *
 * Pide el motivo con una lista de opciones frecuentes más un texto libre, en
 * lugar de un campo vacío: escribir desde cero es la parte que la gente evita,
 * y un descarte sin motivo deja el historial sin explicación.
 */
export function ReasonDialog({ open, title, description, confirmLabel, options, onOpenChange, onConfirm }: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  options?: Array<{ id: string; label: string }>;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: { reasonId?: string; reason: string }) => void;
}) {
  const [reasonId, setReasonId] = useState("");
  const [reason, setReason] = useState("");
  const needsOption = Boolean(options?.length);
  const ready = reason.trim().length >= 3 && (!needsOption || Boolean(reasonId));

  const submit = () => {
    if (!ready) return;
    onConfirm({ reasonId: reasonId || undefined, reason: reason.trim() });
    setReasonId("");
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {needsOption ? (
          <label className="block space-y-2 text-base font-medium text-text-primary" htmlFor="reason-option">
            ¿Por qué?
            <select
              id="reason-option"
              value={reasonId}
              onChange={(event) => setReasonId(event.target.value)}
              className={cn(TAP_TARGET, "w-full rounded-xl border border-border-default bg-surface-elevated px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus")}
            >
              <option value="">Elige un motivo</option>
              {options?.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
        ) : null}

        <label className="block space-y-2 text-base font-medium text-text-primary" htmlFor="reason-text">
          Cuéntanos un poco más
          <textarea
            id="reason-text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-28 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            placeholder="Esto queda guardado en el historial de la persona."
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className={TAP_TARGET} onClick={() => onOpenChange(false)}>
            Mejor no
          </Button>
          <Button type="button" variant="destructive" className={TAP_TARGET} disabled={!ready} onClick={submit}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
