import { describe, expect, it } from "vitest";
import { hiringActionLabel, hiringDocumentStatusLabel, hiringPriorityLabel, hiringViewMatches, pendingHiringDocuments } from "@/lib/hiring-ux";
import type { HiringContractDto } from "@/lib/contracts";

const contract = (status: HiringContractDto["status"]): HiringContractDto => ({
  id: "contract-1", tenantId: "tenant-1", branchId: "branch-1", candidateId: "candidate-1", applicationId: "application-1", vacancyId: "vacancy-1", status, currentStage: "offer", progressPercent: 40, isActive: true, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z", candidate: { id: "candidate-1", fullName: "Luis Sosa", email: "luis@example.com" }, branch: { id: "branch-1", name: "USA" }, vacancy: { id: "vacancy-1", title: "Operador" }, documents: [{ id: "doc-1", contractId: "contract-1", type: "ID", title: "Identificación", status: "REQUIRED", source: "INTERNAL", required: true, version: 1, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z" }], signatures: [],
});

describe("hiring UX consolidation", () => {
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
});
