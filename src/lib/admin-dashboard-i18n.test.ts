import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { catalogs, translate } from "@/i18n";
import { auditActionLabel } from "./audit-labels";
import { formatDateTime, planTierLabel, subscriptionStatusInfo } from "./platform-labels";
import { moduleLabels, roleLabels } from "./ui-labels";

describe("company dashboard language support", () => {
  it("provides both languages for every dashboard, role and module label", () => {
    const source = readFileSync("src/components/admin/admin-module-dashboard.tsx", "utf8");
    const keys = [...source.matchAll(/"(admin\.dashboard\.[^"]+)"/g)].map(match => match[1]);
    keys.push(...Object.keys(moduleLabels).map(key => `module.${key}`), ...Object.keys(roleLabels).map(key => `role.${key}`));
    for (const key of keys) for (const locale of ["es", "en"] as const) expect(catalogs[locale][key], `${locale}: ${key}`).toBeTruthy();
  });
  it("switches headings and interpolated company names in both directions", () => {
    for (const locale of ["es", "en", "es"] as const) {
      expect(translate(locale, "admin.dashboard.companyDashboard")).toBe(locale === "en" ? "Company dashboard" : "Dashboard de la empresa");
      expect(translate(locale, "admin.dashboard.description", { company: "DATALINK" })).toContain("DATALINK");
    }
  });
  it("localizes dates, plans, subscription states and audit actions", () => {
    expect(planTierLabel("enterprise", "en")).toBe("Enterprise");
    expect(planTierLabel("enterprise", "es")).toBe("Empresarial");
    expect(subscriptionStatusInfo("past_due", "en").label).toBe("Past due");
    expect(auditActionLabel(null, "en")).toBe("Action not recorded");
    expect(auditActionLabel(null, "es")).toBe("Acción sin registrar");
    expect(formatDateTime("2026-09-08T12:00:00Z", "en")).not.toBe(formatDateTime("2026-09-08T12:00:00Z", "es"));
  });
});
