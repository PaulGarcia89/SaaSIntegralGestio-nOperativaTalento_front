"use client";

import Link from "next/link";
import { Clock3, HelpCircle, Search, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { trackProductEvent } from "@/lib/product-analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchMyPreferences, updateMyPreference } from "@/lib/backend";
import { useLocale } from "@/components/locale-provider";

type AllowedRoute = { href: string; label: string; group: string };

const roleActionLabels: Record<string, string[]> = {
  reclutador: ["Vacantes", "Candidatos", "Entrevistas"],
  rrhh: ["Vacantes", "Incorporaciones", "Gestionar cursos"],
  supervisor: ["Empleados", "Incorporaciones", "Productividad"],
  instructor: ["Gestionar cursos", "Rutas y cumplimiento", "Resultados"],
  encargado_inventario: ["Inventario", "Almacén y stock", "Mantenimiento"],
  empleado: ["Mis activos", "Cursos", "Certificados"],
};

const glossary = [
  ["Flujo de selección", "Tablero de las etapas configuradas para una vacante y sus postulaciones."],
  ["Talent CRM", "Base reutilizable de candidatos, segmentos, etiquetas y campañas con consentimiento."],
  ["Ficha de evaluación", "Formulario estructurado para evaluar una entrevista con criterios y evidencias."],
  ["SCORM", "Paquete de aprendizaje interoperable que un LMS puede cargar y registrar."],
  ["Firma electrónica", "Evidencia de aceptación asociada a documento, participante y fecha."],
  ["IA asistida", "Sugerencias explicables para apoyar una decisión humana; no descarta candidatos automáticamente."],
  ["Automatización", "Regla que responde a un evento y ejecuta acciones auditables después de ser activada."],
] as const;

export function TaskNavigation({ routes, pathname, role, onSearch }: { routes: AllowedRoute[]; pathname: string; role: string; onSearch: () => void }) {
  const { t } = useLocale();
  const routeLabel = (route: AllowedRoute) => {
    const key = `nav.${route.label}`;
    const translated = t(key);
    return translated === key ? route.label : translated;
  };
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchMyPreferences()
      .then((preferences) => {
        if (cancelled) return;
        const stored = preferences[`task-navigation:${role}`] as { favorites?: string[]; recent?: string[] } | undefined;
        setFavorites(stored?.favorites ?? []);
        setRecent([pathname, ...(stored?.recent ?? []).filter((href) => href !== pathname)].slice(0, 5));
      })
      .catch(() => {
        if (cancelled) return;
        setRecent((current) => [pathname, ...current.filter((href) => href !== pathname)].slice(0, 5));
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, role]);

  useEffect(() => {
    void updateMyPreference(`task-navigation:${role}`, { favorites, recent }).catch(() => undefined);
  }, [favorites, recent, role]);

  const routeByHref = useMemo(() => new Map(routes.map((route) => [route.href, route])), [routes]);
  const quick = (roleActionLabels[role] ?? ["Inicio", "Alertas", "Mi perfil"]).map((label) => routes.find((route) => route.label === label)).filter((route): route is AllowedRoute => Boolean(route));
  const toggleFavorite = (href: string) => {
    const enabled = !favorites.includes(href);
    const nextFavorites = enabled ? [...favorites, href] : favorites.filter((item) => item !== href);
    setFavorites(nextFavorites);
    void updateMyPreference(`task-navigation:${role}`, { favorites: nextFavorites, recent }).catch(() => undefined);
    trackProductEvent({ name: "navigation_favorite_toggled", href, enabled });
  };

  return <><section aria-label={t("tasks.frequent")} className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr]"><TaskCard icon={<Sparkles className="size-4" />} title={t("tasks.quickActions")}>{quick.length ? quick.map((route) => <Button key={route.href} asChild size="sm" variant="secondary" onClick={() => trackProductEvent({ name: "quick_action_opened", action: route.href, role })}><Link href={route.href}>{routeLabel(route)}</Link></Button>) : <p className="text-sm text-text-secondary">{t("tasks.noAssigned")}</p>}</TaskCard><TaskCard icon={<Clock3 className="size-4" />} title={t("tasks.recent")}>{recent.map((href) => routeByHref.get(href)).filter((route): route is AllowedRoute => Boolean(route)).map((route) => <Button key={route.href} asChild size="sm" variant="ghost"><Link href={route.href}>{routeLabel(route)}</Link></Button>)}{!recent.length ? <p className="text-sm text-text-secondary">{t("tasks.visitsAppear")}</p> : null}</TaskCard><TaskCard icon={<Star className="size-4" />} title={t("tasks.favorites")}>{favorites.map((href) => routeByHref.get(href)).filter((route): route is AllowedRoute => Boolean(route)).map((route) => <Button key={route.href} asChild size="sm" variant="ghost"><Link href={route.href}>{routeLabel(route)}</Link></Button>)}<div className="flex gap-2"><Button size="sm" variant="secondary" onClick={onSearch}><Search className="size-4" />{t("tasks.search")}</Button><Button size="sm" variant="secondary" onClick={() => setHelpOpen(true)}><HelpCircle className="size-4" />{t("tasks.glossary")}</Button></div></TaskCard></section><div className="flex flex-wrap gap-2" aria-label={t("tasks.manageFavorites")}>{routes.slice(0, 10).map((route) => <button key={route.href} type="button" aria-pressed={favorites.includes(route.href)} onClick={() => toggleFavorite(route.href)} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border-default px-3 text-xs font-medium text-text-secondary hover:bg-surface-interactive"><Star className={`size-3.5 ${favorites.includes(route.href) ? "fill-primary text-primary" : ""}`} />{routeLabel(route)}</button>)}</div><Dialog open={helpOpen} onOpenChange={setHelpOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{t("tasks.guide")}</DialogTitle><DialogDescription>{t("tasks.guideDescription")}</DialogDescription></DialogHeader><dl className="grid gap-3 sm:grid-cols-2">{glossary.map(([term, definition]) => <div key={term} className="rounded-xl border border-border-default p-3"><dt className="font-semibold">{term}</dt><dd className="mt-1 text-sm text-text-secondary">{definition}</dd></div>)}</dl></DialogContent></Dialog></>;
}

function TaskCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <Card level={2}><CardContent className="space-y-3 p-4"><h2 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h2><div className="flex flex-wrap gap-2">{children}</div></CardContent></Card>;
}
