const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_RESUME_BYTES = 15 * 1024 * 1024;

export async function validateAtsResumeFile(file: File): Promise<string | null> {
  if (!file.size || file.size > MAX_RESUME_BYTES) return "El CV debe pesar como máximo 15 MB.";
  if (!file.name || file.name.length > 180 || /[\0\r\n/\\]/.test(file.name)) return "El nombre del archivo no es seguro.";
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (extension !== ".pdf" && extension !== ".docx") return "Solo se permiten archivos PDF o DOCX; los formatos DOC antiguos están bloqueados.";
  if ((extension === ".pdf" && file.type !== PDF_MIME) || (extension === ".docx" && file.type !== DOCX_MIME)) {
    return "La extensión y el tipo declarado del archivo no coinciden.";
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (extension === ".pdf") {
    const header = new TextDecoder("ascii").decode(bytes.slice(0, 8));
    if (!/^%PDF-(?:1\.[0-7]|2\.0)/.test(header)) return "La firma binaria del PDF no es válida.";
    const source = new TextDecoder("latin1").decode(bytes);
    if (!source.includes("%%EOF")) return "El PDF está incompleto.";
    if (/\/(?:JavaScript|JS|OpenAction|Launch|RichMedia|EmbeddedFile|XFA|AcroForm)\b/i.test(source)) {
      return "El PDF contiene acciones o contenido activo no permitido.";
    }
  } else if (!(bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04)) {
    return "La firma binaria del DOCX no es válida.";
  }
  return null;
}
