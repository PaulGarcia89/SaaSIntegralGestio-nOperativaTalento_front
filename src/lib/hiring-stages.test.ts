import { describe, expect, it } from "vitest";
import {
  explainHiringBlocker,
  hiringDocumentTypeLabel,
  hiringStageIndex,
  hiringTemplateLabel,
  hiringWaitingLabel,
  normalizeHiringActionCode,
  normalizeHiringBlockers,
  resolveHiringCase,
} from "@/lib/hiring-ux";
import type { HiringContractDocumentDto, HiringContractDto } from "@/lib/contracts";

const document = (overrides: Partial<HiringContractDocumentDto> = {}): HiringContractDocumentDto => ({
  id: "doc-1", contractId: "contract-1", type: "IDENTIFICATION", title: "Identificación oficial", status: "REQUIRED", source: "INTERNAL", required: true, version: 1, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z", ...overrides,
});

const contract = (status: HiringContractDto["status"], overrides: Partial<HiringContractDto> = {}): HiringContractDto => ({
  id: "contract-1", tenantId: "tenant-1", branchId: "branch-1", candidateId: "candidate-1", applicationId: "application-1", vacancyId: "vacancy-1", status, currentStage: "draft", progressPercent: 0, isActive: true, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z",
  candidate: { id: "candidate-1", fullName: "Ana Martínez", email: "ana@example.com" },
  branch: { id: "branch-1", name: "Sucursal Centro" },
  vacancy: { id: "vacancy-1", title: "Cajera" },
  documents: [], signatures: [], ...overrides,
});

describe("normalización de la respuesta de progreso", () => {
  it("acepta los bloqueos como objetos, que es lo que emite el backend", () => {
    expect(normalizeHiringBlockers([{ code: "WAITING_CANDIDATE", message: "Esperando respuesta." }])).toEqual([
      { code: "WAITING_CANDIDATE", message: "Esperando respuesta.", field: undefined },
    ]);
  });

  it("tolera la forma antigua en cadena sin romper la pantalla", () => {
    expect(normalizeHiringBlockers(["Faltan documentos."])).toEqual([{ code: "UNKNOWN", message: "Faltan documentos." }]);
  });

  it("descarta entradas vacías o mal formadas en vez de renderizarlas", () => {
    expect(normalizeHiringBlockers([null, "", {}, { code: "X" }, undefined])).toEqual([]);
    expect(normalizeHiringBlockers(undefined)).toEqual([]);
  });

  it("extrae el código de la acción tanto de un objeto como de una cadena", () => {
    expect(normalizeHiringActionCode({ code: "CONFIRM_HIRING", label: "Confirmar" })).toBe("CONFIRM_HIRING");
    expect(normalizeHiringActionCode("SEND_OFFER")).toBe("SEND_OFFER");
    expect(normalizeHiringActionCode(null)).toBeNull();
  });
});

