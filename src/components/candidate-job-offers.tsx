"use client";

import { useUiText } from "@/components/ui-copy";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, FileSignature, MessageSquareMore, X } from "lucide-react";
import { InlineFeedback } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { counterCandidateJobOffer, createCandidateOfferSigningLink, downloadCandidateJobOfferPdf, respondCandidateJobOffer } from "@/lib/backend";
import type { JobOfferDto } from "@/lib/contracts";
import { technicalLabel } from "@/lib/ui-labels";
import { useLocale } from "@/components/locale-provider";

export function CandidateJobOffers({ offers, onRefresh }: { offers: JobOfferDto[]; onRefresh: () => void }) {
  const uiText = useUiText();
  const [counterId, setCounterId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [counterSalary, setCounterSalary] = useState("");
  const [counterStart, setCounterStart] = useState("");
  const [reason, setReason] = useState("");
  const signing = useMutation({ mutationFn: createCandidateOfferSigningLink, onSuccess: ({ url }) => { window.location.href = url; } });
  const reject = useMutation({ mutationFn: (id: string) => respondCandidateJobOffer(id, { decision: "REJECT", reason: reason.trim() || undefined }), onSuccess: () => { setRejectId(null); setReason(""); onRefresh(); } });
  const counter = useMutation({ mutationFn: (id: string) => counterCandidateJobOffer(id, { salaryAmount: counterSalary ? Number(counterSalary) : undefined, employmentStartDate: counterStart ? new Date(`${counterStart}T12:00:00`).toISOString() : undefined, reason: reason.trim() }), onSuccess: () => { setCounterId(null); setCounterSalary(""); setCounterStart(""); setReason(""); onRefresh(); } });
  const { t, locale } = useLocale();
  const error = signing.error ?? reject.error ?? counter.error;

  return <section aria-labelledby="structured-offers-title" className="space-y-4"><div><h2 id="structured-offers-title" className="text-2xl font-semibold">{t("offers.title")}</h2><p className="text-sm text-muted-foreground">{t("offers.description")}</p></div>
    {offers.map((offer) => { const version = offer.versions.find((item) => item.version === offer.currentVersion) ?? offer.versions[0]; const canRespond = offer.status === "SENT"; return <Card key={offer.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{version.jobTitle}</CardTitle><p className="text-sm text-muted-foreground">{offer.application.vacancy.title} · {t("offers.version", { version: version.version })}</p></div><Badge>{offer.status}</Badge></div></CardHeader><CardContent className="space-y-4"><dl className="grid gap-3 sm:grid-cols-3"><Summary label={t("offers.compensation")} value={`${version.currency} ${Number(version.salaryAmount).toLocaleString(locale)} · ${technicalLabel(version.periodicity, uiText.locale)}`} /><Summary label={t("offers.startDate")} value={new Date(version.employmentStartDate).toLocaleDateString(locale)} /><Summary label={t("offers.validUntil")} value={new Date(version.validUntil).toLocaleDateString(locale)} /></dl>{Array.isArray(version.benefits) && version.benefits.length ? <div><p className="text-sm font-medium">{t("offers.benefits")}</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{version.benefits.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}{version.message ? <p className="whitespace-pre-line rounded-xl bg-secondary/30 p-4 text-sm">{version.message}</p> : null}{version.source === "CANDIDATE" && version.counterproposalReason ? <InlineFeedback tone="info" title={t("offers.counterSent")}>{version.counterproposalReason}</InlineFeedback> : null}{offer.status === "ACCEPTED" ? <InlineFeedback tone="success" title={t("offers.accepted")}>{t("offers.signed")}{offer.conversionWorkflowId ? ` ${t("offers.onboardingStarted")}` : ` ${t("offers.hrConverting")}`}</InlineFeedback> : null}{offer.status === "EXPIRED" ? <InlineFeedback tone="warning" title={t("offers.expired")}>{t("offers.expiredDetail")}</InlineFeedback> : null}
      <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => openPdf(offer.id, version.version)}><Download className="size-4" />{t("offers.downloadPdf")}</Button>{canRespond ? <Button onClick={() => signing.mutate(offer.id)} disabled={signing.isPending}><FileSignature className="size-4" />{t("offers.reviewSign")}</Button> : null}{canRespond ? <Button variant="secondary" onClick={() => { setCounterId(offer.id); setRejectId(null); setReason(""); }}><MessageSquareMore className="size-4" />{t("offers.counter")}</Button> : null}{canRespond ? <Button variant="ghost" onClick={() => { setRejectId(offer.id); setCounterId(null); setReason(""); }}><X className="size-4" />{t("offers.reject")}</Button> : null}</div>
      {counterId === offer.id ? <div className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">{t("offers.sendCounter")}</h3><div className="grid gap-3 sm:grid-cols-2"><Field label={t("offers.proposedSalary")} type="number" value={counterSalary} onChange={setCounterSalary} /><Field label={t("offers.proposedStart")} type="date" value={counterStart} onChange={setCounterStart} /></div><Reason value={reason} onChange={setReason} /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setCounterId(null)}>{t("actions.cancel")}</Button><Button onClick={() => counter.mutate(offer.id)} disabled={reason.trim().length < 5 || counter.isPending}>{t("offers.sendCounter")}</Button></div></div> : null}
      {rejectId === offer.id ? <div className="space-y-3 rounded-xl border border-destructive/30 p-4"><h3 className="font-semibold">{t("offers.rejectTitle")}</h3><Reason value={reason} onChange={setReason} /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setRejectId(null)}>{t("actions.cancel")}</Button><Button variant="destructive" onClick={() => reject.mutate(offer.id)} disabled={reject.isPending}>{t("offers.confirmReject")}</Button></div></div> : null}
    </CardContent></Card>; })}
    {!offers.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">{t("offers.none")}</p> : null}
    {error ? <InlineFeedback tone="danger" title={t("offers.actionFailed")}>{error instanceof Error ? error.message : t("offers.tryAgain")}</InlineFeedback> : null}
  </section>;
}

async function openPdf(offerId: string, version: number) { const blob = await downloadCandidateJobOfferPdf(offerId, version); const url = URL.createObjectURL(blob); window.open(url, "_blank", "noopener,noreferrer"); window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>; }
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="space-y-2 text-sm font-medium">{label}<Input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function Reason({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const uiText = useUiText(); return <label className="block space-y-2 text-sm font-medium"><Label>{uiText("Motivo o condiciones propuestas")}</Label><textarea rows={4} maxLength={4000} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border bg-background p-3" /></label>; }
