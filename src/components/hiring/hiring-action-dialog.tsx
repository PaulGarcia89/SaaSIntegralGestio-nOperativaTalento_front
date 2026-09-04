"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocale } from "@/components/locale-provider";

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
  const { t } = useLocale();
  const [reason, setReason] = useState("");
  const submit = () => {
    const value = reason.trim();
    if (value.length < 3) return;
    onConfirm(value);
    setReason("");
    onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><label className="space-y-2 text-sm font-medium" htmlFor="hiring-action-reason">{t("hiring.dialog.reason")}<span className="text-danger"> *</span><textarea id="hiring-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-28 w-full rounded-xl border border-border-default bg-surface-elevated p-3 text-sm" placeholder={t("hiring.dialog.reasonPlaceholder")} /></label><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>{t("actions.cancel")}</Button><Button type="button" variant="destructive" disabled={reason.trim().length < 3} onClick={submit}>{confirmLabel}</Button></div></DialogContent></Dialog>;
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
  const { t } = useLocale();
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><p className="text-xs text-text-secondary">{t("hiring.dialog.confirmWarning")}</p><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>{t("actions.cancel")}</Button><Button type="button" variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }}>{confirmLabel}</Button></div></DialogContent></Dialog>;
}
