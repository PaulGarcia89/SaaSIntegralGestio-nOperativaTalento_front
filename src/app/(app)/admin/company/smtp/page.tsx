"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompanyEmailSettings } from "@/components/company-email-settings";
import { PageHeader } from "@/components/system";
import { Button } from "@/components/ui/button";
import { useUiText } from "@/components/ui-copy";
import { useAppStore } from "@/store/app-store";

export default function CompanySmtpPage() {
  const uiText = useUiText();
  const { currentTenant } = useAppStore();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uiText("Configuración de empresa")}
        title={uiText("Correo saliente (SMTP)")}
        description={uiText("Configura desde qué dirección salen las invitaciones, las ofertas y los recordatorios de la empresa.")}
        actions={<Button asChild variant="outline"><Link href="/admin/company"><ArrowLeft className="size-4" />{uiText("Volver a configuración")}</Link></Button>}
      />
      <CompanyEmailSettings key={currentTenant.id} />
    </div>
  );
}
