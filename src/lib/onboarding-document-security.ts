import type { EmployeeOnboardingDocumentDto } from "./contracts";

export const MAX_ONBOARDING_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024;
export const ONBOARDING_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

const allowedExtensions: Record<(typeof ONBOARDING_DOCUMENT_MIME_TYPES)[number], string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export async function validateOnboardingDocumentFile(file: File) {
  if (!file.size) return "El archivo está vacío.";
  if (file.size > MAX_ONBOARDING_DOCUMENT_SIZE_BYTES) {
    return "El archivo no puede superar 15 MB.";
  }
  if (!ONBOARDING_DOCUMENT_MIME_TYPES.includes(file.type as (typeof ONBOARDING_DOCUMENT_MIME_TYPES)[number])) {
    return "Solo se permiten archivos PDF, JPEG o PNG.";
  }

  const mimeType = file.type as (typeof ONBOARDING_DOCUMENT_MIME_TYPES)[number];
  const normalizedName = file.name.toLowerCase();
  if (!allowedExtensions[mimeType].some((extension) => normalizedName.endsWith(extension))) {
    return "La extensión del archivo no coincide con su tipo declarado.";
  }

  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (!matchesFileSignature(mimeType, header)) {
    return "El contenido del archivo no coincide con un PDF, JPEG o PNG válido.";
  }

  return null;
}

export function getOnboardingDocumentSecurity(
  document: EmployeeOnboardingDocumentDto,
) {
  const scanStatus = document.scanStatus.toUpperCase();
  const scanAccepted = ["CLEAN", "PASSED", "SAFE"].includes(scanStatus);
  const privateStorage = document.storageVisibility === "PRIVATE";

  if (!scanAccepted) {
    return {
      ready: false,
      label: scanStatus === "INFECTED" || scanStatus === "REJECTED"
        ? "Archivo rechazado"
        : "Escaneo pendiente",
      detail: "La revisión y descarga están bloqueadas hasta completar el análisis de seguridad.",
    };
  }
  if (!privateStorage) {
    return {
      ready: false,
      label: "Privacidad no confirmada",
      detail: "La API debe confirmar almacenamiento privado antes de habilitar el archivo.",
    };
  }

  return {
    ready: true,
    label: "Archivo protegido",
    detail: "Escaneo aprobado y almacenamiento privado confirmados por el servidor.",
  };
}

function matchesFileSignature(
  mimeType: (typeof ONBOARDING_DOCUMENT_MIME_TYPES)[number],
  bytes: Uint8Array,
) {
  if (mimeType === "application/pdf") {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
  }
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
}
