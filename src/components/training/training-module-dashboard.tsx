"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  LineChart,
  Route,
  Sparkles,
} from "lucide-react";
import { PageHeader, PageSection } from "@/components/system";
import { Button } from "@/components/ui/button";
import { AdminTrainingPanel, LearnerTrainingPanel } from "@/components/training/training-module-panel";
import { useAppStore } from "@/store/app-store";

/**
 * Dashboard de Aprendizaje: primera pantalla del módulo.
 *
 * El panel (estado, atención, siguiente paso) ya existía dentro del centro de
 * aprendizaje, encima de las pestañas de operación. Separarlo en su propia
 * ruta hace dos cosas: el menú del módulo empieza por «Dashboard», como en
 * todos los demás, y `/training` queda para operar —cursos, asignaciones,
 * lanzamientos— sin que haya que pasar por el resumen cada vez.
 *
 * Quien administra ve el estado del PROGRAMA; quien aprende ve SU formación.
 * Igual que antes, nunca los dos a la vez.
 */

type Destino = {
  href: string;
  label: string;
  description: string;
  icon: typeof BookOpen;
  visible: boolean;
};

export function TrainingModuleDashboard() {
  const { can } = useAppStore();
  const canManageTraining = can("training.manage");

  const destinos: Destino[] = [
    {
      href: "/training",
      label: canManageTraining ? "Cursos y asignaciones" : "Mis cursos",
      description: canManageTraining
        ? "Prioridades, asignaciones, lanzamientos y supervisión del programa."
        : "Continuar donde lo dejaste y ver qué te falta.",
      icon: BookOpen,
      visible: true,
    },
    {
      href: "/training/evaluations",
      label: "Evaluaciones",
      description: "Pruebas pendientes y resultados de cada intento.",
      icon: ClipboardCheck,
      visible: can("training.view"),
    },
    {
      href: "/training/certificates",
      label: "Certificados",
      description: "Los que ya se emitieron y los que están por vencer.",
      icon: Award,
      visible: can("training.view"),
    },
    {
      href: "/training/results",
      label: "Resultados",
      description: "Avance por persona, curso y sucursal.",
      icon: LineChart,
      visible: can("training.view"),
    },
    {
      href: "/training/content",
      label: "Gestionar cursos",
      description: "Crear, revisar, aprobar y publicar contenido.",
      icon: GraduationCap,
      visible: canManageTraining,
    },
    {
      href: "/training/paths",
      label: "Rutas y cumplimiento",
      description: "Itinerarios obligatorios y quién los tiene al día.",
      icon: Route,
      visible: canManageTraining,
    },
    {
      href: "/training/intelligence",
      label: "Inteligencia",
      description: "Recomendaciones y señales sobre el programa.",
      icon: Sparkles,
      visible: canManageTraining,
    },
  ].filter((destino) => destino.visible);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Aprendizaje"
        title="Dashboard de aprendizaje"
        description={
          canManageTraining
            ? "Cómo va el programa de formación, qué necesita atención y por dónde seguir."
            : "Tu formación: qué continuar, qué debes y qué vence pronto."
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/training">{canManageTraining ? "Abrir cursos y asignaciones" : "Abrir mis cursos"}</Link>
          </Button>
        }
      />

      {canManageTraining ? <AdminTrainingPanel /> : <LearnerTrainingPanel />}

      <PageSection title="Operaciones del módulo" description="Cada pantalla dice para qué sirve, con icono y texto.">
        <ul className="grid gap-3 [&>li]:min-w-0 sm:grid-cols-2 xl:grid-cols-3">
          {destinos.map(({ href, label, description, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex h-full min-h-[var(--control-h-touch)] items-start gap-3 rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-ink-2"
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 font-medium text-ink-1">
                    {label}
                    <ArrowRight className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-2">{description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PageSection>
    </div>
  );
}
