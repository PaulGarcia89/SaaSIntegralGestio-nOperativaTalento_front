"use client";

import type { ReactNode } from "react";
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
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
