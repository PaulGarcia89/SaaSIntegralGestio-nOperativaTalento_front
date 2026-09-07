import { describe, expect, it } from "vitest";
import { PLAN_TIERS } from "@/lib/contracts";
import {
  PLAN_TIER_OPTIONS,
  TENANT_STATUS_OPTIONS,
  billingCycleLabel,
  formatDate,
  formatDateTime,
  formatPrice,
  humanizeCode,
  planTierInfo,
  planTierLabel,
  shortId,
  subscriptionStatusInfo,
  subscriptionStatusLabel,
  tenantStatusChangeWarning,
  tenantStatusInfo,
  tenantStatusLabel,
} from "@/lib/platform-labels";

describe("cobertura del contrato", () => {
  it("describe todos los planes que declara el backend", () => {
    for (const tier of PLAN_TIERS) {
      const info = planTierInfo(tier);
      expect(info.label).not.toBe(humanizeCode(tier));
      expect(info.detail.length).toBeGreaterThan(20);
    }
  });

  it("ofrece los planes como opciones de desplegable, en español", () => {
    expect(PLAN_TIER_OPTIONS.map((option) => option.value)).toEqual([...PLAN_TIERS]);
    for (const option of PLAN_TIER_OPTIONS) {
      expect(option.label).not.toBe(option.value);
    }
  });

  it("ofrece los tres estados de empresa como opciones", () => {
    expect(TENANT_STATUS_OPTIONS.map((option) => option.value)).toEqual(["active", "trial", "suspended"]);
  });
});

describe("códigos desconocidos", () => {
  it("se muestran legibles en vez de en crudo", () => {
    expect(planTierLabel("mega_plan")).toBe("Mega plan");
    expect(subscriptionStatusLabel("PAST_DUE")).toBe("Past due");
  });

  it("un estado que no reconocemos nunca se pinta de rojo", () => {
    expect(tenantStatusInfo("congelada").tone).toBe("neutral");
    expect(subscriptionStatusInfo("desconocido").tone).toBe("neutral");
  });

  it("un valor ausente dice que falta el dato, no queda vacío", () => {
    expect(tenantStatusLabel(undefined)).toBe("Sin dato");
    expect(planTierLabel("")).toBe("Sin dato");
    expect(billingCycleLabel(null)).toBe("Sin dato");
  });
});

describe("tono por significado", () => {
  it("suspendida avisa, no alarma: los datos siguen ahí", () => {
    expect(tenantStatusInfo("suspended").tone).toBe("warning");
  });

  it("un pago vencido sí es un problema real", () => {
    expect(subscriptionStatusInfo("past_due").tone).toBe("danger");
  });
});

describe("aviso al cambiar el estado de una empresa", () => {
  it("suspender avisa de que corta el acceso a todos", () => {
    const warning = tenantStatusChangeWarning("active", "suspended");
    expect(warning?.detail).toContain("ninguna persona");
  });

  it("reactivar también se anuncia: devuelve accesos", () => {
    expect(tenantStatusChangeWarning("suspended", "active")).not.toBeNull();
  });

  it("no avisa cuando el estado no cambia", () => {
    expect(tenantStatusChangeWarning("active", "active")).toBeNull();
    expect(tenantStatusChangeWarning("suspended", "suspended")).toBeNull();
  });

  it("no inventa avisos para cambios inocuos", () => {
    expect(tenantStatusChangeWarning("trial", "active")).toBeNull();
  });
});

describe("formatos", () => {
  it("los importes llevan moneda y separadores", () => {
    expect(formatPrice(1250.5)).toContain("1250,50");
    expect(formatPrice("49")).toContain("49,00");
  });

  it("un importe ausente no imprime NaN", () => {
    expect(formatPrice(null)).toBe("—");
    expect(formatPrice("")).toBe("—");
  });

  it("una moneda que Intl no conoce no tumba la pantalla", () => {
    expect(formatPrice(10, "XYZ")).toContain("10,00");
  });

  it("las fechas se leen en español", () => {
    expect(formatDate("2026-08-01")).not.toBe("2026-08-01");
    expect(formatDateTime("2026-08-01T10:30:00.000Z")).not.toBe("2026-08-01T10:30:00.000Z");
  });

  it("una fecha ilegible se muestra tal cual en vez de «Invalid Date»", () => {
    expect(formatDate("mañana")).toBe("mañana");
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("shortId", () => {
  it("acorta un UUID en vez de soltarlo entero", () => {
    const id = "8f14e45f-ceea-467a-9f5a-1d2c3b4a5e6f";
    expect(shortId(id)).toBe("8f14e45f…");
    expect(shortId(id).length).toBeLessThan(id.length);
  });

  it("deja intacto lo que ya es corto", () => {
    expect(shortId("acme")).toBe("acme");
    expect(shortId(undefined)).toBe("—");
  });
});
