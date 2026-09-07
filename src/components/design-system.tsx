"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InlineNote,
  PageHeader as SystemPageHeader,
  Pagination as SystemPagination,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Encabezado de página.
 *
 * Ya no dibuja nada propio: reenvía al del sistema. Antes existían dos
 * encabezados distintos en el mismo producto —este con `text-4xl`, epígrafe
 * en color de marca y borde inferior; el del sistema sin nada de eso—, así
 * que dos pantallas contiguas no se parecían. La firma se conserva para no
 * tocar las treinta y cuatro pantallas que lo usan.
 */
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return <SystemPageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />;
}

export function MetricWithProvenance({ label, value, period, updatedAt, action }: { label: string; value: string | number; period: string; updatedAt: Date; action?: ReactNode }) {
  return <Card level={2}><CardContent className="space-y-3 p-5"><div><p className="text-sm text-text-secondary">{label}</p><p className="mt-1 text-3xl font-semibold text-text-primary">{value}</p></div><div className="border-t border-border-default pt-3 text-xs text-text-secondary"><p>{period}</p><p>Actualizado: {updatedAt.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</p></div>{action}</CardContent></Card>;
}

export function ActionBar({ children, label = "Acciones de página", sticky = false }: { children: ReactNode; label?: string; sticky?: boolean }) {
  return <div role="toolbar" aria-label={label} className={cn("flex w-full flex-wrap items-center gap-2 sm:w-auto", sticky && "sticky bottom-3 z-20 rounded-2xl border bg-surface-elevated/95 p-3 shadow-lg")}>{children}</div>;
}

export type CommandItem = { id: string; label: string; group: string; href: string; keywords?: string };
export function AccessibleCommandPalette({ open, onOpenChange, items, onNavigate }: { open: boolean; onOpenChange: (open: boolean) => void; items: CommandItem[]; onNavigate?: (href: string) => void }) {
  const [query, setQuery] = useState(""); const [active, setActive] = useState(0); const inputRef = useRef<HTMLInputElement>(null); const listId = useId();
  const results = query ? items.filter((item) => `${item.label} ${item.group} ${item.keywords ?? ""}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))) : items.slice(0, 6);
  useEffect(() => { if (open) queueMicrotask(() => inputRef.current?.focus()); }, [open]);
  const select = (item: CommandItem) => { onNavigate?.(item.href); onOpenChange(false); setQuery(""); setActive(0); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="p-0"><DialogHeader className="sr-only"><DialogTitle>Buscar funciones</DialogTitle><DialogDescription>Busca y abre una función autorizada.</DialogDescription></DialogHeader><div className="flex items-center gap-3 border-b p-4"><Search className="size-4" /><Input ref={inputRef} role="combobox" aria-controls={listId} aria-expanded="true" aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined} value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(results.length - 1, value + 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(0, value - 1)); } if (event.key === "Enter" && results[active]) { event.preventDefault(); select(results[active]); } }} placeholder="Buscar funciones…" /></div><div id={listId} role="listbox" className="max-h-80 overflow-y-auto p-2">{results.map((item, index) => <Link id={`${listId}-${item.id}`} role="option" aria-selected={active === index} key={item.id} href={item.href} onClick={(event) => { event.preventDefault(); select(item); }} className={cn("flex min-h-11 items-center justify-between rounded-xl px-3 py-2", active === index && "bg-surface-interactive")}><span>{item.label}</span><span className="text-xs text-text-secondary">{item.group}</span></Link>)}{!results.length ? <p className="p-6 text-center text-sm text-text-secondary">No hay resultados.</p> : null}</div><p className="sr-only" aria-live="polite">{results.length} resultados</p></DialogContent></Dialog>;
}

export function MobileDrawer({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bottom-0 left-0 top-0 flex h-dvh max-h-dvh w-[min(90vw,360px)] max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))] data-[state=open]:animate-in data-[state=open]:slide-in-from-left">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">Panel de navegación móvil</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MobileFilterSheet({ open, onOpenChange, title = "Filtros", description = "Ajusta los criterios y aplica los cambios.", children, onClear }: { open: boolean; onOpenChange: (open: boolean) => void; title?: string; description?: string; children: ReactNode; onClear?: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader className="sticky top-0 z-10 -mt-5 border-b border-border-default bg-card pb-4 pt-5 pr-12 sm:-mt-6 sm:pt-6"><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="flex-1 space-y-4 py-5">{children}</div><div className="sticky bottom-0 -mb-[max(1.25rem,env(safe-area-inset-bottom))] flex gap-2 border-t border-border-default bg-card py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mb-6 sm:pb-6">{onClear ? <Button type="button" variant="secondary" className="flex-1" onClick={onClear}>Limpiar</Button> : null}<Button type="button" className="flex-1" onClick={() => onOpenChange(false)}>Ver resultados</Button></div></DialogContent></Dialog>;
}

/**
 * Mantiene las acciones del formulario siempre disponibles en pantallas tactiles
 * sin sacrificar el formato de dialogo compacto en escritorio.
 */
export function ResponsiveDialog({ open, onOpenChange, title, description, children, footer, className }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode; className?: string }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className={cn("overflow-hidden p-0", className)}><DialogHeader className="shrink-0 border-b border-border-default px-5 pb-4 pt-5 pr-14 sm:px-6 sm:pt-6"><DialogTitle>{title}</DialogTitle>{description ? <DialogDescription>{description}</DialogDescription> : null}</DialogHeader><div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [-webkit-overflow-scrolling:touch] sm:px-6">{children}</div>{footer ? <footer className="shrink-0 border-t border-border-default bg-card px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">{footer}</footer> : null}</DialogContent></Dialog>;
}

export function ResponsiveDataView<T>({ data, getKey, desktop, mobile, empty }: { data: T[]; getKey: (row: T) => string; desktop: ReactNode; mobile: (row: T) => ReactNode; empty?: ReactNode }) {
  if (!data.length) return <>{empty ?? <InlineFeedback tone="info" title="Sin resultados">No hay datos que coincidan con los criterios actuales.</InlineFeedback>}</>;
  return <><div className="hidden md:block">{desktop}</div><div className="grid gap-3 md:hidden">{data.map((row) => <Card level={3} key={getKey(row)}><CardContent className="p-4">{mobile(row)}</CardContent></Card>)}</div></>;
}

/**
 * Paginación. Reenvía a la del sistema, que deriva el número de páginas del
 * total en vez de recibirlo: pasarlo por separado permitía que el «de N» y
 * los botones discreparan si quien llamaba calculaba mal uno de los dos.
 *
 * `totalPages` se sigue aceptando porque cinco pantallas lo pasan; se ignora
 * a propósito.
 */
export function Pagination({ page, totalItems, pageSize, onPageChange }: { page: number; totalPages: number; totalItems: number; pageSize: number; onPageChange: (page: number) => void }) {
  return <SystemPagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange} />;
}

export function Wizard({ steps, current, onStepChange, children }: { steps: string[]; current: number; onStepChange?: (step: number) => void; children: ReactNode }) {
  return <div className="space-y-6"><nav aria-label="Progreso"><ol className="flex min-w-0 gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">{steps.map((step, index) => <li key={step} className="shrink-0"><button type="button" disabled={index > current || !onStepChange} onClick={() => onStepChange?.(index)} aria-current={index === current ? "step" : undefined} className={cn("min-h-11 whitespace-nowrap rounded-full border px-3 text-sm sm:px-4", index === current && "border-primary bg-primary text-text-on-accent", index < current && "bg-surface-interactive")} >{index < current ? <Check className="mr-1 inline size-4" /> : null}{index + 1}. {step}</button></li>)}</ol></nav><section aria-labelledby={`wizard-step-${current}`}><h2 id={`wizard-step-${current}`} className="sr-only">{steps[current]}</h2>{children}</section></div>;
}

export function ContextSwitcher({ tenantId, branchId, tenants, branches, onTenantChange, onBranchChange, global }: { tenantId: string; branchId?: string; tenants: Array<{ id: string; name: string }>; branches: Array<{ id: string; name: string }>; onTenantChange?: (id: string) => void; onBranchChange?: (id: string) => void; global?: boolean }) {
  if (global) return <InlineFeedback tone="info" title="Contexto global">Estás consultando toda la plataforma.</InlineFeedback>;
  return <div className="grid gap-3 md:grid-cols-2"><label className="space-y-2 text-sm font-medium">Empresa<Select value={tenantId} onValueChange={onTenantChange} disabled={!onTenantChange || tenants.length < 2}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{tenants.map((tenant) => <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>)}</SelectContent></Select></label><label className="space-y-2 text-sm font-medium">Sucursal<Select value={branchId} onValueChange={onBranchChange} disabled={!onBranchChange}><SelectTrigger><SelectValue placeholder="Selecciona una sucursal" /></SelectTrigger><SelectContent>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select></label></div>;
}

export function ImpersonationBanner({ tenantName, onStop, pending }: { tenantName: string; onStop?: () => void; pending?: boolean }) { return <InlineFeedback tone="warning" title={`Suplantación activa: ${tenantName}`} action={onStop ? <Button variant="secondary" onClick={onStop} disabled={pending} data-loading={pending}>{pending ? "Saliendo…" : "Finalizar suplantación"}</Button> : undefined}>Las acciones se registran en auditoría.</InlineFeedback>; }
export function SubscriptionGate({ allowed, children, action }: { allowed: boolean; children: ReactNode; action?: ReactNode }) { return allowed ? <>{children}</> : <InlineFeedback tone="warning" title="Suscripción requerida" action={action}>Revisa el estado de la suscripción para continuar.</InlineFeedback>; }
export function ModuleLockedState({ moduleName, action }: { moduleName: string; action?: ReactNode }) { return <InlineFeedback tone="info" title={`${moduleName} no está habilitado`} action={action}>Solicita la activación a un administrador de la empresa.</InlineFeedback>; }

/**
 * Aviso en línea. Reenvía a `InlineNote` del sistema.
 *
 * Los cuatro tonos coinciden uno a uno. `loading` se conserva en la firma
 * porque forma parte del contrato público, pero ninguna pantalla lo pasa hoy;
 * cuando llegue en `true` el aviso se muestra en tono neutro, que es lo
 * correcto para algo que todavía no ha terminado de resolverse.
 */
export function InlineFeedback({ tone, title, children, action, loading = false }: { tone: "info" | "success" | "warning" | "danger"; title: string; children?: ReactNode; action?: ReactNode; loading?: boolean }) {
  return <InlineNote tone={loading ? "neutral" : tone} title={title} action={action}>{children}</InlineNote>;
}
