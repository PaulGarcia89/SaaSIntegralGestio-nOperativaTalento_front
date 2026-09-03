"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InlineFeedback } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateHiringContract } from "@/lib/backend";
import type { HiringContractDto } from "@/lib/contracts";
import { hiringPriorityLabel } from "@/lib/hiring-ux";
import { useAppStore } from "@/store/app-store";

export function HiringContractMetadataEditor({ contract }: { contract: HiringContractDto }) {
  const { can } = useAppStore();
  const canUpdate = can("applications.update");
  const client = useQueryClient();
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">((contract.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") ?? "MEDIUM");
  const [deadlineAt, setDeadlineAt] = useState(contract.deadlineAt ? contract.deadlineAt.slice(0, 10) : "");
  const update = useMutation({ mutationFn: () => updateHiringContract(contract.id, { priority, deadlineAt: deadlineAt || null }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["hiring-contract", contract.id] }); await client.invalidateQueries({ queryKey: ["hiring-contracts"] }); } });

  if (!canUpdate || !["DRAFT", "DATA_REVIEW"].includes(contract.status)) return null;

  return <Card level={2}><CardHeader><CardTitle>Prioridad y fecha límite</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-text-secondary">Estos datos guían la cola de trabajo de RRHH y quedan guardados en la contratación.</p><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium" htmlFor="hiring-priority">Prioridad<select id="hiring-priority" value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} className="h-10 w-full rounded-xl border border-border-default bg-surface-elevated px-3"><option value="URGENT">{hiringPriorityLabel("URGENT")}</option><option value="HIGH">{hiringPriorityLabel("HIGH")}</option><option value="MEDIUM">{hiringPriorityLabel("MEDIUM")}</option><option value="LOW">{hiringPriorityLabel("LOW")}</option></select></label><label className="space-y-2 text-sm font-medium" htmlFor="hiring-deadline">Fecha límite<input id="hiring-deadline" type="date" value={deadlineAt} onChange={(event) => setDeadlineAt(event.target.value)} className="h-10 w-full rounded-xl border border-border-default bg-surface-elevated px-3" /></label></div>{update.isError ? <InlineFeedback tone="danger" title="No se pudieron guardar los cambios">{update.error instanceof Error ? update.error.message : "Revisa los datos e inténtalo nuevamente."}</InlineFeedback> : null}{update.isSuccess ? <InlineFeedback tone="success" title="Cambios guardados">La prioridad y la fecha límite quedaron persistidas.</InlineFeedback> : null}<div className="flex justify-end"><Button onClick={() => update.mutate()} disabled={update.isPending}>{update.isPending ? "Guardando…" : "Guardar cambios"}</Button></div></CardContent></Card>;
}
