"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/design-system";

export function CrudHeader({
  title,
  description,
  badge,
  action,
}: {
  title: string;
  description?: string;
  badge?: string;
  action?: ReactNode;
}) {
  return <PageHeader eyebrow={badge} title={title} description={description} actions={action} />;
}

export function CrudPanel({ children }: { children: ReactNode }) {
  return (
    <Card level={2} className="overflow-hidden">
      <CardContent className="p-7 pt-2">{children}</CardContent>
    </Card>
  );
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  trigger?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader className="border-b border-border-default px-5 pb-4 pt-5 pr-14 sm:px-6 sm:pt-6">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border-default px-5 pb-5 pt-5 pr-14 sm:px-6 sm:pt-6">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-status-danger/10 text-status-danger">
              <Trash2 className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-status-danger/20 bg-status-danger/5 px-4 py-3 text-sm leading-6 text-text-secondary">
            Esta acción es permanente. No podrás recuperar este registro una vez eliminado.
          </div>
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-border-default bg-surface-section/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
            <Trash2 className="size-4" />
            {pending ? "Eliminando..." : "Eliminar definitivamente"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
