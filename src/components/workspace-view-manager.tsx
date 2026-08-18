"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FolderUp, Save, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createWorkspaceView, deleteWorkspaceView, fetchWorkspaceViews } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ViewConfig = Record<string, unknown>;

function downloadConfig(name: string, payload: ViewConfig) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name.toLowerCase().replace(/[^a-z0-9]+/gi, "-") || "vista"}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function WorkspaceViewManager({
  module,
  screen,
  workspaceKey,
  getConfig,
  onApply,
}: {
  module: string;
  screen: string;
  workspaceKey?: string;
  getConfig: () => ViewConfig;
  onApply: (config: ViewConfig) => void;
}) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [shared, setShared] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const queryKey = ["workspace-views", module, screen, workspaceKey];
  const views = useQuery({ queryKey, queryFn: () => fetchWorkspaceViews(module, screen, workspaceKey) });
  const save = useMutation({
    mutationFn: () => createWorkspaceView({ module, screen, workspaceKey, name: name.trim(), config: getConfig(), isShared: shared, isDefault }),
    onSuccess: async () => { setName(""); setShared(false); setIsDefault(false); toast.success("Vista guardada en Railway"); await queryClient.invalidateQueries({ queryKey }); },
    onError: () => toast.error("No fue posible guardar la vista"),
  });
  const remove = useMutation({
    mutationFn: deleteWorkspaceView,
    onSuccess: async () => { toast.success("Vista eliminada"); await queryClient.invalidateQueries({ queryKey }); },
    onError: () => toast.error("Solo la persona creadora puede eliminar esta vista"),
  });

  async function importConfig(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as ViewConfig;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("invalid");
      onApply(parsed);
      toast.success("Configuración importada. Guárdala si quieres mantenerla.");
    } catch {
      toast.error("El archivo no contiene una configuración de vista válida");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return <section aria-label="Vistas y preferencias" className="space-y-3 rounded-2xl border border-border-default bg-surface-elevated p-4">
    <div className="flex flex-wrap items-center gap-2">
      {views.data?.map((view) => <div key={view.id} className="flex items-center rounded-full border border-border-default bg-background">
        <button type="button" className="min-h-10 px-3 text-sm font-medium" onClick={() => onApply(view.config)}>{view.name}{view.isDefault ? <span className="ml-1 text-xs text-text-secondary">Predeterminada</span> : null}{view.isShared ? <Share2 className="ml-1.5 inline size-3.5 text-text-secondary" aria-label="Compartida" /> : null}</button>
        <button type="button" aria-label={`Exportar ${view.name}`} className="min-h-10 border-l px-2 text-text-secondary" onClick={() => downloadConfig(view.name, view.config)}><Download className="size-4" /></button>
        <button type="button" aria-label={`Eliminar ${view.name}`} className="min-h-10 border-l px-2 text-text-secondary" onClick={() => remove.mutate(view.id)}><Trash2 className="size-4" /></button>
      </div>)}
      {!views.isLoading && !views.data?.length ? <p className="text-sm text-text-secondary">Aún no hay vistas guardadas para este workspace.</p> : null}
    </div>
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Nombre de la vista" className="lg:max-w-xs" />
      <label className="flex min-h-10 items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={shared} onChange={(event) => setShared(event.target.checked)} />Compartir con el workspace</label>
      <label className="flex min-h-10 items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />Usar como predeterminada</label>
      <Button variant="secondary" disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}><Save className="size-4" />Guardar configuración</Button>
      <Button variant="ghost" onClick={() => downloadConfig("configuracion-actual", getConfig())}><Download className="size-4" />Exportar actual</Button>
      <Button variant="ghost" onClick={() => fileInput.current?.click()}><FolderUp className="size-4" />Importar</Button>
      <input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => void importConfig(event.target.files?.[0])} />
    </div>
  </section>;
}