describe("etapas de la contratación", () => {
  it("sitúa una contratación nueva en el paso de preparación", () => {
    const state = resolveHiringCase(contract("DRAFT"));
    expect(state.stage).toBe("PREPARACION");
    expect(state.stageIndex).toBe(0);
    expect(state.primaryAction.code).toBe("PREPARE_OFFER");
  });

  it("mantiene la oferta enviada en el paso de oferta y señala que espera al candidato", () => {
    const state = resolveHiringCase(contract("OFFER_SENT", { jobOfferId: "offer-1" }), {
      currentStage: "offer_sent", progressPercent: 37, tasksCompleted: [], tasksPending: [],
      blockers: [{ code: "WAITING_CANDIDATE", message: "La contratación está esperando una respuesta del candidato." }],
    });
    expect(state.stage).toBe("OFERTA");
    expect(state.waitingOn).toBe("CANDIDATO");
    expect(state.primaryAction.code).toBe("REVIEW_RESPONSE");
    expect(state.canConfirm).toBe(false);
  });

  it("pide revisar los documentos cuando quedan pendientes", () => {
    const state = resolveHiringCase(contract("DOCUMENTS_PENDING", { documents: [document()] }));
    expect(state.stage).toBe("DOCUMENTOS");
    expect(state.pendingDocuments).toBe(1);
    expect(state.canConfirm).toBe(false);
    expect(state.primaryAction.code).toBe("REVIEW_DOCUMENTS");
  });

  it("un documento rechazado sigue bloqueando la contratación", () => {
    const state = resolveHiringCase(contract("DOCUMENTS_PENDING", { documents: [document({ status: "REJECTED", rejectionReason: "Ilegible" })] }));
    expect(state.pendingDocuments).toBe(1);
    expect(state.canConfirm).toBe(false);
  });

  it("lleva a revisión final en cuanto no quedan documentos obligatorios pendientes", () => {
    const state = resolveHiringCase(contract("DOCUMENTS_PENDING", { documents: [document({ status: "APPROVED" })] }));
    expect(state.stage).toBe("REVISION");
    expect(state.canConfirm).toBe(true);
    expect(state.primaryAction.code).toBe("CONFIRM_HIRING");
  });

  it("rescata los contratos antiguos detenidos en firmas para que puedan confirmarse", () => {
    const state = resolveHiringCase(contract("SIGNATURES_PENDING", { documents: [document({ status: "SIGNED" })] }));
    expect(state.stage).toBe("REVISION");
    expect(state.canConfirm).toBe(true);
  });

  it("permite confirmar con la oferta aceptada y sin documentos pedidos", () => {
    expect(resolveHiringCase(contract("OFFER_ACCEPTED")).canConfirm).toBe(true);
  });

  it("nunca ofrece confirmar dos veces una contratación ya cerrada", () => {
    const state = resolveHiringCase(contract("HIRED", { documents: [document({ status: "APPROVED" })] }));
    expect(state.canConfirm).toBe(false);
    expect(state.completed).toBe(true);
    expect(state.progressPercent).toBe(100);
    expect(state.primaryAction.code).toBe("VIEW_EMPLOYEE");
  });

  it("no ofrece acciones sobre una contratación cancelada", () => {
    const state = resolveHiringCase(contract("CANCELLED"));
    expect(state.canConfirm).toBe(false);
    expect(state.primaryAction.code).toBe("NONE");
    expect(state.waitingOn).toBe("NADIE");
  });

  it("mantiene las cinco etapas en orden", () => {
    expect(hiringStageIndex("PREPARACION")).toBe(0);
    expect(hiringStageIndex("CONFIRMACION")).toBe(4);
  });
});

describe("mensajes para personas sin formación técnica", () => {
  it("explica cada bloqueo con qué falta, por qué, quién y qué se habilita", () => {
    const explanation = explainHiringBlocker({ code: "REQUIRED_DOCUMENTS_MISSING", message: "Faltan 2 documento(s) obligatorio(s)." }, "Ana");
    expect(explanation.what).toContain("Faltan 2");
    expect(explanation.why).toBeTruthy();
    expect(explanation.who).toContain("Ana");
    expect(explanation.unlocks).toBeTruthy();
  });

  it("da una explicación utilizable incluso para un código desconocido", () => {
    const explanation = explainHiringBlocker({ code: "ALGO_NUEVO", message: "Mensaje del servidor." });
    expect(explanation.what).toBe("Mensaje del servidor.");
    expect(explanation.why).toBeTruthy();
  });

  it("traduce los identificadores técnicos de DocuSeal y los tipos de documento", () => {
    expect(hiringTemplateLabel("w9")).toContain("W-9");
    expect(hiringTemplateLabel("i9")).toContain("I-9");
    expect(hiringDocumentTypeLabel("ELIGIBILITY")).toBe("Permiso para trabajar");
    expect(hiringDocumentTypeLabel("IDENTIFICATION")).toBe("Identificación oficial");
  });

  it("dice de quién es el turno en lenguaje directo", () => {
    expect(hiringWaitingLabel("CANDIDATO", "Ana")).toBe("Esperando a Ana");
    expect(hiringWaitingLabel("EMPRESA", "Ana")).toBe("Te toca a ti");
  });
});
