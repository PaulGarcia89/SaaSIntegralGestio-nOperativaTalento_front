"use client";

import { useUiText } from "@/components/ui-copy";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gavel, Users } from "lucide-react";
import { createDecisionCommittee, fetchDecisionCommittee, finalizeDecisionCommittee, voteDecisionCommittee } from "@/lib/backend";
import type { InterviewRecommendation } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import { technicalLabel } from "@/lib/ui-labels";
import { InlineFeedback } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DecisionCommitteeCard({ applicationId }: { applicationId: string }) {
  const uiText = useUiText();
  const queryClient = useQueryClient();
  const { tenantUsers, currentUser, can } = useAppStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [chairId, setChairId] = useState("");
  const [recommendation, setRecommendation] = useState<InterviewRecommendation>("YES");
  const [rationale, setRationale] = useState("");
  const [conflict, setConflict] = useState(false);
  const committee = useQuery({ queryKey: ["decision-committee", applicationId], queryFn: () => fetchDecisionCommittee(applicationId) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["decision-committee", applicationId] });
  const create = useMutation({
    mutationFn: () => createDecisionCommittee({
      applicationId,
      quorum: Math.max(1, Math.ceil(selected.length / 2)),
      members: selected.map((userId) => ({ userId, role: userId === chairId ? "CHAIR" : "MEMBER", isRequired: true })),
    }),
    onSuccess: refresh,
  });
  const vote = useMutation({
    mutationFn: (recuse: boolean) => voteDecisionCommittee(committee.data!.id, { vote: recommendation, rationale, conflictOfInterestDeclared: conflict, recuse }),
    onSuccess: async () => { setRationale(""); await refresh(); },
  });
  const finalize = useMutation({
    mutationFn: () => finalizeDecisionCommittee(committee.data!.id, { decision: recommendation, rationale }),
    onSuccess: async () => { setRationale(""); await refresh(); },
  });
  const ownMembership = committee.data?.members.find((item) => item.userId === currentUser.id);
  const votes = committee.data?.members.filter((item) => item.votedAt).length ?? 0;
  const operationError = create.error ?? vote.error ?? finalize.error;

  return <Card level={2}><CardHeader><CardTitle><span className="inline-flex items-center gap-2"><Gavel className="size-5" />{uiText("Comité de decisión")}</span></CardTitle></CardHeader><CardContent className="space-y-4">
    {committee.isLoading ? <p className="text-sm text-text-secondary">{uiText("Consultando comité…")}</p> : null}
    {!committee.data && committee.isSuccess ? can("applications.change_stage") ? <><p className="text-sm text-text-secondary">{uiText("Forma un panel para separar evaluación individual y decisión final, con quórum obligatorio.")}</p><div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-border-default p-3">{tenantUsers.map((user) => <label key={user.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(user.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id))} />{user.fullName}</label>)}</div>{selected.length ? <label className="space-y-2 text-sm font-medium">{uiText("Preside el comité")}<Select value={chairId || undefined} onValueChange={setChairId}><SelectTrigger><SelectValue placeholder={uiText("Selecciona responsable")} /></SelectTrigger><SelectContent>{tenantUsers.filter((user) => selected.includes(user.id)).map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName}</SelectItem>)}</SelectContent></Select></label> : null}<Button className="w-full" onClick={() => create.mutate()} disabled={selected.length < 2 || !chairId || create.isPending}><Users className="size-4" />{uiText("Crear comité")}</Button></> : <p className="text-sm text-text-secondary">{uiText("Aún no se ha formado un comité.")}</p> : null}
    {committee.data ? <><div className="flex items-center justify-between rounded-xl bg-surface-section p-3"><div><p className="font-semibold">{committee.data.members.length} {uiText(" integrantes")}</p><p className="text-xs text-text-secondary">{votes}/{committee.data.quorum} {uiText(" votos para quórum")}</p></div><Badge variant={committee.data.status === "DECIDED" ? "default" : "secondary"}>{committee.data.status === "DECIDED" ? "Decidido" : uiText("Abierto")}</Badge></div><ol className="space-y-2">{committee.data.members.map((member) => <li key={member.id} className="flex items-center justify-between gap-2 text-sm"><span>{member.user.firstName} {member.user.lastName}{member.role === "CHAIR" ? " · Presidencia" : ""}</span><span className="text-text-secondary">{member.recusedAt ? "Recusado" : member.vote ? technicalLabel(member.vote, uiText.locale) : uiText("Pendiente")}</span></li>)}</ol>{committee.data.status === "DECIDED" ? <InlineFeedback tone="success" title={uiText("Decisión: {{decision}}", { decision: technicalLabel(committee.data.finalDecision, uiText.locale) })}>{committee.data.rationale}</InlineFeedback> : ownMembership && ownMembership.role !== "OBSERVER" ? <><Recommendation value={recommendation} onChange={setRecommendation} /><label className="block space-y-2 text-sm font-medium">{uiText("Justificación")}<textarea className="field" rows={4} value={rationale} onChange={(event) => setRationale(event.target.value)} /></label><label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={conflict} onChange={(event) => setConflict(event.target.checked)} />{uiText("Declaro que revisé posibles conflictos de interés.")}</label><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => vote.mutate(false)} disabled={rationale.trim().length < 5 || vote.isPending}>{uiText("Registrar voto")}</Button><Button variant="ghost" onClick={() => vote.mutate(true)} disabled={rationale.trim().length < 5 || vote.isPending}>{uiText("Recusarme")}</Button>{ownMembership.role === "CHAIR" ? <Button onClick={() => finalize.mutate()} disabled={rationale.trim().length < 5 || finalize.isPending}>{uiText("Cerrar decisión")}</Button> : null}</div></> : <p className="text-sm text-text-secondary">{uiText("Puedes consultar el comité; solo sus miembros registran voto.")}</p>}</> : null}
    {operationError ? <InlineFeedback tone="danger" title={uiText("No fue posible completar la operación")}>{operationError instanceof Error ? operationError.message : uiText("Revisa miembros, quórum y evaluaciones firmadas.")}</InlineFeedback> : null}
  </CardContent></Card>;
}

function Recommendation({ value, onChange }: { value: InterviewRecommendation; onChange: (value: InterviewRecommendation) => void }) {
  const uiText = useUiText();
  return <label className="space-y-2 text-sm font-medium">{uiText("Recomendación")}<Select value={value} onValueChange={(next) => onChange(next as InterviewRecommendation)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STRONG_YES">{uiText("Avanzar con alta confianza")}</SelectItem><SelectItem value="YES">{uiText("Avanzar")}</SelectItem><SelectItem value="MIXED">{uiText("Revisar")}</SelectItem><SelectItem value="NO">{uiText("No avanzar")}</SelectItem></SelectContent></Select></label>;
}
