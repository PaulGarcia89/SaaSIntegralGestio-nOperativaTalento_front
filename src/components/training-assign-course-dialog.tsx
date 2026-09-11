"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";
import {
  createTrainingAssignments,
  fetchBranches,
  fetchTrainingCourses,
  fetchUsers,
  getApiErrorMessage,
} from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineNote } from "@/components/system";
import { useUiText } from "@/components/ui-copy";
import { cn } from "@/lib/utils";

/**
 * Asignar un curso a personas.
 *
 * Vivía dentro de `training-learning-hub.tsx` y solo se alcanzaba desde
 * «Cursos → pestaña Asignaciones → Asignar curso». Es decir: quien acababa de
 * publicar un curso en «Gestionar cursos» tenía que saber que la asignación
 * está en OTRA entrada del menú, dentro de la tercera pestaña, y volver a
 * elegir en un desplegable el curso que acababa de publicar. Nada en la
 * pantalla de publicación lo decía.
 *
 * Al extraerlo, el mismo diálogo se abre desde donde está el curso, con el
 * curso ya elegido.
 *
 * Cambios de fondo respecto de la versión anterior:
 *
 * - «Audiencia: USERS · ROLES · BRANCHES · TENANT» en un desplegable era
 *   vocabulario de base de datos. Ahora son cuatro opciones a la vista,
 *   redactadas como una pregunta: «¿Quién debe hacerlo?».
 * - La lista de destinatarios era un cajón de casillas sin buscador. Con
 *   veinte empleados es incómodo; con doscientos, inservible.
 * - El botón decía «Crear asignaciones». Ahora dice a cuántas personas va,
 *   que es lo que hay que confirmar antes de pulsar.
 * - Las fechas pedían hora (`datetime-local`). Un vencimiento de curso es un
 *   día, no un instante.
 */

const ROLES = [
  { id: "TENANT_ADMIN", label: "Administradores de empresa" },
  { id: "HR_MANAGER", label: "RR. HH." },
  { id: "INSTRUCTOR", label: "Instructores" },
  { id: "SUPERVISOR", label: "Supervisores" },
  { id: "EMPLOYEE", label: "Empleados" },
];

type Audiencia = "USERS" | "ROLES" | "BRANCHES" | "TENANT";

