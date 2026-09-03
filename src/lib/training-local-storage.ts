const DB_NAME = "saas-integral-training";
const STORE_NAME = "videos";
const DB_VERSION = 1;

export type LocalTrainingVideo = {
  id: string;
  courseId: string;
  lessonId: string;
  name: string;
  type: string;
  size: number;
  durationSeconds: number;
  savedAt: string;
  blob: Blob;
};

function videoId(courseId: string, lessonId: string) {
  return `${courseId}:${lessonId}`;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("Este navegador no permite almacenamiento local de videos."));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("No fue posible abrir el almacenamiento local."));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
  });
}

export async function saveLocalTrainingVideo(input: Omit<LocalTrainingVideo, "id" | "savedAt" | "blob"> & { blob: Blob }) {
  const database = await openDatabase();
  const record: LocalTrainingVideo = { ...input, id: videoId(input.courseId, input.lessonId), savedAt: new Date().toISOString() };
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("No fue posible guardar el video localmente."));
  });
  database.close();
  return record;
}

export async function getLocalTrainingVideo(courseId: string, lessonId: string) {
  const database = await openDatabase();
  const record = await new Promise<LocalTrainingVideo | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(videoId(courseId, lessonId));
    request.onsuccess = () => resolve(request.result as LocalTrainingVideo | undefined);
    request.onerror = () => reject(request.error ?? new Error("No fue posible leer el video local."));
  });
  database.close();
  return record;
}
