"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function HiringReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const submit = () => {
    const value = reason.trim();
    if (value.length < 3) return;
    onConfirm(value);
    setReason("");
    onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><label className="space-y-2 text-sm font-medium" htmlFor="hiring-action-reason">Motivo<span className="text-danger"> *</span><textarea id="hiring-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-28 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-sm" placeholder="Escribe el motivo para dejar evidencia." /></label><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="button" variant="destructive" disabled={reason.trim().length < 3} onClick={submit}>{confirmLabel}</Button></div></DialogContent></Dialog>;
}

export function HiringConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="button" variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }}>{confirmLabel}</Button></div></DialogContent></Dialog>;
}
