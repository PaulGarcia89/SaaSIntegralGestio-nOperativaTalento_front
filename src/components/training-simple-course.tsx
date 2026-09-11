"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, CircleDashed, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { useUiText } from "@/components/ui-copy";
import { Button } from "@/components/ui/button";
import { InlineFeedback, PageHeader } from "@/components/design-system";
import { TAP_TARGET } from "@/components/simple/simple-ui";
import { cn } from "@/lib/utils";
import {
  createTrainingCompetency,
  createTrainingCourse,
  fetchTrainingCompetencies,
  getApiErrorMessage,
  updateTrainingCourseDesign,
  uploadTrainingVideo,
} from "@/lib/backend";
import { LIMITE_VIDEO_BYTES, megabytes, revisarVideo } from "@/lib/training-video-upload";
import {
  METODOS_COMPROBACION,
  RESPUESTAS_VACIAS,
  codigoDeCompetencia,
  disenoDesdeRespuestas,
  faltaParaCrear,
  minutosDeVideo,
  type CampoRapido,
  type RespuestasCursoRapido,
} from "@/lib/training-simple-course";

/**
 * Camino rápido: un video, ocho preguntas, un curso listo para revisión.
 *
 * El asistente completo sigue donde estaba y no cambia: esta pantalla no lo
 * sustituye, atiende el caso frecuente —«tengo un video y quiero que lo vean»—
 * que hoy obliga a recorrer siete pasos repartidos en varias pantallas.
 *
 * Se apoya en tres endpoints ya existentes, en este orden:
 *
 *   1. `POST /training/admin/courses`                 crea el curso en borrador
 *   2. `POST /training/admin/courses/:id/video`       crea módulo, lección y
 *                                                     bloque, y sube el archivo
 *   3. `PUT  /training/admin/courses/:id/design`      guarda el fundamento
 *
 * Ni un endpoint nuevo, ni un permiso nuevo, ni un estado nuevo: el curso
 * termina en BORRADOR, igual que por el camino largo, y la publicación sigue
 * pasando por las revisiones de calidad de siempre.
 *
 * Si un paso falla, los anteriores YA ocurrieron. En vez de fingir que no pasó
 * nada, la pantalla dice en cuál se quedó y reintenta desde ahí: repetir desde
 * el principio crearía un curso duplicado cada vez.
 */

type Paso = "CURSO" | "VIDEO" | "FUNDAMENTO";

const PASOS: Array<{ id: Paso; etiqueta: string }> = [
  { id: "CURSO", etiqueta: "Crear el curso" },
  { id: "VIDEO", etiqueta: "Subir el video" },
  { id: "FUNDAMENTO", etiqueta: "Guardar para qué sirve" },
];

const CAMPO = "w-full rounded-xl border border-line-control bg-surface-1 px-3 py-2 text-base font-normal text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus";

function leerDuracion(file: File) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const segundos = Math.round(video.duration);
      if (segundos > 0) resolve(segundos);
      else reject(new Error("El video no tiene una duración válida."));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No fue posible leer el video MP4."));
    };
    video.src = url;
  });
}

