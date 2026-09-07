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
import { InlineNote, PageHeader, PageSection } from "@/components/system";

/**
 * Diálogos y contenedores de las siete pantallas de alta/baja/modificación.
 *
 * Qué cambia
 * ----------
 * · `ConfirmDeleteDialog` decía siempre la misma frase —«Esta acción es
 *   permanente. No podrás recuperar este registro»— sin nombrar NUNCA lo que
 *   se lleva por delante. Con ella se borran usuarios, empresas enteras
 *   (arrastrando sucursales, usuarios y asignaciones de módulo), sucursales,
 *   roles y suscripciones. Ahora acepta `consequences`, que es donde cada
 *   pantalla enumera lo que desaparece, y `confirmLabel` para nombrar la
 *   acción en vez de decir «Eliminar definitivamente» a todo.
 * · El botón de borrar quedaba a la derecha del pie también en el teléfono,
 *   donde es el pulgar quien decide: en móvil ocupa el ancho y el de cancelar
 *   queda encima, que es el orden seguro.
 * · `CrudPanel` metía 28 px de relleno y un `pt-2` que descolgaba el
 *   contenido del borde superior.
 * · Los rellenos del diálogo no respetaban el área segura inferior del
 *   iPhone, así que el pie quedaba bajo la barra de gestos.
 */

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

export function CrudPanel({ children, title = "Registros" }: { children: ReactNode; title?: string }) {
  return (
    <PageSection title={title} boxed>
      {children}
    </PageSection>
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
      <DialogContent className="max-h-[92dvh] overflow-y-auto p-0">
        <DialogHeader className="border-b border-line px-5 pb-4 pr-14 pt-5 sm:px-6 sm:pt-6">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {/* El relleno inferior suma el área segura: sin esto el último campo
            queda bajo la barra de gestos del iPhone. */}
        <div className="px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">{children}</div>
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
  consequences,
  confirmLabel = "Eliminar definitivamente",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  pending?: boolean;
  /**
   * Qué se lleva por delante el borrado, enumerado.
   *
   * Sin esto, la advertencia genérica trata igual borrar un rol vacío que
   * borrar una empresa con sus sucursales y sus usuarios dentro.
   */
  consequences?: ReactNode;
  confirmLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-line px-5 pb-5 pr-14 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-md bg-status-danger/10 text-status-danger"
            >
              <Trash2 className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 px-5 py-5 sm:px-6">
          {consequences ? (
            <InlineNote tone="danger" title="Qué desaparece">
              {consequences}
            </InlineNote>
          ) : null}
          <InlineNote tone="warning" title="No se puede deshacer">
            Una vez eliminado, no hay forma de recuperarlo desde el producto.
          </InlineNote>
        </div>

        {/* En el teléfono el botón peligroso ocupa el ancho y «Cancelar» queda
            encima: el pulgar llega antes a lo de abajo. */}
        <footer className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            loading={pending}
            loadingLabel="Eliminando…"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {confirmLabel}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
