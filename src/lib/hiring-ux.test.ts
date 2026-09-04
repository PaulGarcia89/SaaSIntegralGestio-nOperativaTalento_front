import { describe, expect, it } from "vitest";
import { hiringActionLabel, hiringDeadlineState, hiringDocumentStatusLabel, hiringOfferStatusLabel, hiringPhaseLabel, hiringPriorityLabel, hiringSignatureStatusLabel, hiringStatusGuidance, hiringStatusLabels, hiringViewMatches, pendingHiringDocuments } from "@/lib/hiring-ux";
import type { HiringContractDto } from "@/lib/contracts";

const contract = (status: HiringContractDto["status"]): HiringContractDto => ({
  id: "contract-1", tenantId: "tenant-1", branchId: "branch-1", candidateId: "candidate-1", applicationId: "application-1", vacancyId: "vacancy-1", status, currentStage: "offer", progressPercent: 40, isActive: true, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z", candidate: { id: "candidate-1", fullName: "Luis Sosa", email: "luis@example.com" }, branch: { id: "branch-1", name: "USA" }, vacancy: { id: "vacancy-1", title: "Operador" }, documents: [{ id: "doc-1", contractId: "contract-1", type: "ID", title: "Identificación", status: "REQUIRED", source: "INTERNAL", required: true, version: 1, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z" }], signatures: [],
});

describe("hiring UX consolidation", () => {
  const statuses = Object.keys(hiringStatusLabels) as HiringContractDto["status"][];

  it("localizes actions, document status and priority", () => {
    expect(hiringActionLabel("CONFIRM_HIRING", "READY_TO_HIRE")).toBe("Confirmar contratación");
    expect(hiringDocumentStatusLabel("REJECTED")).toBe("Requiere corrección");
    expect(hiringPriorityLabel("URGENT")).toBe("Urgente");
  });

  it("maps the legacy views to the official contract statuses", () => {
    expect(hiringViewMatches(contract("AWAITING_OFFER_RESPONSE"), "WAITING")).toBe(true);
    expect(hiringViewMatches(contract("READY_TO_HIRE"), "READY")).toBe(true);
    expect(hiringViewMatches(contract("HIRED"), "COMPLETED")).toBe(true);
    expect(hiringViewMatches(contract("DRAFT"), "COMPLETED")).toBe(false);
  });

  it("counts only required documents that still block progress", () => {
    expect(pendingHiringDocuments(contract("DOCUMENTS_PENDING"))).toBe(1);
    expect(pendingHiringDocuments({ ...contract("DOCUMENTS_PENDING"), documents: [{ ...contract("DOCUMENTS_PENDING").documents[0], status: "APPROVED" }] })).toBe(0);
  });

  it("groups technical statuses into user-facing hiring phases", () => {
    expect(hiringPhaseLabel("AWAITING_OFFER_RESPONSE")).toBe("Oferta");
    expect(hiringPhaseLabel("SIGNATURES_PENDING")).toBe("Firmas");
    expect(hiringPhaseLabel("READY_TO_HIRE")).toBe("Revisión");
    expect(hiringPhaseLabel("HIRED")).toBe("Confirmación");
  });

  it("provides consistent guidance for each operational status", () => {
    expect(hiringStatusGuidance("DOCUMENTS_PENDING")).toMatchObject({ expectedActor: "Candidato / RR. HH." });
    expect(hiringStatusGuidance("READY_TO_HIRE").requiredData).toContain("sin bloqueos");
  });

  it("localizes offer status and preserves unknown backend values", () => {
    expect(hiringOfferStatusLabel("PENDING_APPROVAL")).toBe("Pendiente de aprobación");
    expect(hiringOfferStatusLabel("CUSTOM_STATUS")).toBe("CUSTOM_STATUS");
  });

  it("localizes signature status", () => {
    expect(hiringSignatureStatusLabel("COMPLETED")).toBe("Completado");
  });

  it("keeps cancelled contracts in the final confirmation phase", () => {
    expect(hiringPhaseLabel("CANCELLED")).toBe("Confirmación");
  });

  it("has phase and operational guidance for every official status", () => {
    expect(statuses).toHaveLength(12);
    statuses.forEach((status) => {
      expect(hiringPhaseLabel(status)).toBeTruthy();
      expect(hiringStatusGuidance(status).description).toBeTruthy();
      expect(hiringStatusGuidance(status).expectedActor).toBeTruthy();
      expect(hiringStatusGuidance(status).requiredData).toBeTruthy();
    });
  });

  it("does not count optional or waived documents as blockers", () => {
    const base = contract("DOCUMENTS_PENDING");
    expect(pendingHiringDocuments({ ...base, documents: [{ ...base.documents[0], required: false }] })).toBe(0);
    expect(pendingHiringDocuments({ ...base, documents: [{ ...base.documents[0], status: "WAIVED" }] })).toBe(0);
  });

  it("classifies hiring deadlines for SLA follow-up", () => {
    const now = Date.parse("2026-09-03T12:00:00Z");
    expect(hiringDeadlineState("2026-09-03T11:00:00Z", now)).toBe("OVERDUE");
    expect(hiringDeadlineState("2026-09-04T12:00:00Z", now)).toBe("DUE_SOON");
    expect(hiringDeadlineState("2026-09-10T12:00:00Z", now)).toBe("ON_TRACK");
    expect(hiringDeadlineState(null, now)).toBe("NO_DEADLINE");
  });
});
