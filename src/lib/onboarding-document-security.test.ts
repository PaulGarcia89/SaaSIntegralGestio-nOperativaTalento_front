import { describe, expect, it } from "vitest";
import type { EmployeeOnboardingDocumentDto } from "./contracts";
import {
  getOnboardingDocumentSecurity,
  MAX_ONBOARDING_DOCUMENT_SIZE_BYTES,
  validateOnboardingDocumentFile,
} from "./onboarding-document-security";

function file(bytes: number[], name: string, type: string) {
  return new File([new Uint8Array(bytes)], name, { type });
}

const document: EmployeeOnboardingDocumentDto = {
  id: "document-1",
  category: "DOCUMENT_COLLECTION",
  originalName: "identity.pdf",
  mimeType: "application/pdf",
  sizeBytes: 100,
  scanStatus: "CLEAN",
  storageVisibility: "PRIVATE",
  status: "PENDING_REVIEW",
  createdAt: "2026-07-30T12:00:00.000Z",
};

describe("onboarding document security", () => {
  it("accepts a file whose MIME, extension and binary signature match", async () => {
    await expect(
      validateOnboardingDocumentFile(
        file([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31], "identity.pdf", "application/pdf"),
      ),
    ).resolves.toBeNull();
  });

  it("rejects a spoofed extension", async () => {
    await expect(
      validateOnboardingDocumentFile(
        file([0xff, 0xd8, 0xff], "identity.pdf", "image/jpeg"),
      ),
    ).resolves.toContain("extensión");
  });

  it("rejects files over 15 MB", async () => {
    const oversized = new File(
      [new Uint8Array(MAX_ONBOARDING_DOCUMENT_SIZE_BYTES + 1)],
      "large.pdf",
      { type: "application/pdf" },
    );
    await expect(validateOnboardingDocumentFile(oversized)).resolves.toContain("15 MB");
  });

  it("only enables consumption after scan and private storage confirmation", () => {
    expect(getOnboardingDocumentSecurity(document).ready).toBe(true);
    expect(getOnboardingDocumentSecurity({ ...document, storageVisibility: undefined }).ready).toBe(false);
    expect(getOnboardingDocumentSecurity({ ...document, scanStatus: "PENDING" }).ready).toBe(false);
  });
});