export function AssignCourseDialog({
  open,
  onOpenChange,
  courseId: fijado,
  courseTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preseleccionado cuando se abre desde un curso concreto. */
  courseId?: string;
  courseTitle?: string;
}) {
  const uiText = useUiText();
  const queryClient = useQueryClient();
  const [elegido, setElegido] = useState("");
  const [audiencia, setAudiencia] = useState<Audiencia>("USERS");
  const [destinos, setDestinos] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const courseId = fijado ?? elegido;

  const cursos = useQuery({
    queryKey: ["published-training-courses"],
    queryFn: () => fetchTrainingCourses({ status: "PUBLISHED", pageSize: 100 }),
    enabled: open && !fijado,
  });
  const personas = useQuery({ queryKey: ["assignment-users"], queryFn: fetchUsers, enabled: open && audiencia === "USERS" });
  const sucursales = useQuery({ queryKey: ["assignment-branches"], queryFn: () => fetchBranches(), enabled: open && audiencia === "BRANCHES" });

  const opciones = useMemo(() => {
    const todas =
      audiencia === "USERS" ? (personas.data ?? []).map((item) => ({ id: item.id, label: item.fullName, detalle: item.email }))
      : audiencia === "BRANCHES" ? (sucursales.data ?? []).map((item) => ({ id: item.id, label: item.name, detalle: undefined }))
      : audiencia === "ROLES" ? ROLES.map((item) => ({ id: item.id, label: item.label, detalle: undefined }))
      : [];
    const texto = busqueda.trim().toLocaleLowerCase("es");
    if (!texto) return todas;
    return todas.filter((item) => `${item.label} ${item.detalle ?? ""}`.toLocaleLowerCase("es").includes(texto));
  }, [audiencia, busqueda, personas.data, sucursales.data]);

  const cargando = (audiencia === "USERS" && personas.isLoading) || (audiencia === "BRANCHES" && sucursales.isLoading);
  const seleccionadas = audiencia === "TENANT" ? null : destinos.length;
  const listo = Boolean(courseId) && (audiencia === "TENANT" || destinos.length > 0);

  const mutation = useMutation({
    mutationFn: createTrainingAssignments,
    onSuccess: async (resultado) => {
      // Decir qué pasó de verdad: `skipped` son las personas que YA tenían el
      // curso asignado. Sin esa cifra, asignar dos veces parece que no hizo
      // nada.
      toast.success(
        resultado.skipped > 0
          ? uiText("Asignado a {{creadas}} personas. {{omitidas}} ya lo tenían.", { creadas: resultado.created, omitidas: resultado.skipped })
          : uiText("Asignado a {{creadas}} personas.", { creadas: resultado.created }),
      );
      cerrar(false);
      await queryClient.invalidateQueries({ queryKey: ["training-admin-assignments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, uiText("No fue posible asignar el curso."))),
  });

  function cerrar(abierto: boolean) {
    if (!abierto) {
      setDestinos([]);
      setBusqueda("");
      if (!fijado) setElegido("");
    }
    onOpenChange(abierto);
  }

  function enviar(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({
      courseId,
      audience: audiencia,
      targetIds: audiencia === "TENANT" ? undefined : destinos,
      // Una fecha sin hora se interpreta a mediodía para que el cambio de huso
      // no la mueva al día anterior.
      startAt: desde ? new Date(`${desde}T12:00:00`).toISOString() : undefined,
      dueAt: hasta ? new Date(`${hasta}T12:00:00`).toISOString() : undefined,
      isRequired: true,
    });
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {courseTitle ? uiText("Asignar «{{curso}}»", { curso: courseTitle }) : uiText("Asignar un curso")}
          </DialogTitle>
          <DialogDescription>
            {uiText("Las personas que elijas lo verán en «Mis cursos» y recibirán un aviso.")}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={enviar}>
          {!fijado ? (
            <div>
              <Label>{uiText("¿Qué curso?")}</Label>
              <Select value={elegido} onValueChange={setElegido}>
                <SelectTrigger><SelectValue placeholder={uiText("Elige un curso")} /></SelectTrigger>
                <SelectContent>
                  {cursos.data?.items.map((curso) => <SelectItem key={curso.id} value={curso.id}>{curso.title}</SelectItem>)}
                </SelectContent>
              </Select>
              {cursos.isSuccess && !cursos.data.items.length ? (
                <InlineNote tone="warning" title={uiText("No hay cursos publicados")}>
                  {uiText("Solo se puede asignar un curso publicado. Publícalo desde «Gestionar cursos» y vuelve aquí.")}
                </InlineNote>
              ) : null}
            </div>
          ) : null}

          {/* Cuatro opciones a la vista y en castellano llano, en vez de un
              desplegable con los nombres internos del modelo de datos. */}
          <fieldset>
            <legend className="text-sm font-medium text-ink-1">{uiText("¿Quién debe hacerlo?")}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {([
                ["USERS", uiText("Personas concretas"), uiText("Las eliges una a una")],
                ["TENANT", uiText("Toda la empresa"), uiText("Todo el personal activo")],
                ["BRANCHES", uiText("Una o varias sucursales"), uiText("Quien trabaje en ellas")],
                ["ROLES", uiText("Por rol"), uiText("Por ejemplo, supervisores")],
              ] as const).map(([valor, titulo, pista]) => (
                <label
                  key={valor}
                  className={cn(
                    "flex min-h-[3.25rem] cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                    audiencia === valor ? "border-action bg-action/[0.06]" : "border-line bg-surface-1 hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="audiencia"
                    className="mt-0.5 size-4 shrink-0"
                    checked={audiencia === valor}
                    onChange={() => { setAudiencia(valor); setDestinos([]); setBusqueda(""); }}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink-1">{titulo}</span>
                    <span className="block text-xs text-ink-2">{pista}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {audiencia === "TENANT" ? (
            <InlineNote tone="info" title={uiText("Va para todo el personal activo")}>
              {uiText("Quien entre a la empresa más adelante no queda incluido: para esos, vuelve a asignar.")}
            </InlineNote>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="buscar-destinos">{uiText("Elige a quién")}</Label>
                <span className="text-xs text-ink-2">
                  {uiText("{{n}} seleccionadas", { n: destinos.length })}
                  {destinos.length ? (
                    <button type="button" className="ml-2 underline hover:text-ink-1" onClick={() => setDestinos([])}>
                      {uiText("Quitar todas")}
                    </button>
                  ) : null}
                </span>
              </div>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
                <Input
                  id="buscar-destinos"
                  className="pl-9"
                  placeholder={audiencia === "USERS" ? uiText("Busca por nombre o correo") : uiText("Busca por nombre")}
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                />
              </div>
              <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-line">
                {cargando ? (
                  <p className="p-4 text-sm text-ink-2">{uiText("Cargando…")}</p>
                ) : opciones.length ? (
                  opciones.map((opcion) => (
                    <label key={opcion.id} className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-line px-3 last:border-b-0 hover:bg-surface-2">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0"
                        checked={destinos.includes(opcion.id)}
                        onChange={(event) => setDestinos(event.target.checked ? [...destinos, opcion.id] : destinos.filter((id) => id !== opcion.id))}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink-1">{opcion.label}</span>
                        {opcion.detalle ? <span className="block truncate text-xs text-ink-2">{opcion.detalle}</span> : null}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="p-4 text-sm text-ink-2">{uiText("Nadie coincide con esa búsqueda.")}</p>
                )}
              </div>
            </div>
          )}

          {/* Fecha, no fecha y hora: el vencimiento de un curso es un día. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="asignar-desde">{uiText("Disponible desde")}</Label>
              <Input id="asignar-desde" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
              <p className="mt-1 text-xs text-ink-2">{uiText("Si lo dejas vacío, desde hoy.")}</p>
            </div>
            <div>
              <Label htmlFor="asignar-hasta">{uiText("Fecha límite")}</Label>
              <Input id="asignar-hasta" type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} />
              <p className="mt-1 text-xs text-ink-2">{uiText("Si lo dejas vacío, sin vencimiento.")}</p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => cerrar(false)}>{uiText("Cancelar")}</Button>
            {/* El botón dice lo que va a pasar, no el nombre de la operación. */}
            <Button type="submit" disabled={!listo} loading={mutation.isPending} loadingLabel={uiText("Asignando…")}>
              <Users className="size-4" aria-hidden="true" />
              {audiencia === "TENANT"
                ? uiText("Asignar a toda la empresa")
                : uiText("Asignar a {{n}}", { n: seleccionadas ?? 0 })}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
