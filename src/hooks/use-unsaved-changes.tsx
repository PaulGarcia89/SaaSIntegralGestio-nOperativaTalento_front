"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DIRTY_EVENT = "talentos:dirty-state";
type DirtyState = { enabled: boolean; formId: string };

export function useUnsavedChanges(enabled: boolean, formId: string) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent<DirtyState>(DIRTY_EVENT, { detail: { enabled, formId } }));
    if (!enabled) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => { window.removeEventListener("beforeunload", handleBeforeUnload); window.dispatchEvent(new CustomEvent<DirtyState>(DIRTY_EVENT, { detail: { enabled: false, formId } })); };
  }, [enabled, formId]);
}

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [dirtyFormId, setDirtyFormId] = useState("");
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const handleDirty = (event: Event) => {
      const detail = (event as CustomEvent<DirtyState>).detail;
      const nextDirty = Boolean(detail?.enabled);
      setDirty(nextDirty);
      setDirtyFormId(nextDirty ? detail.formId : "");
      if (!nextDirty && target) { router.push(target); setTarget(null); }
    };
    const interceptLink = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented || event.button !== 0) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.origin !== window.location.origin) return;
      event.preventDefault(); setTarget(`${anchor.pathname}${anchor.search}${anchor.hash}`);
    };
    window.addEventListener(DIRTY_EVENT, handleDirty);
    document.addEventListener("click", interceptLink, true);
    return () => { window.removeEventListener(DIRTY_EVENT, handleDirty); document.removeEventListener("click", interceptLink, true); };
  }, [dirty, router, target]);

  const discard = () => { const destination = target; setDirty(false); setTarget(null); if (destination) router.push(destination); };
  const save = () => { const form = document.getElementById(dirtyFormId); if (form instanceof HTMLFormElement) form.requestSubmit(); };

  return <>
    {children}
    {dirty ? <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-950 shadow-lg" role="status">Cambios sin guardar</div> : null}
    <UnsavedChangesDialog open={Boolean(target)} onContinue={() => setTarget(null)} onDiscard={discard} onSave={save} />
  </>;
}

export function UnsavedChangesDialog({ open, onContinue, onDiscard, onSave, saving }: { open: boolean; onContinue: () => void; onDiscard: () => void; onSave: () => void; saving?: boolean }) {
  return <Dialog open={open} onOpenChange={(next) => { if (!next) onContinue(); }}><DialogContent><DialogHeader><DialogTitle>Hay cambios sin guardar</DialogTitle><DialogDescription>Elige qué hacer antes de salir de esta pantalla.</DialogDescription></DialogHeader><div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={onContinue}>Seguir editando</Button><Button type="button" variant="secondary" onClick={onDiscard}>Descartar</Button><Button type="button" onClick={onSave} disabled={saving} data-loading={saving}>{saving ? "Guardando…" : "Guardar y salir"}</Button></div></DialogContent></Dialog>;
}
