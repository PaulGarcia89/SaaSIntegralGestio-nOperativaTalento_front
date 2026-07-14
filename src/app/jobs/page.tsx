import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, MapPin, Users } from "lucide-react";
import { jobs } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const featuredJob = jobs[0];

export default function JobsPortalPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 pb-10 pt-2 md:gap-10 md:pb-14">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/92 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.28)]">
        <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8 p-6 md:p-8 xl:p-10">
            <div className="space-y-4">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Portal de empleos
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                  Vacantes mejor presentadas, marca empleadora mas clara y una experiencia publica lista para convertir.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  Encuentra oportunidades por area, ubicacion y modalidad con una aplicacion clara y directa desde cualquier dispositivo.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Vacantes activas</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{jobs.length}</p>
                <p className="mt-2 text-sm text-muted-foreground">Oportunidades visibles en Florida</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Sedes</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">4</p>
                <p className="mt-2 text-sm text-muted-foreground">Miami, Orlando, Tampa y Jacksonville</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Modalidades</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">3</p>
                <p className="mt-2 text-sm text-muted-foreground">Presencial, hibrido y remoto</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="sm:min-w-44">
                <Link href="/apply">
                  Aplicar ahora
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="sm:min-w-44">
                <Link href="#vacantes-disponibles">Ver vacantes</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-5 border-t border-border/60 bg-secondary/20 p-6 md:p-8 xl:border-l xl:border-t-0 xl:p-10">
            <Card className="overflow-hidden border-border/70 bg-card/95">
              <div className="relative min-h-[280px]">
                <Image
                  src={featuredJob?.image ?? ""}
                  alt={`Imagen destacada de la vacante ${featuredJob?.title ?? ""}`}
                  fill
                  sizes="(min-width: 1280px) 40vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  <Badge className="rounded-full border border-white/25 bg-white/88 text-slate-950">{featuredJob?.area}</Badge>
                  <Badge className="rounded-full border border-white/20 bg-slate-950/55 text-white">{featuredJob?.status}</Badge>
                </div>
                <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/75">Vacante destacada</p>
                  <h2 className="max-w-lg text-2xl font-semibold leading-tight">{featuredJob?.title}</h2>
                  <div className="flex flex-wrap gap-2 text-sm text-white/85">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                      <MapPin className="size-4" />
                      {featuredJob?.location}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                      <BriefcaseBusiness className="size-4" />
                      {featuredJob?.mode}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                      <Users className="size-4" />
                      {featuredJob?.applicants} postulantes
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="vacantes-disponibles" className="space-y-5">
        <div className="space-y-3">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Vacantes disponibles
          </Badge>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Explora oportunidades por area y ubicacion.</h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                Revisa vacantes activas con su informacion clave y entra directo al detalle de cada oportunidad.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{jobs.length} vacantes visibles en esta demo</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="overflow-hidden border-border/70 bg-card/92 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.26)]">
              <div className="relative h-60 overflow-hidden">
                <Image
                  src={job.image ?? ""}
                  alt={`Imagen representativa de la vacante ${job.title}`}
                  fill
                  sizes="(min-width: 1536px) 30vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <Badge className="rounded-full border border-white/25 bg-white/90 text-slate-950">{job.area}</Badge>
                  <Badge className="rounded-full border border-white/20 bg-slate-950/55 text-white">{job.status}</Badge>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="max-w-md text-2xl font-semibold leading-tight text-white">{job.title}</h3>
                </div>
              </div>

              <CardContent className="space-y-5 p-6">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/30 px-3 py-1.5">
                    <BriefcaseBusiness className="size-4" />
                    {job.mode}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/30 px-3 py-1.5">
                    <MapPin className="size-4" />
                    {job.location}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/30 px-3 py-1.5">
                    <Users className="size-4" />
                    {job.applicants} postulantes
                  </span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Responsable</p>
                  <p className="mt-2 font-medium text-foreground">{job.owner}</p>
                </div>

                <Button asChild className="w-full">
                  <Link href="/apply">
                    Ver vacante
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
