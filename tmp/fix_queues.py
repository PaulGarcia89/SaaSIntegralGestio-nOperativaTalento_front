"""
Consola de bus y colas: deja de hablar en claves, rutas y camelCase.

Es la pantalla de un público técnico, así que la jerga del dominio («cola»,
«latencia p95») se conserva. Lo que se corrige es otra cosa: nombres de
permisos, rutas de API y claves de JSON que se colaron en el texto que lee
una persona, y dos colores crudos que rompen el tema oscuro.
"""

P = "src/app/(app)/admin/queues/page.tsx"

PAIRS = [
    # ── Una clave de permiso dentro de un mensaje de error ─────────────────
    (
        '''          ? "Tu sesión no tiene el permiso platform.integrations.manage."''',
        '''          ? "Tu sesión no tiene permiso para supervisar las integraciones de la plataforma."''',
    ),
    # ── Una ruta de API contada como si fuera una explicación ──────────────
    (
        '''            ? "El backend actual no expone uno o más endpoints de observabilidad."''',
        '''            ? "Esta instalación del servidor todavía no publica la supervisión del bus. Hay que actualizarla."''',
    ),
    # ── Tres «funciones pendientes» descritas con su ruta HTTP ─────────────
    (
        '''        <SectionCard title="Eventos y trazabilidad" subtitle="Endpoint pendiente">
          <StateCard tone="empty" title="Función no disponible" description="Falta GET /api/admin/event-bus/events y su detalle para consultar payload sanitizado, intentos y correlation ID." />
        </SectionCard>
        <SectionCard title="Consumidores" subtitle="Endpoint pendiente">
          <StateCard tone="empty" title="Función no disponible" description="Falta GET /api/admin/event-bus/consumers para mostrar instancias, concurrencia, throughput y heartbeat." />
        </SectionCard>
        <SectionCard title="Auditoría operativa" subtitle="Endpoint pendiente">
          <StateCard tone="empty" title="Función no disponible" description="Falta GET /api/admin/event-bus/audit. No se simulan acciones ni registros de auditoría." />
        </SectionCard>''',
        '''        <SectionCard title="Eventos y trazabilidad" subtitle="Todavía no disponible">
          <StateCard
            tone="empty"
            title="No se puede seguir un evento concreto"
            description="Para ver el contenido de un evento, sus intentos y su identificador de correlación hace falta una versión del servidor que todavía no está desplegada."
          />
        </SectionCard>
        <SectionCard title="Consumidores" subtitle="Todavía no disponible">
          <StateCard
            tone="empty"
            title="No se pueden ver los procesos que consumen la cola"
            description="Cuántas instancias hay, cuánto procesan y cuándo dieron señal de vida requiere una versión del servidor que todavía no está desplegada."
          />
        </SectionCard>
        <SectionCard title="Auditoría operativa" subtitle="Todavía no disponible">
          <StateCard
            tone="empty"
            title="No hay auditoría de las acciones sobre la cola"
            description="Requiere una versión del servidor que todavía no está desplegada. No se muestra nada inventado mientras tanto."
          />
        </SectionCard>''',
    ),
    # ── Verde crudo: en tema oscuro queda texto oscuro sobre fondo oscuro ──
    (
        '''            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">''',
        '''            <p className="rounded-lg border border-status-success/30 bg-status-success/10 px-3 py-2 text-sm text-ink-1">''',
    ),
    # ── Claves de JSON usadas como rótulos ────────────────────────────────
    (
        '''                        <dt className="text-muted-foreground">{key}</dt>''',
        '''                        <dt className="text-muted-foreground">{humanizeFieldKey(key)}</dt>''',
    ),
    # ── Un objeto volcado con JSON.stringify en medio de la ficha ─────────
    (
        '''function evidenceValue(value: unknown) {
  if (value === null || value === undefined) return "No informado";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}''',
        '''function evidenceValue(value: unknown) {
  if (value === null || value === undefined) return "No informado";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.length === 0 ? "Ninguno" : value.map(evidenceValue).join(", ");
  // Un objeto anidado se resume en vez de volcarse como JSON: `{"a":1,"b":2}`
  // en medio de una ficha no es información, es ruido.
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "Sin datos";
    return entries.map(([key, nested]) => `${humanizeFieldKey(key)}: ${evidenceValue(nested)}`).join(" · ");
  }
  return String(value);
}''',
    ),
    # ── Formatos duplicados: ya viven en platform-labels, con pruebas ─────
    (
        '''function formatDate(value: string | null) {
  if (!value) return "Sin actividad";
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(value: number) {
  if (value < 1_000) return `${Math.round(value)} ms`;
  return `${(value / 1_000).toFixed(2)} s`;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)) - 1, units.length - 1);
  return `${(value / 1024 ** (index + 1)).toFixed(index > 0 ? 2 : 1)} ${units[index]}`;
}''',
        '''function formatDate(value: string | null) {
  if (!value) return "Sin actividad";
  return formatDateTime(value);
}

const formatDuration = formatMillis;''',
    ),
    # ── «Dead letter» a secas, cuatro veces, sin explicar nunca qué es ────
    (
        '''      <SectionCard title="Dead letter" subtitle={`${deadLetter.openCount} abiertos`}>
        {deadLetter.events.length === 0 ? (
          <StateCard tone="empty" title="Sin eventos en dead letter" description="No hay eventos pendientes de revisión." />''',
        '''      <SectionCard
        title="Eventos descartados"
        subtitle={`${deadLetter.openCount} sin resolver · cola «dead letter»`}
      >
        {deadLetter.events.length === 0 ? (
          <StateCard
            tone="empty"
            title="Ningún evento fue descartado"
            description="Todo lo que entró a la cola acabó procesándose o sigue en reintento."
          />''',
    ),
    (
        '''                { key: "dead", header: "Dead letter", sortable: true, render: (tenant) => tenant.deadLetter, sortValue: (tenant) => tenant.deadLetter },''',
        '''                { key: "dead", header: "Descartados", sortable: true, render: (tenant) => tenant.deadLetter, sortValue: (tenant) => tenant.deadLetter },''',
    ),
    (
        '''        <MetricCard label="Fallidos" value={String(overview.summary.failedJobs)} detail={`${deadLetter.openCount} en dead letter`} period={periodOptions.find((option) => option.value === periodHours)?.label} />''',
        '''        <MetricCard label="Fallidos" value={String(overview.summary.failedJobs)} detail={`${deadLetter.openCount} descartados sin resolver`} period={periodOptions.find((option) => option.value === periodHours)?.label} />''',
    ),
    (
        '''        description="Supervisa procesamiento, reintentos, latencia y eventos enviados a dead letter en toda la plataforma."''',
        '''        description="Procesamiento, reintentos, latencia y eventos descartados de toda la plataforma. Vista de solo lectura: desde aquí no se reintenta ni se borra nada."''',
    ),
    # ── El error de la certificación ocultaba lo que respondió el servidor ─
    (
        '''          {certificationMutation.isError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              La certificación no pudo completarse. Revisa conectividad, credenciales y logs del backend.
            </p>
          ) : null}''',
        '''          {certificationMutation.isError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(
                certificationMutation.error,
                "La certificación no pudo completarse. Revisa conectividad y credenciales.",
              )}
            </p>
          ) : null}''',
    ),
    (
        '''          {storageMaintenanceMutation.isError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              No fue posible completar el mantenimiento. Revisa la conexión y los permisos del bucket.
            </p>
          ) : null}''',
        '''          {storageMaintenanceMutation.isError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(
                storageMaintenanceMutation.error,
                "No fue posible completar el mantenimiento. Revisa la conexión y los permisos del almacenamiento.",
              )}
            </p>
          ) : null}''',
    ),
    # ── Acceso denegado: StateCard genérico → quién resuelve y cómo ───────
    (
        '''      <StateCard
        tone="restricted"
        title="Consola exclusiva de superadministración"
        description="La supervisión global del bus y las colas requiere alcance de superadministrador."
      />''',
        '''      <BlockedState
        title="Sin acceso a la consola de plataforma"
        cause="La supervisión del bus y las colas abarca la actividad de todas las empresas a la vez."
        owner="Quien administra la plataforma"
        resolution="Si necesitas consultarla, pide acceso de administración de plataforma."
      />''',
    ),
    # ── Los tres filtros apretados dentro del encabezado ──────────────────
    (
        '''        actions={
          <div className="flex flex-wrap items-center gap-2">''',
        '''        actions={
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:w-auto lg:flex-wrap lg:items-center">''',
    ),
    (
        '''            <FormSelect
              aria-label="Filtrar por empresa"
              className="min-w-52"''',
        '''            <FormSelect
              aria-label="Filtrar por empresa"
              className="min-w-0 lg:min-w-52"''',
    ),
    (
        '''            <FormSelect
              aria-label="Seleccionar periodo"
              className="min-w-44"''',
        '''            <FormSelect
              aria-label="Seleccionar periodo"
              className="min-w-0 lg:min-w-44"''',
    ),
    (
        '''            <FormSelect
              aria-label="Configurar actualización automática"
              className="min-w-48"''',
        '''            <FormSelect
              aria-label="Configurar actualización automática"
              className="min-w-0 lg:min-w-48"''',
    ),
    # ── Rejillas con tablas dentro y sin min-w-0: desbordan a 320 px ──────
    (
        '''      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Rendimiento por dominio" subtitle="Eventos">''',
        '''      <div className="grid min-w-0 gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <SectionCard title="Rendimiento por dominio" subtitle="Eventos">''',
    ),
    (
        '''      <div className="grid gap-6 xl:grid-cols-3">''',
        '''      <div className="grid min-w-0 gap-6 xl:grid-cols-3 [&>*]:min-w-0">''',
    ),
    # ── Importaciones ─────────────────────────────────────────────────────
    (
        '''import {
  ApiError,
  fetchAtsStorageOperations,''',
        '''import { BlockedState } from "@/components/system";
import { formatBytes, formatDateTime, formatMillis, humanizeFieldKey } from "@/lib/platform-labels";
import {
  ApiError,
  fetchAtsStorageOperations,
  getApiErrorMessage,''',
    ),
]


def main():
    import unicodedata

    src = open(P, encoding="utf-8").read()
    original = src
    for raw_old, raw_new in PAIRS:
        # El repositorio guarda los acentos en NFC; estos patrones pueden
        # llegar en NFD y entonces no casan aunque se lean idénticos.
        old = unicodedata.normalize("NFC", raw_old)
        new = unicodedata.normalize("NFC", raw_new)
        count = src.count(old)
        assert count == 1, f"{count} apariciones de:\n{old[:180]}"
        src = src.replace(old, new)
    assert src != original
    open(P, "w", encoding="utf-8").write(src)
    print("ok", P, len(PAIRS), "cambios")


main()
