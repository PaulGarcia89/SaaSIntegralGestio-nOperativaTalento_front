import { describe, expect, it } from "vitest";
import { currentStep, nextAction, statusLabel } from "@/components/hiring-workspace";
import type { VacancyApplicationDto } from "@/lib/contracts";

function application(status: VacancyApplicationDto["status"]): VacancyApplicationDto {
  return {
    id: "application-1",
    tenantId: "tenant-1",
    vacancyId: "vacancy-1",
    candidateId: "candidate-1",
    status,
    appliedAt: "2026-09-01T12:00:00.000Z",
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    candidate: { id: "candidate-1", fullName: "Luis Sosa", email: "luis@example.com", createdAt: "2026-09-01T12:00:00.000Z", updatedAt: "2026-09-01T12:00:00.000Z" },
    vacancy: { id: "vacancy-1", branchId: "branch-1", title: "Operador", summary: "", description: "", requirements: "", responsibilities: "", benefits: "", city: "", country: "", department: "", seniority: "", workMode: "HYBRID", employmentType: "FULL_TIME", openings: 1, status: "OPEN", isPublished: true, createdAt: "2026-09-01T12:00:00.000Z", updatedAt: "2026-09-01T12:00:00.000Z", stages: [], branch: { id: "branch-1", name: "USA" } },
  } as VacancyApplicationDto;
}

describe("hiring workspace state", () => {
  it("guides an approved application to offer preparation", () => {
    const item = application("APPROVED");
    expect(currentStep(item, [], false, false)).toBe(1);
    expect(statusLabel(item, [])).toBe("Lista para preparar");
    expect(nextAction(item, [], false, false)).toBe("Configurar oferta laboral");
  });

  it("guides a hired application to onboarding after completed signatures", () => {
    const item = application("HIRED");
    expect(currentStep(item, [], true, true)).toBe(5);
    expect(nextAction(item, [], true, true)).toBe("Iniciar onboarding");
    expect(statusLabel(item, [])).toBe("Contratación confirmada");
  });

  it("requires confirmation after an offer is accepted", () => {
    const item = application("APPROVED");
    const offer = { status: "ACCEPTED" } as never;
    expect(nextAction(item, [offer], false, false)).toBe("Confirmar contratación");
  });
});
