"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, Building2, CalendarDays, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AsyncState } from "@/components/async-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { verifyPublicTrainingCertificate } from "@/lib/backend";

export function TrainingCertificateVerification({ code }: { code: string }) {
  const query = useQuery({
    queryKey: ["public-training-certificate", code],
    queryFn: () => verifyPublicTrainingCertificate(code),
  });

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#f3efe4] px-5 py-12 text-[#19322d]">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#315c50_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="relative w-full max-w-3xl">
        {query.isLoading ? <AsyncState state="loading" title="Verificando credencial" /> : null}
        {query.isError ? <Card><CardContent className="py-14"><AsyncState state="error" title="Credencial no encontrada" onRetry={() => void query.refetch()} /><Button asChild variant="secondary" className="mt-4 w-full"><Link href="/">Volver al inicio</Link></Button></CardContent></Card> : null}
        {query.data ? (
          <Card className="overflow-hidden border-[#315c50]/30 bg-[#fffdf7] shadow-[0_28px_80px_rgba(25,50,45,0.18)]">
            <div className="h-3 bg-[linear-gradient(90deg,#d9a441,#315c50,#d9a441)]" />
            <CardContent className="p-7 sm:p-12">
              <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-xs font-bold uppercase tracking-[0.26em] text-[#9b6b13]">Credencial verificable</p><h1 className="mt-3 font-serif text-4xl font-semibold">Certificado de aprendizaje</h1></div>
                <div className="flex size-20 items-center justify-center rounded-full border-2 border-[#d9a441] bg-[#fff7d9]"><Award className="size-10 text-[#9b6b13]" /></div>
              </div>
              <div className="my-8 border-y border-[#315c50]/15 py-8">
                <p className="text-sm text-[#58716a]">Otorgado a</p>
                <p className="mt-1 font-serif text-3xl font-semibold">{query.data.learnerName}</p>
                <p className="mt-5 text-sm text-[#58716a]">Por completar</p>
                <p className="mt-1 text-xl font-semibold">{query.data.title}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail icon={<Building2 />} label="Organización" value={query.data.organization} />
                <Detail icon={<ShieldCheck />} label="Número" value={query.data.certificateNumber} />
                <Detail icon={<CalendarDays />} label="Emisión" value={new Date(query.data.issuedAt).toLocaleDateString("es", { dateStyle: "long" })} />
                <Detail icon={<CalendarDays />} label="Vigencia" value={query.data.expiresAt ? new Date(query.data.expiresAt).toLocaleDateString("es", { dateStyle: "long" }) : "Sin vencimiento"} />
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#e7efe9] p-5">
                <div className="flex items-center gap-3"><CheckCircle2 className="size-6 text-[#247053]" /><div><p className="font-semibold">Verificación oficial</p><p className="font-mono text-xs text-[#58716a]">{query.data.verificationCode}</p></div></div>
                <Badge variant={query.data.status === "VALID" ? "success" : "destructive"}>{query.data.status === "VALID" ? "Vigente" : query.data.status === "EXPIRED" ? "Vencido" : query.data.status === "RENEWED" ? "Renovado" : "Revocado"}</Badge>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-3 rounded-xl border border-[#315c50]/10 p-4"><span className="mt-0.5 [&>svg]:size-5">{icon}</span><div><p className="text-xs text-[#58716a]">{label}</p><p className="mt-1 font-medium">{value}</p></div></div>;
}
