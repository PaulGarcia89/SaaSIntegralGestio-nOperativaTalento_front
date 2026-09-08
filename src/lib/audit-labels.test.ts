import { describe, expect, it } from "vitest";
import {
  AUDIT_DOMAIN_LABELS,
  DESCRIBED_AUDIT_ACTIONS,
  auditActionFlatOptions,
  auditActionInfo,
  auditActionLabel,
  auditActionOptions,
  humanizeAction,
  matchesAuditEntry,
} from "@/lib/audit-labels";

/**
 * Acciones que el backend escribe hoy en `auditLog.action`, extraídas del
 * propio código del servidor. Si el backend añade una y aquí no se describe,
 * esta prueba falla: es preferible romper la suite a que la pantalla de
 * auditoría empiece a mostrar constantes de código a quien está investigando
 * un incidente.
 */
const BACKEND_ACTIONS = [
  "ADD_WORKFLOW_EVENT",
  "APPROVE",
  "AUTH_LOGIN",
  "CANCEL_CONTRACT",
  "CANDIDATE_SSN_UPDATED",
  "CONFIRMED_FROM_PURCHASE_ORDER",
  "CONFIRM_CONTRACT",
  "CONSENT_SIGNED",
  "COUNT_APPROVED",
  "CREATED",
  "CREATE_CONTRACT",
  "DELETE",
  "DESIGN_UPDATED",
  "DISABLE",
  "DOCUSEAL_SUBMISSION_COMPLETED",
  "DOCUSEAL_SUBMISSION_CREATED",
  "DUPLICATED",
  "EMPLOYEE_DOCUMENT_REPLACED",
  "EMPLOYEE_DOCUMENT_UPLOADED",
  "EMPLOYEE_RECORD_REGISTERED",
  "ENABLE",
  "EXECUTION_FINISHED",
  "EXECUTION_STARTED",
  "HIRE_CANDIDATE",
  "OFFER_SENT",
  "PACKAGE_COMPLETED",
  "PACKAGE_CREATED",
  "PACKAGE_SENT",
  "QUALITY_CHANGES_REQUESTED",
  "RECEIPT_CONFIRMED",
  "RECOMPUTE_MASTER_WORKFLOW",
  "REMINDER_SENT",
  "RULES_NOT_FOUND",
  "RULE_SKIPPED",
  "SCHEDULED_PUBLICATION",
  "SCHEDULED_RETIREMENT",
  "SEND_DOCUMENTS",
  "SEND_OFFER",
  "START_OFFBOARDING",
  "TAMPERED",
  "TRANSFER_EMPLOYEE_BRANCH",
  "UPDATED",
  "UPDATE_WORKFLOW_STEP_PROGRESS",
  "UPDATE_WORKFLOW_STEP_STATUS",
  "UPSERT",
];

describe("cobertura de las acciones del backend", () => {
  it("describe todas las que el servidor escribe hoy", () => {
    const missing = BACKEND_ACTIONS.filter((code) => auditActionInfo(code).domain === "otro");
    expect(missing).toEqual([]);
  });

  it("ningún rótulo repite la constante ni deja guiones bajos", () => {
    for (const code of DESCRIBED_AUDIT_ACTIONS) {
      const label = auditActionLabel(code);
      expect(label).not.toBe(code);
      expect(label).not.toContain("_");
    }
  });

  it("cada acción explica qué pasó, sin repetir el rótulo", () => {
    for (const code of DESCRIBED_AUDIT_ACTIONS) {
      const info = auditActionInfo(code);
      expect(info.detail.length).toBeGreaterThan(20);
      expect(info.detail).not.toBe(info.label);
    }
  });
});

describe("tono por significado", () => {
  it("un documento alterado es grave", () => {
    expect(auditActionInfo("TAMPERED").tone).toBe("danger");
  });

  it("una eliminación es grave", () => {
    expect(auditActionInfo("DELETE").tone).toBe("danger");
  });

  it("una modificación corriente no alarma", () => {
    expect(auditActionInfo("UPDATED").tone).toBe("info");
  });

  it("una acción desconocida es neutra, nunca roja", () => {
    expect(auditActionInfo("ALGO_QUE_NO_EXISTE").tone).toBe("neutral");
  });
});

describe("acciones desconocidas", () => {
  it("se humanizan en vez de mostrarse en crudo", () => {
    expect(auditActionLabel("TRANSFER_SOMETHING_NEW")).toBe("Transfer something new");
  });

  it.each([undefined, null, "", "   "])("un evento sin acción (%s) lo dice en vez de quedarse vacío", (action) => {
    const info = auditActionInfo(action);
    expect(info.label).toBe("Acción sin registrar");
    expect(info.detail.length).toBeGreaterThan(0);
  });

  it("humanizeAction no devuelve cadena vacía", () => {
    expect(humanizeAction("   ")).toBe("Acción sin nombre");
  });
});

describe("opciones del filtro", () => {
  it("agrupa por dominio y no pierde ninguna acción descrita", () => {
    const total = auditActionOptions().reduce((count, group) => count + group.options.length, 0);
    expect(total).toBe(DESCRIBED_AUDIT_ACTIONS.length);
  });

  it("no ofrece grupos vacíos", () => {
    for (const group of auditActionOptions()) {
      expect(group.options.length).toBeGreaterThan(0);
    }
  });

  it("nunca ofrece el grupo «Otros»: ahí solo caen códigos sin describir", () => {
    expect(auditActionOptions().some((group) => group.group === AUDIT_DOMAIN_LABELS.otro)).toBe(false);
  });

  it("la lista plana lleva el dominio delante para no repetir rótulos sueltos", () => {
    const flat = auditActionFlatOptions();
    expect(flat).toHaveLength(DESCRIBED_AUDIT_ACTIONS.length);
    expect(flat.every((option) => option.label.includes(" · "))).toBe(true);
    expect(new Set(flat.map((option) => option.value)).size).toBe(flat.length);
  });
});

describe("filtro de texto sobre lo ya cargado", () => {
  const entry = { action: "HIRE_CANDIDATE", route: "/api/applications/hire", userId: "8f14e45f" };

  it("encuentra por el rótulo en español", () => {
    expect(matchesAuditEntry(entry, "contratación")).toBe(true);
  });

  it("ignora acentos y mayúsculas", () => {
    expect(matchesAuditEntry(entry, "CONTRATACION")).toBe(true);
  });

  it("encuentra por la constante, para quien ya la conoce", () => {
    expect(matchesAuditEntry(entry, "HIRE_CANDIDATE")).toBe(true);
  });

  it("encuentra por la ruta", () => {
    expect(matchesAuditEntry(entry, "/api/applications")).toBe(true);
  });

  it("sin término no filtra nada", () => {
    expect(matchesAuditEntry(entry, "")).toBe(true);
    expect(matchesAuditEntry(entry, "   ")).toBe(true);
  });

  it("descarta lo que no coincide", () => {
    expect(matchesAuditEntry(entry, "inventario")).toBe(false);
  });

  it("un evento sin ruta ni usuario no rompe la búsqueda", () => {
    expect(matchesAuditEntry({ action: "DELETE", route: null, userId: null }, "eliminación")).toBe(true);
  });
});