function Pregunta({ id, titulo, ayuda, error, children }: { id: string; titulo: string; ayuda?: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-base font-medium text-ink-1">
        {titulo}
      </label>
      {ayuda ? <p className="text-sm text-ink-2">{ayuda}</p> : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-status-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TrainingSimpleCoursePage() {
  const uiText = useUiText();
  const router = useRouter();

  const [respuestas, setRespuestas] = useState<RespuestasCursoRapido>(RESPUESTAS_VACIAS);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [problemaArchivo, setProblemaArchivo] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [paso, setPaso] = useState<Paso | null>(null);
  const [hechos, setHechos] = useState<Paso[]>([]);
  const [cursoId, setCursoId] = useState<string | null>(null);
  const competenciaCreada = useRef<string | null>(null);

  const competencias = useQuery({ queryKey: ["training-competencies"], queryFn: fetchTrainingCompetencies });
  const escribir = (campo: keyof RespuestasCursoRapido, valor: string) =>
    setRespuestas((actual) => ({ ...actual, [campo]: valor }));

  const faltas = faltaParaCrear(respuestas, Boolean(archivo));
  const errorDe = (campo: CampoRapido) =>
    enviado ? faltas.find((falta) => falta.campo === campo)?.mensaje : undefined;

  const elegirArchivo = (file: File | null) => {
    if (!file) {
      setArchivo(null);
      setProblemaArchivo(null);
      return;
    }
    const problema = revisarVideo(file);
    if (problema === "tipo") {
      setArchivo(null);
      setProblemaArchivo(uiText("El archivo debe ser un video MP4."));
      return;
    }
    if (problema === "vacio") {
      setArchivo(null);
      setProblemaArchivo(uiText("El archivo está vacío."));
      return;
    }
    if (problema === "tamano") {
      setArchivo(null);
      setProblemaArchivo(
        uiText("El video pesa {{peso}} MB y el máximo es {{limite}} MB.", {
          peso: megabytes(file.size),
          limite: megabytes(LIMITE_VIDEO_BYTES),
        }),
      );
      return;
    }
    setProblemaArchivo(null);
    setArchivo(file);
  };

  const crear = useMutation({
    mutationFn: async () => {
      if (!archivo) throw new Error("Falta el video.");
      const segundos = await leerDuracion(archivo);

      let id = cursoId;
      if (!hechos.includes("CURSO")) {
        setPaso("CURSO");
        const curso = await createTrainingCourse({
          title: respuestas.titulo.trim(),
          summary: respuestas.resumen.trim(),
          description: respuestas.loQueAprenden.trim(),
          estimatedMinutes: minutosDeVideo(segundos),
          scope: "TENANT",
        });
        id = curso.id;
        setCursoId(curso.id);
        setHechos((actual) => [...actual, "CURSO"]);
      }
      if (!id) throw new Error("No se pudo identificar el curso creado.");

      if (!hechos.includes("VIDEO")) {
        setPaso("VIDEO");
        // Sin `lessonId`: el servidor crea el módulo, la lección y el bloque.
        await uploadTrainingVideo(id, {
          file: archivo,
          title: respuestas.titulo.trim(),
          description: respuestas.resumen.trim() || undefined,
          durationSeconds: segundos,
        });
        setHechos((actual) => [...actual, "VIDEO"]);
      }

      if (!hechos.includes("FUNDAMENTO")) {
        setPaso("FUNDAMENTO");
        let competenciaId = respuestas.competenciaId.trim() || competenciaCreada.current;
        if (!competenciaId) {
          const nombre = respuestas.competenciaNueva.trim();
          const competencia = await createTrainingCompetency({ code: codigoDeCompetencia(nombre), name: nombre, scope: "TENANT" });
          competenciaId = competencia.id;
          competenciaCreada.current = competencia.id;
        }
        await updateTrainingCourseDesign(id, disenoDesdeRespuestas(respuestas, competenciaId));
        setHechos((actual) => [...actual, "FUNDAMENTO"]);
      }

      setPaso(null);
      return id;
    },
    onSuccess: (id) => {
      toast.success(uiText("Curso creado. Ya se puede enviar a revisión."));
      router.push(`/training/content/${encodeURIComponent(id)}`);
    },
  });

  const enviar = () => {
    setEnviado(true);
    if (faltas.length) return;
    crear.mutate();
  };

  const competenciasDisponibles = competencias.data ?? [];
  const pesoEnMb = useMemo(() => (archivo ? megabytes(archivo.size) : 0), [archivo]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <PageHeader
        eyebrow={uiText("Aprendizaje")}
        title={uiText("Subir un video como curso")}
        description={uiText("Ocho preguntas y el archivo. Al terminar, el curso queda en borrador listo para enviar a revisión.")}
        actions={
          <Button asChild variant="secondary">
            <Link href="/training/content/new">
              <ArrowLeft className="size-4" aria-hidden="true" />
              {uiText("Usar el asistente completo")}
            </Link>
          </Button>
        }
      />

      {enviado && faltas.length ? (
        <InlineFeedback tone="warning" title={uiText("Falta completar algunas respuestas")}>
          {faltas.map((falta) => uiText(falta.etiqueta)).join(" · ")}
        </InlineFeedback>
      ) : null}

      {crear.isError ? (
        <InlineFeedback tone="danger" title={uiText("Se detuvo en el paso «{{paso}}»", { paso: uiText(PASOS.find((item) => item.id === paso)?.etiqueta ?? "") })}>
          {getApiErrorMessage(crear.error, uiText("Vuelve a intentarlo: se retoma desde donde se quedó, sin repetir lo ya hecho."))}
        </InlineFeedback>
      ) : null}

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          enviar();
        }}
      >
        <section aria-labelledby="rapido-video" className="space-y-4 rounded-xl border border-line bg-surface-1 p-5 shadow-e1">
          <h2 id="rapido-video" className="text-lg font-semibold text-ink-1">
            {uiText("El video")}
          </h2>
          <Pregunta
            id="rapido-archivo"
            titulo={uiText("Elige el archivo")}
            ayuda={uiText("Formato MP4, hasta {{limite}} MB. La duración del curso se toma del propio video.", { limite: megabytes(LIMITE_VIDEO_BYTES) })}
            error={problemaArchivo ?? errorDe("video")}
          >
            <input
              id="rapido-archivo"
              type="file"
              accept="video/mp4,.mp4"
              onChange={(event) => elegirArchivo(event.target.files?.[0] ?? null)}
              className={cn(TAP_TARGET, CAMPO, "file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-ink-1")}
            />
          </Pregunta>
          {archivo ? (
            <p className="flex items-center gap-2 text-sm text-ink-2">
              <Video className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
              {archivo.name} · {pesoEnMb} MB
            </p>
          ) : null}
        </section>

        <section aria-labelledby="rapido-curso" className="space-y-4 rounded-xl border border-line bg-surface-1 p-5 shadow-e1">
          <h2 id="rapido-curso" className="text-lg font-semibold text-ink-1">
            {uiText("De qué va el curso")}
          </h2>

          <Pregunta id="rapido-titulo" titulo={uiText("¿Cómo se llama el curso?")} error={errorDe("titulo")}>
            <input
              id="rapido-titulo"
              value={respuestas.titulo}
              onChange={(event) => escribir("titulo", event.target.value)}
              placeholder={uiText("Ej. Uso seguro del montacargas")}
              className={cn(TAP_TARGET, CAMPO)}
            />
          </Pregunta>

          <Pregunta id="rapido-resumen" titulo={uiText("En una frase, ¿de qué trata?")} error={errorDe("resumen")}>
            <input
              id="rapido-resumen"
              value={respuestas.resumen}
              onChange={(event) => escribir("resumen", event.target.value)}
              placeholder={uiText("Ej. Cómo operar el montacargas sin accidentes.")}
              className={cn(TAP_TARGET, CAMPO)}
            />
          </Pregunta>

          <Pregunta
            id="rapido-aprenden"
            titulo={uiText("¿Qué debe saber hacer la persona al terminar?")}
            ayuda={uiText("Esto queda como descripción del curso y como su objetivo de aprendizaje.")}
            error={errorDe("loQueAprenden")}
          >
            <textarea
              id="rapido-aprenden"
              value={respuestas.loQueAprenden}
              onChange={(event) => escribir("loQueAprenden", event.target.value)}
              className={cn(CAMPO, "min-h-28")}
            />
          </Pregunta>

          <Pregunta id="rapido-audiencia" titulo={uiText("¿Quiénes deben hacerlo?")} error={errorDe("paraQuien")}>
            <input
              id="rapido-audiencia"
              value={respuestas.paraQuien}
              onChange={(event) => escribir("paraQuien", event.target.value)}
              placeholder={uiText("Ej. Personal de bodega y despacho")}
              className={cn(TAP_TARGET, CAMPO)}
            />
          </Pregunta>
        </section>

        <section aria-labelledby="rapido-fundamento" className="space-y-4 rounded-xl border border-line bg-surface-1 p-5 shadow-e1">
          <h2 id="rapido-fundamento" className="text-lg font-semibold text-ink-1">
            {uiText("Para qué sirve")}
          </h2>
          <p className="text-sm text-ink-2">
            {uiText("Sin estas respuestas el sistema no deja publicar el curso. Se piden aquí para no dejarlas a medias.")}
          </p>

          <Pregunta id="rapido-necesidad" titulo={uiText("¿Por qué lo necesita la empresa?")} error={errorDe("porQue")}>
            <input
              id="rapido-necesidad"
              value={respuestas.porQue}
              onChange={(event) => escribir("porQue", event.target.value)}
              placeholder={uiText("Ej. Hubo dos incidentes el último trimestre.")}
              className={cn(TAP_TARGET, CAMPO)}
            />
          </Pregunta>

          <Pregunta id="rapido-kpi" titulo={uiText("¿Cómo sabrás que funcionó?")} error={errorDe("comoSeSabe")}>
            <input
              id="rapido-kpi"
              value={respuestas.comoSeSabe}
              onChange={(event) => escribir("comoSeSabe", event.target.value)}
              placeholder={uiText("Ej. Ningún incidente en los próximos seis meses.")}
              className={cn(TAP_TARGET, CAMPO)}
            />
          </Pregunta>

          <Pregunta id="rapido-metodo" titulo={uiText("¿Cómo comprobarás lo aprendido?")} error={errorDe("comoSeComprueba")}>
            <select
              id="rapido-metodo"
              value={respuestas.comoSeComprueba}
              onChange={(event) => escribir("comoSeComprueba", event.target.value)}
              className={cn(TAP_TARGET, CAMPO)}
            >
              {METODOS_COMPROBACION.map((metodo) => (
                <option key={metodo.id} value={metodo.id}>
                  {uiText(metodo.etiqueta)}
                </option>
              ))}
            </select>
          </Pregunta>

          <Pregunta
            id="rapido-competencia"
            titulo={uiText("¿Qué capacidad desarrolla?")}
            ayuda={uiText("Elige una de la lista o escribe una nueva: se creará en el catálogo de la empresa.")}
            error={errorDe("competenciaId")}
          >
            <select
              id="rapido-competencia"
              value={respuestas.competenciaId}
              onChange={(event) => escribir("competenciaId", event.target.value)}
              disabled={competencias.isLoading}
              className={cn(TAP_TARGET, CAMPO)}
            >
              <option value="">
                {competencias.isLoading ? uiText("Cargando…") : uiText("Escribir una nueva")}
              </option>
              {competenciasDisponibles.map((competencia) => (
                <option key={competencia.id} value={competencia.id}>
                  {competencia.name}
                </option>
              ))}
            </select>
          </Pregunta>

          {!respuestas.competenciaId ? (
            <Pregunta id="rapido-competencia-nueva" titulo={uiText("Nombre de la capacidad nueva")}>
              <input
                id="rapido-competencia-nueva"
                value={respuestas.competenciaNueva}
                onChange={(event) => escribir("competenciaNueva", event.target.value)}
                placeholder={uiText("Ej. Operación segura de maquinaria")}
                className={cn(TAP_TARGET, CAMPO)}
              />
            </Pregunta>
          ) : null}
        </section>

        {crear.isPending || hechos.length ? (
          <ol className="space-y-2 rounded-xl border border-line bg-surface-2 p-4" aria-live="polite">
            {PASOS.map((item) => {
              const hecho = hechos.includes(item.id);
              const activo = paso === item.id && crear.isPending;
              return (
                <li key={item.id} className="flex items-center gap-3 text-sm text-ink-1">
                  {hecho ? (
                    <Check className="size-4 shrink-0 text-status-success" aria-hidden="true" />
                  ) : (
                    <CircleDashed className={cn("size-4 shrink-0 text-ink-3", activo && "animate-spin")} aria-hidden="true" />
                  )}
                  <span>{uiText(item.etiqueta)}</span>
                  {hecho ? <span className="text-ink-3">{uiText("hecho")}</span> : null}
                </li>
              );
            })}
          </ol>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className={TAP_TARGET} onClick={() => router.push("/training/content")}>
            {uiText("Cancelar")}
          </Button>
          <Button type="submit" className={TAP_TARGET} loading={crear.isPending} loadingLabel={uiText("Creando el curso…")}>
            <Upload className="size-4" aria-hidden="true" />
            {hechos.length ? uiText("Continuar desde donde se quedó") : uiText("Crear el curso")}
          </Button>
        </div>
      </form>
    </div>
  );
}
