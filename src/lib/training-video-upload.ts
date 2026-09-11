/**
 * Comprobaciones del video ANTES de subirlo.
 *
 * El servidor sigue siendo la autoridad —vuelve a comprobar tipo y tamaño—,
 * pero hacerlo también aquí evita el caso que hace perder el tiempo de verdad:
 * elegir un archivo de 800 MB, esperar varios minutos a que suba por una línea
 * doméstica y recibir un error al final. Lo que se puede saber en el momento de
 * elegir el archivo, se dice en el momento de elegir el archivo.
 */

/**
 * Espejo de `TRAINING_VIDEO_MAX_UPLOAD_BYTES` (500 MB por omisión).
 *
 * No hay forma de leer la variable del servidor desde el navegador, así que
 * esto es una copia y puede quedar desfasada si allí se cambia. Por eso la
 * comprobación del cliente es cortesía y NO sustituye a la del servidor: si
 * aquí pasa y allí no, el error del servidor se sigue mostrando.
 */
export const LIMITE_VIDEO_BYTES = 500 * 1024 * 1024;

export type ProblemaVideo = "tipo" | "tamano" | "vacio";

export function revisarVideo(file: File, limiteBytes = LIMITE_VIDEO_BYTES): ProblemaVideo | null {
  const esMp4 = file.name.toLowerCase().endsWith(".mp4");
  // El tipo que declara el navegador NO es fiable: hay equipos donde un .mp4
  // llega como cadena vacía o como `application/octet-stream`. La extensión
  // manda, y el tipo solo descarta cuando dice explícitamente otra cosa.
  const tipoContradice = file.type !== "" && file.type !== "video/mp4";
  if (!esMp4 || tipoContradice) return "tipo";
  if (file.size === 0) return "vacio";
  if (file.size > limiteBytes) return "tamano";
  return null;
}

export function megabytes(bytes: number) {
  return Math.round(bytes / (1024 * 1024));
}
