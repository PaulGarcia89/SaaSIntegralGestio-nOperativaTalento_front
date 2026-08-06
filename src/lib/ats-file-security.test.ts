import { validateAtsResumeFile } from "./ats-file-security";
import { describe, expect, it } from "vitest";

function uploaded(name: string, type: string, content: string) {
  const bytes = new TextEncoder().encode(content);
  return { name, type, size: bytes.byteLength, arrayBuffer: async () => bytes.buffer } as File;
}

describe("validateAtsResumeFile", () => {
  it("accepts a passive PDF with matching signature", async () => {
    await expect(validateAtsResumeFile(uploaded("cv.pdf", "application/pdf", "%PDF-1.7\nprofile\n%%EOF"))).resolves.toBeNull();
  });

  it("rejects old Word files and active PDF actions", async () => {
    await expect(validateAtsResumeFile(uploaded("cv.doc", "application/msword", "DOC"))).resolves.toContain("PDF o DOCX");
    await expect(validateAtsResumeFile(uploaded("cv.pdf", "application/pdf", "%PDF-1.7\n/OpenAction 1 0 R\n%%EOF"))).resolves.toContain("contenido activo");
  });
});
