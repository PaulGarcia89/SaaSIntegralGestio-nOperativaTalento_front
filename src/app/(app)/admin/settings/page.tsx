"use client";

import { useUiText } from "@/components/ui-copy";

import { CapabilityPage } from "@/components/capability-page";
export default function Page() {
  const uiText = useUiText(); return <CapabilityPage title={uiText("Configuración general")} description={uiText("Parámetros globales, políticas operativas y configuración transversal del SaaS.")} capability="Gobierno SaaS" />; }
