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
  defaultRenewalDate,
  planCatalogCode,
  planLimitBreaches,
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

describe("correspondencia con el catálogo del backend", () => {
  it("traduce cada plan al código del catálogo", () => {
    expect(planCatalogCode("starter")).toBe("BASIC");
    expect(planCatalogCode("growth")).toBe("PRO");
    expect(planCatalogCode("enterprise")).toBe("ENTERPRISE");
  });

  it("un plan que no conocemos no inventa correspondencia", () => {
    expect(planCatalogCode("mega")).toBeNull();
    expect(planCatalogCode(undefined)).toBeNull();
  });
});

describe("topes del plan frente al consumo real", () => {
  it("avisa de lo que ya está por encima del tope", () => {
    const breaches = planLimitBreaches({ maxUsers: 10, maxBranches: 2 }, { employeeCount: 25, branchCount: 5 });
    expect(breaches).toHaveLength(2);
    expect(breaches[0]).toEqual({ label: "Personas", current: 25, cap: 10 });
  });

  it("no avisa cuando el consumo cabe en el plan", () => {
    expect(planLimitBreaches({ maxUsers: 50, maxBranches: 10 }, { employeeCount: 25, branchCount: 5 })).toEqual([]);
  });

  it("estar justo en el tope no es una infracción", () => {
    expect(planLimitBreaches({ maxUsers: 25, maxBranches: 5 }, { employeeCount: 25, branchCount: 5 })).toEqual([]);
  });

  it("un tope nulo es «sin límite», no cero", () => {
    // Confundir null con 0 haría que el plan empresarial avisara siempre.
    expect(planLimitBreaches({ maxUsers: null, maxBranches: null }, { employeeCount: 900, branchCount: 40 })).toEqual([]);
  });

  it("sin catálogo cargado no se inventan avisos", () => {
    expect(planLimitBreaches(null, { employeeCount: 900 })).toEqual([]);
  });

  it("una empresa sin cifras no dispara avisos", () => {
    expect(planLimitBreaches({ maxUsers: 1, maxBranches: 1 }, {})).toEqual([]);
  });
});

describe("fecha de renovación por defecto", () => {
  const base = new Date("2026-01-31T00:00:00.000Z");

  it("mensual suma un mes", () => {
    expect(defaultRenewalDate("monthly", new Date("2026-03-15T00:00:00.000Z"))).toBe("2026-04-15");
  });

  it("anual suma un año", () => {
    expect(defaultRenewalDate("annual", new Date("2026-03-15T00:00:00.000Z"))).toBe("2027-03-15");
  });

  it("nunca devuelve una fecha fija del pasado", () => {
    // Era la cadena "2026-08-01" escrita a mano en dos sitios.
    expect(defaultRenewalDate("monthly", base)).not.toBe("2026-08-01");
    expect(defaultRenewalDate("monthly")).not.toBe("2026-08-01");
  });

  it("un ciclo desconocido se trata como mensual", () => {
    expect(defaultRenewalDate("quincenal", new Date("2026-03-15T00:00:00.000Z"))).toBe("2026-04-15");
  });
});
