"use client";

import Link from "next/link";
import { ModuleHeader, SectionCard, InfoList, SplitPanel } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

export default function CompanySettingsPage() {
  const { t } = useLocale();
  return (
    <>
      <ModuleHeader
        eyebrow={t("companySettings.eyebrow")}
        title={t("companySettings.title")}
        description={t("companySettings.description")}
        actions={
            <Button asChild>
            <Link href="/admin/company/career-portal">{t("companySettings.portalAction")}</Link>
          </Button>
        }
        metrics={[
          { label: t("companySettings.domains"), value: "2", detail: t("companySettings.domainsDetail") },
          { label: t("companySettings.templates"), value: "14", detail: t("companySettings.templatesDetail") },
          { label: t("companySettings.integrations"), value: "5", detail: t("companySettings.integrationsDetail") },
        ]}
      />
      <SplitPanel
        left={
          <SectionCard title={t("companySettings.blocks")} subtitle={t("companySettings.businessBase")}>
            <InfoList
              items={[
                { title: t("companySettings.identity"), description: t("companySettings.identityDescription"), badge: t("companySettings.brand") },
                { title: t("companySettings.processParameters"), description: t("companySettings.processDescription"), badge: t("companySettings.flow") },
                { title: t("companySettings.integrationsTitle"), description: t("companySettings.integrationsDescription"), badge: t("companySettings.connection") },
              ]}
            />
          </SectionCard>
        }
        right={
          <SectionCard title={t("companySettings.guardrails")} subtitle={t("companySettings.governance")}>
            <InfoList
              items={[
                { title: t("companySettings.changeControl"), description: t("companySettings.changeDescription") },
                { title: t("companySettings.branchSeparation"), description: t("companySettings.branchDescription"), badge: t("companySettings.multiBranch") },
                { title: t("companySettings.accessPolicies"), description: t("companySettings.accessDescription"), badge: "RBAC" },
              ]}
            />
          </SectionCard>
        }
      />
    </>
  );
}
