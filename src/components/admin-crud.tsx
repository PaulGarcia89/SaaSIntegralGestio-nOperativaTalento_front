"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
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

export function CrudHeader({
  title,
  description,
  badge,
  action,
}: {
  title: string;
  description: string;
  badge?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/88 p-6 pb-8 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.28)] md:p-7 md:pb-9">
      <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,183,0.14),transparent_72%)] blur-3xl" />
      <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          {badge ? (
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {badge}
            </Badge>
          ) : null}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {title}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-3">{action}</div> : null}
      </div>
    </div>
  );
}

export function CrudPanel({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/88 shadow-[0_18px_70px_-42px_rgba(15,23,42,0.25)]">
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
  description: string;
  trigger?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
          {pending ? "Eliminando..." : "Eliminar"}
        </Button>
      </div>
    </FormDialog>
  );
}
