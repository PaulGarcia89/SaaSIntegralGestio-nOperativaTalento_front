"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, History, Plus, QrCode, RotateCcw, Wrench } from "lucide-react";
import {
  assignInventoryAsset,
  createInventoryAsset,
  createInventoryCatalogItem,
  deliverInventoryAsset,
  downloadInventoryEvidence,
  fetchInventoryAnalytics,
  fetchInventoryAsset,
  fetchInventoryAssets,
  fetchInventoryCatalog,
  fetchInventoryContext,
  getApiErrorMessage,
  receiveInventoryReturn,
  requestInventoryReturn,
  transferInventoryAsset,
  validateInventoryReturn,
} from "@/lib/backend";
import type { InventoryAssetDto, InventoryAssetStatus } from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";
import {
  ActiveContext,
  ConfirmPanel,
  DataView,
  ErrorState,
  ImpactReview,
  InlineNote,
  NextAction,
  PageHeader,
  PageSection,
  StatusBadge,
  StatusTile,
  StatusTileRow,
  type DataColumn,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ASSET_STATUS_OPTIONS,
  CONDITION_OPTIONS,
  assetStatusLabel,
  assetStatusTone,
  conditionLabel,
  formatDateTime,
  movementLabel,
} from "@/lib/inventory-labels";
import { initialOperationState, type OperationImpact, type OperationState } from "@/lib/operation-flow";

/**
 * Inventario de activos: catálogo, custodia, transferencias y devoluciones.
 *
 * Este componente sirve tres rutas del menú —Activos, Entregas y
 * Devoluciones— que hasta ahora mostraban exactamente la misma pantalla, con
 * la misma descripción y la misma acción destacada. En «Entregas» el botón
 * principal decía «Registrar activo», que no es lo que alguien va a hacer
 * allí. Ahora cada ruta declara su intención y con ella su acción recomendada.
 *
 * Qué más cambió
 * --------------
 * · La CONDICIÓN del activo se mostraba con su código en tres sitios, y el
 *   desplegable del formulario ofrecía literalmente «NEW», «GOOD», «FAIR» y
 *   «DAMAGED»: se le pedía a un encargado de almacén que eligiera entre cuatro
 *   palabras en inglés.
 * · Las cinco operaciones —asignar, entregar, transferir, devolver y validar—
 *   compartían UN diálogo con la misma frase, el mismo botón «Confirmar
 *   operación» y el mismo aviso genérico. Ninguna decía qué cambia, a quién
 *   afecta, quién queda como responsable ni si se puede deshacer. Ahora cada
 *   una muestra su impacto, y las que no se deshacen lo dicen y piden
 *   confirmación explícita.
 * · «Recibir devolución» disparaba DOS llamadas encadenadas
 *   (`requestInventoryReturn` y después `receiveInventoryReturn`). Si la
 *   segunda fallaba, la primera ya había cambiado el estado del activo: quedaba
 *   en «Devolución pendiente» sin que nadie la hubiera pedido, y el usuario
 *   solo leía «No fue posible completar la operación». Ahora son dos pasos
 *   explícitos, cada uno con su botón, como los modela el backend.
 * · «Retirar definitivamente» era la tercera opción de un desplegable llamado
 *   «Resultado de validación», confirmada con el mismo botón neutro que
 *   «Disponible». Dar de baja un activo es ahora una decisión aparte, con su
 *   propia advertencia.
 * · Mientras cargaba se pintaban cuatro cifras en cero («Activos visibles: 0»),
 *   que son datos falsos, no un estado de carga.
 * · El error del diálogo era una frase fija que ocultaba lo que respondió el
 *   servidor.
 * · Cada ficha de activo era un `<button>` con una lista de definición dentro:
 *   el lector de pantalla anunciaba los seis datos como nombre del botón.
 *
 * El contrato del backend no cambia: los mismos endpoints, en el mismo orden.
 */

/** Qué viene a hacer alguien a esta pantalla, según la ruta que abrió. */
export type InventoryIntent = "assets" | "deliveries" | "returns";

type DialogKind =
  | "catalog"
  | "asset"
  | "assign"
  | "deliver"
  | "transfer"
  | "requestReturn"
  | "receiveReturn"
  | "validate"
  | "retire"
  | null;

type InventoryContext = Awaited<ReturnType<typeof fetchInventoryContext>>;

export function InventoryWorkspace({
  initialStatus = "",
  title = "Inventario y activos",
  intent = "assets",
}: {
  initialStatus?: InventoryAssetStatus | "";
  title?: string;
  intent?: InventoryIntent;
}) {
  const searchParams = useSearchParams();
  const requestedEmployeeId = searchParams.get("employeeId") ?? "";
  const requestedFlowId = searchParams.get("flowId") ?? "";
  const queryClient = useQueryClient();
  const { can, currentBranch } = useAppStore();
  const canManage = can("asset_inventory.manage");

  const [status, setStatus] = useState<string>(initialStatus);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [dialog, setDialog] = useState<DialogKind>(null);

  const catalog = useQuery({ queryKey: ["inventory-catalog"], queryFn: fetchInventoryCatalog });
  const context = useQuery({ queryKey: ["inventory-context"], queryFn: fetchInventoryContext });
  const assets = useQuery({
    queryKey: ["inventory-assets", status, search, currentBranch?.id],
    queryFn: () =>
      fetchInventoryAssets({ status: status || undefined, search: search || undefined, branchId: currentBranch?.id }),
  });
  /*
   * Cifras del módulo.
   *
   * Antes se contaban en el navegador sobre la página de activos que había
   * llegado, así que «Activos visibles» era literalmente eso —lo visible— y
   * «Disponibles» dependía del filtro puesto. `/inventory/analytics` los
   * cuenta en el servidor sobre TODO el inventario de la sucursal, que es lo
   * que un panel tiene que responder, y trae además el stock bajo mínimo y
   * las operaciones abiertas, que el listado de activos no conoce.
   */
  const analytics = useQuery({
    queryKey: ["inventory-analytics", currentBranch?.id ?? null],
    queryFn: () => fetchInventoryAnalytics(currentBranch?.id),
    enabled: intent === "assets",
    staleTime: 60_000,
  });

  const detail = useQuery({
    queryKey: ["inventory-asset", selectedId],
    queryFn: () => fetchInventoryAsset(selectedId),
    enabled: Boolean(selectedId),
  });

  const selected = detail.data ?? assets.data?.find((asset) => asset.id === selectedId) ?? assets.data?.[0] ?? null;
  const requestedEmployee = context.data?.employees.find((employee) => employee.id === requestedEmployeeId);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inventory-assets"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-asset"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-catalog"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-analytics"] }),
    ]);
  };

  // `intentAction` sigue necesitando un recuento para decidir qué proponer en
  // Entregas y Devoluciones, donde no se pide la analítica. Es un recuento
  // sobre lo cargado y NO se pinta como cifra del módulo: solo elige la
  // acción recomendada.
  const counts = useMemo(() => {
    if (!assets.data) return null;
    return {
      total: assets.data.length,
      available: assets.data.filter((asset) => asset.status === "AVAILABLE").length,
      assigned: assets.data.filter((asset) => asset.status === "ASSIGNED").length,
      attention: assets.data.filter((asset) =>
        ["RETURN_PENDING", "MAINTENANCE", "LOST"].includes(asset.status),
      ).length,
    };
  }, [assets.data]);

  const resumen = analytics.data;
  /** `undefined` mientras carga · `null` si el servidor no lo entrega. */
  const cifra = (valor?: number) =>
    analytics.isError ? null : analytics.isLoading ? undefined : resumen ? (valor ?? 0) : null;
  const porAtender = resumen ? resumen.assets.returnPending + resumen.assets.maintenance : undefined;

  const nextAction = intentAction(intent, counts, canManage);
  const hasFilters = Boolean(search || (status && status !== initialStatus));

  const columns: Array<DataColumn<InventoryAssetDto>> = [
    {
      key: "asset",
      header: "Activo",
      priority: "identity",
      render: (asset) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-1">{asset.item.name}</p>
          <p className="truncate font-mono text-2xs text-ink-3">
            {asset.assetTag} · {asset.serialNumber || "sin número de serie"}
          </p>
        </div>
      ),
      sortValue: (asset) => asset.item.name,
    },
    {
      key: "status",
      header: "Estado",
      priority: "primary",
      render: (asset) => (
        <StatusBadge size="sm" tone={assetStatusTone(asset.status)} label={assetStatusLabel(asset.status)} />
      ),
      sortValue: (asset) => asset.status,
    },
    {
      key: "custody",
      header: "Custodia",
      priority: "primary",
      render: (asset) => asset.employee?.name || "Sin asignar",
      sortValue: (asset) => asset.employee?.name ?? "",
    },
    {
      key: "branch",
      header: "Sucursal",
      priority: "secondary",
      render: (asset) => asset.branch.name,
      sortValue: (asset) => asset.branch.name,
    },
    {
      key: "condition",
      header: "Condición",
      priority: "secondary",
      render: (asset) => conditionLabel(asset.condition),
      sortValue: (asset) => asset.condition,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operaciones"
        title={title}
        description={INTENT_DESCRIPTION[intent]}
        actions={
          canManage ? (
            <Button onClick={() => setDialog("asset")}>
              <Plus className="size-4" aria-hidden="true" />
              Registrar activo
            </Button>
          ) : undefined
        }
      />

      <ActiveContext />

      {requestedEmployee ? (
        <InlineNote tone="info" title={`Incorporación de ${requestedEmployee.name}`}>
          Elige un activo disponible y usa «Asignar». La entrega quedará ligada a su expediente de incorporación
          {requestedFlowId ? "" : ""}.
        </InlineNote>
      ) : null}
      {requestedEmployeeId && context.isSuccess && !requestedEmployee ? (
        <InlineNote tone="warning" title="La persona no está en esta sucursal">
          Cambia de sucursal arriba para poder asignarle un activo.
        </InlineNote>
      ) : null}

      {/* Una sola acción recomendada, y distinta en cada ruta: antes las tres
          mostraban «Registrar activo», que en Entregas y Devoluciones no es lo
          que nadie viene a hacer. */}
      {nextAction ? (
        <NextAction
          label={nextAction.label}
          title={nextAction.title}
          detail={nextAction.detail}
          tone={nextAction.tone}
          actionLabel={nextAction.actionLabel}
          onAction={() => {
            setStatus(nextAction.status);
            setSelectedId("");
          }}
        />
      ) : null}

      {/* ---- Estado del inventario --------------------------------------
          Cifras del servidor sobre TODO el inventario de la sucursal, no
          sobre la página cargada. Solo en la primera pantalla del módulo:
          Entregas y Devoluciones son el segundo nivel y no repiten el
          resumen. */}
      {intent === "assets" ? (
        <StatusTileRow label="Estado del inventario de activos">
          <li className="min-w-0">
            <StatusTile
              title="Disponibles"
              value={cifra(resumen?.assets.available)}
              context="Listos para entregar a alguien."
              onAction={() => {
                setStatus("AVAILABLE");
                setSelectedId("");
              }}
              actionLabel="Ver disponibles"
            />
          </li>
          <li className="min-w-0">
            <StatusTile
              title="En custodia"
              value={cifra(resumen?.assets.assigned)}
              context="Entregados y bajo la responsabilidad de una persona."
              onAction={() => {
                setStatus("ASSIGNED");
                setSelectedId("");
              }}
              actionLabel="Ver en custodia"
            />
          </li>
          <li className="min-w-0">
            <StatusTile
              title="Requieren atención"
              value={cifra(porAtender)}
              context="Devoluciones pendientes y equipos en mantenimiento."
              status={
                typeof porAtender === "number" && porAtender > 0
                  ? { label: "Hay pendientes", tone: "warning" as const }
                  : undefined
              }
              onAction={() => {
                setStatus("RETURN_PENDING");
                setSelectedId("");
              }}
              actionLabel="Ver devoluciones"
            />
          </li>
          <li className="min-w-0">
            <StatusTile
              title="Existencias bajo mínimo"
              value={cifra(resumen?.stock.belowMinimum)}
              context="Referencias del almacén por debajo de su mínimo."
              status={
                resumen && resumen.stock.belowMinimum > 0
                  ? { label: "Reponer", tone: "danger" as const }
                  : undefined
              }
              href="/inventory/assets/warehouse"
              actionLabel="Ver almacén"
            />
          </li>
        </StatusTileRow>
      ) : null}

      {/* ---- Acciones frecuentes ----------------------------------------
          Las cuatro operaciones del día, con icono Y texto. Sin esto, cada
          una vivía a dos o tres pulsaciones dentro del menú lateral. */}
      {intent === "assets" ? (
        <PageSection title="Acciones frecuentes" id="acciones">
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickAction href="/inventory/deliveries" icon={<ArrowRightLeft className="size-5" aria-hidden="true" />} title="Entregar equipo" detail="Reservas esperando confirmación de entrega." />
            <QuickAction href="/inventory/returns" icon={<RotateCcw className="size-5" aria-hidden="true" />} title="Recibir devolución" detail="Equipos que vuelven y hay que validar." />
            <QuickAction href="/inventory/assets/maintenance" icon={<Wrench className="size-5" aria-hidden="true" />} title="Enviar a mantenimiento" detail={resumen ? `${resumen.operations.openMaintenance} órdenes abiertas.` : "Órdenes de mantenimiento."} />
            <QuickAction href="/inventory/scan" icon={<QrCode className="size-5" aria-hidden="true" />} title="Escanear activo" detail="Abre la ficha leyendo su etiqueta." />
          </ul>
        </PageSection>
      ) : null}

      <PageSection title="Filtros" boxed>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
          <div>
            <Label htmlFor="asset-search">Buscar</Label>
            <Input
              id="asset-search"
              value={search}
              placeholder="Etiqueta, número de serie o tipo de activo"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="asset-status">Estado</Label>
            <Select
              value={status || "ALL"}
              onValueChange={(value) => setStatus(value === "ALL" ? "" : value)}
            >
              <SelectTrigger id="asset-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                {ASSET_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PageSection>

      {assets.isError ? (
        <ErrorState
          title="No fue posible cargar el inventario"
          detail={getApiErrorMessage(assets.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void assets.refetch()}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0">
            <DataView
              rows={assets.data ?? []}
              loading={assets.isLoading}
              columns={columns}
              getKey={(asset) => asset.id}
              caption="Activos del inventario"
              onRowAction={(asset) => setSelectedId(asset.id)}
              rowActionLabel={(asset) => `Ver el detalle de ${asset.item.name} (${asset.assetTag})`}
              emptyReason={hasFilters ? "no-matches" : "no-records"}
              emptyAction={
                !hasFilters && canManage ? (
                  <Button onClick={() => setDialog("asset")}>
                    <Plus className="size-4" aria-hidden="true" />
                    Registrar el primer activo
                  </Button>
                ) : undefined
              }
              onClearFilters={
                hasFilters
                  ? () => {
                      setSearch("");
                      setStatus(initialStatus);
                    }
                  : undefined
              }
            />
          </div>

          {selected ? (
            <AssetDetail
              asset={selected}
              loading={detail.isFetching}
              canManage={canManage}
              onAction={setDialog}
            />
          ) : null}
        </div>
      )}

      {!assets.isLoading && !assets.isError && catalog.isSuccess && !catalog.data.length && canManage ? (
        <InlineNote
          tone="info"
          title="Todavía no hay tipos de activo"
          action={
            <Button size="sm" variant="secondary" onClick={() => setDialog("catalog")}>
              Crear un tipo de activo
            </Button>
          }
        >
          Cada activo pertenece a un tipo (portátil, monitor, taladro). Crea el primero para poder registrar activos.
        </InlineNote>
      ) : null}

      <InventoryDialog
        kind={dialog}
        asset={selected}
        catalog={catalog.data ?? []}
        context={context.data}
        initialEmployeeId={requestedEmployee?.id}
        onClose={() => setDialog(null)}
        onSuccess={async () => {
          await refresh();
          setDialog(null);
        }}
      />
    </div>
  );
}

/**
 * Acceso frecuente.
 *
 * Icono Y texto, nunca el icono solo: un icono sin etiqueta obliga a
 * adivinar, y este producto lo usan personas que no vienen de sistemas. La
 * tarjeta entera es el objetivo pulsable, así que en móvil no hay que apuntar
 * a un enlace de 20px.
 */
function QuickAction({
  href,
  icon,
  title,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="group flex h-full min-w-0 items-start gap-3 rounded-lg border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-2">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink-1">{title}</span>
          <span className="mt-0.5 block text-sm text-ink-2">{detail}</span>
        </span>
      </Link>
    </li>
  );
}

const INTENT_DESCRIPTION: Record<InventoryIntent, string> = {
  assets: "Catálogo, custodia, transferencias y devoluciones, con trazabilidad por activo.",
  deliveries: "Activos reservados esperando que alguien confirme la entrega con su evidencia.",
  returns: "Activos que vuelven: recíbelos y valida en qué estado llegan.",
};

/** La acción recomendada de cada ruta, con el porqué que la justifica. */
function intentAction(
  intent: InventoryIntent,
  counts: { total: number; available: number; assigned: number; attention: number } | null,
  canManage: boolean,
) {
  if (!canManage || !counts) return null;

  if (intent === "deliveries") {
    return {
      label: "Lo siguiente",
      title: "Confirmar las entregas reservadas",
      detail: "Un activo reservado sigue sin estar en manos de nadie hasta que se registra la entrega.",
      tone: "progress" as const,
      actionLabel: "Ver los reservados",
      status: "RESERVED" as const,
    };
  }

  if (intent === "returns") {
    return {
      label: counts.attention > 0 ? "Lo más urgente" : "Lo siguiente",
      title: "Recibir y validar las devoluciones",
      detail:
        counts.attention > 0
          ? `${counts.attention} ${counts.attention === 1 ? "activo espera" : "activos esperan"} a que alguien los reciba o valide su estado.`
          : "No hay devoluciones esperando.",
      tone: counts.attention > 0 ? ("warning" as const) : ("progress" as const),
      actionLabel: "Ver las pendientes",
      status: "RETURN_PENDING" as const,
    };
  }

  if (counts.attention > 0) {
    return {
      label: "Lo más urgente",
      title: `${counts.attention} ${counts.attention === 1 ? "activo requiere" : "activos requieren"} atención`,
      detail: "Devoluciones sin recibir, activos en mantenimiento o declarados perdidos.",
      tone: "warning" as const,
      actionLabel: "Ver cuáles",
      status: "RETURN_PENDING" as const,
    };
  }

  return null;
}

function AssetDetail({
  asset,
  loading,
  canManage,
  onAction,
}: {
  asset: InventoryAssetDto;
  loading: boolean;
  canManage: boolean;
  onAction: (action: DialogKind) => void;
}) {
  const moves = asset.movements ?? [];

  return (
    <aside className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:self-start">
      <PageSection title={asset.item.name} description={`${asset.assetTag} · ${asset.branch.name}`} boxed>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={assetStatusTone(asset.status)} label={assetStatusLabel(asset.status)} />
          <span className="text-sm text-ink-2">{conditionLabel(asset.condition)}</span>
        </div>

        {asset.employee ? (
          <div className="mt-4 rounded-md border border-line bg-surface-2 p-3">
            <p className="text-2xs text-ink-3">En custodia de</p>
            <p className="font-medium text-ink-1">{asset.employee.name}</p>
            <p className="text-sm text-ink-2">{asset.employee.jobTitle || asset.employee.email}</p>
          </div>
        ) : null}

        {canManage ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {/* Una acción destacada por estado, y el resto en segundo plano:
                antes había hasta seis botones del mismo peso alternando
                variantes sin criterio. */}
            {asset.status === "AVAILABLE" ? (
              <>
                <Button size="sm" onClick={() => onAction("assign")}>
                  Asignar a una persona
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onAction("transfer")}>
                  <ArrowRightLeft className="size-4" aria-hidden="true" />
                  Transferir
                </Button>
              </>
            ) : null}
            {asset.status === "RESERVED" ? (
              <Button size="sm" onClick={() => onAction("deliver")}>
                Registrar la entrega
              </Button>
            ) : null}
            {asset.status === "ASSIGNED" ? (
              <Button size="sm" variant="secondary" onClick={() => onAction("requestReturn")}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Solicitar devolución
              </Button>
            ) : null}
            {asset.status === "RETURN_PENDING" && !asset.returnedAt ? (
              <Button size="sm" onClick={() => onAction("receiveReturn")}>
                Recibir el activo
              </Button>
            ) : null}
            {asset.status === "RETURN_PENDING" && asset.returnedAt ? (
              <Button size="sm" onClick={() => onAction("validate")}>
                Validar en qué estado llegó
              </Button>
            ) : null}
            <Button asChild size="sm" variant="secondary">
              <Link href={`/inventory/maintenance?assetId=${encodeURIComponent(asset.id)}`}>Mantenimiento</Link>
            </Button>
            {asset.status !== "RETIRED" ? (
              <Button size="sm" variant="ghost" onClick={() => onAction("retire")}>
                Dar de baja
              </Button>
            ) : null}
          </div>
        ) : null}
      </PageSection>

      <PageSection
        title="Historial del activo"
        description={loading ? "Actualizando…" : undefined}
        boxed
      >
        {!moves.length ? (
          <p className="text-sm text-ink-2">Todavía no hay movimientos registrados para este activo.</p>
        ) : (
          <ol className="space-y-4">
            {moves.map((move) => (
              <li key={move.id} className="border-l-2 border-line pl-4">
                <p className="font-medium text-ink-1">{movementLabel(move.type)}</p>
                <p className="font-mono text-2xs text-ink-3 tabular-figures">
                  {formatDateTime(move.occurredAt)} · {move.employee?.name || move.toBranch?.name || asset.branch.name}
                </p>
                {move.notes ? <p className="mt-1 text-sm text-ink-2">{move.notes}</p> : null}
                {move.evidences.map((file) => (
                  <button
                    type="button"
                    key={file.id}
                    className="mt-2 block text-2xs font-medium text-ink-1 underline underline-offset-2"
                    onClick={() => void downloadInventoryEvidence(file.id, file.originalName)}
                  >
                    {file.originalName}
                  </button>
                ))}
              </li>
            ))}
          </ol>
        )}
        {moves.length ? (
          <p className="mt-4 flex items-center gap-2 text-2xs text-ink-3">
            <History className="size-3.5" aria-hidden="true" />
            Cada movimiento queda en la auditoría y no se puede borrar.
          </p>
        ) : null}
      </PageSection>
    </aside>
  );
}

/** Qué es cada operación, en una frase, y si se puede deshacer. */
const OPERATION: Record<
  Exclude<DialogKind, null>,
  { title: string; description: string; confirmLabel: string; irreversible: boolean }
> = {
  catalog: {
    title: "Nuevo tipo de activo",
    description: "Los tipos agrupan activos iguales: «Portátil 14\"», «Monitor 27\"», «Taladro».",
    confirmLabel: "Crear el tipo",
    irreversible: false,
  },
  asset: {
    title: "Registrar un activo",
    description: "Un activo concreto, con su etiqueta única y su número de serie.",
    confirmLabel: "Registrar el activo",
    irreversible: false,
  },
  assign: {
    title: "Asignar a una persona",
    description: "El activo queda reservado a su nombre. Todavía no está entregado.",
    confirmLabel: "Asignar",
    irreversible: false,
  },
  deliver: {
    title: "Registrar la entrega",
    description: "Confirma que el activo ya está físicamente en manos de la persona.",
    confirmLabel: "Registrar la entrega",
    irreversible: true,
  },
  transfer: {
    title: "Transferir a otra sucursal",
    description: "El activo pasa a pertenecer al inventario de la sucursal de destino.",
    confirmLabel: "Transferir",
    irreversible: true,
  },
  requestReturn: {
    title: "Solicitar la devolución",
    description: "Avisa de que el activo tiene que volver. Todavía no se ha recibido.",
    confirmLabel: "Solicitar la devolución",
    irreversible: false,
  },
  receiveReturn: {
    title: "Recibir el activo",
    description: "Confirma que el activo ya está de vuelta y en qué condición llegó.",
    confirmLabel: "Confirmar la recepción",
    irreversible: true,
  },
  validate: {
    title: "Validar la devolución",
    description: "Decide si el activo vuelve a estar disponible o necesita mantenimiento.",
    confirmLabel: "Validar",
    irreversible: true,
  },
  retire: {
    title: "Dar de baja el activo",
    description: "El activo sale del inventario. Deja de poder asignarse, entregarse o transferirse.",
    confirmLabel: "Dar de baja",
    irreversible: true,
  },
};

function InventoryDialog({
  kind,
  asset,
  catalog,
  context,
  initialEmployeeId,
  onClose,
  onSuccess,
}: {
  kind: DialogKind;
  asset: InventoryAssetDto | null;
  catalog: Array<{ id: string; name: string; sku: string }>;
  context?: InventoryContext;
  initialEmployeeId?: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const { currentUser } = useAppStore();
  const [values, setValues] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File>();
  const [acknowledged, setAcknowledged] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (kind === "catalog") return createInventoryCatalogItem({ sku: values.sku, name: values.name });
      if (kind === "asset") {
        return createInventoryAsset({
          itemId: values.itemId,
          branchId: values.branchId,
          assetTag: values.assetTag,
          serialNumber: values.serialNumber,
          condition: values.condition,
        });
      }
      if (!asset) throw new Error("Selecciona un activo");

      if (kind === "assign") {
        const employeeId = values.employeeId || initialEmployeeId || "";
        const workflow = context?.workflowAssignments.find(
          (item) => item.employeeId === employeeId && item.branchId === asset.branchId,
        );
        return assignInventoryAsset(asset.id, { employeeId, workflowAssignmentId: workflow?.id, notes: values.notes });
      }
      if (kind === "deliver") {
        return deliverInventoryAsset(asset.id, { evidence: file, notes: values.notes, condition: values.condition });
      }
      if (kind === "transfer") {
        return transferInventoryAsset(asset.id, {
          toBranchId: values.toBranchId,
          evidence: file,
          notes: values.notes,
          condition: values.condition,
        });
      }
      // Pedir la devolución y recibirla son dos pasos distintos del backend.
      // Encadenarlos dejaba el activo en «Devolución pendiente» cuando la
      // segunda llamada fallaba, sin que nadie la hubiera pedido.
      if (kind === "requestReturn") return requestInventoryReturn(asset.id, values.notes);
      if (kind === "receiveReturn") {
        return receiveInventoryReturn(asset.id, { evidence: file, notes: values.notes, condition: values.condition });
      }
      if (kind === "retire") {
        return validateInventoryReturn(asset.id, {
          status: "RETIRED",
          evidence: file,
          notes: values.notes,
          condition: values.condition,
        });
      }
      return validateInventoryReturn(asset.id, {
        status: values.status || "AVAILABLE",
        evidence: file,
        notes: values.notes,
        condition: values.condition,
      });
    },
    onSuccess,
  });

  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const needsFile = ["deliver", "transfer", "receiveReturn", "validate", "retire"].includes(kind ?? "");
  const copy = kind ? OPERATION[kind] : null;

  const employees = (context?.employees ?? []).filter((employee) =>
    employee.branchAssignments.some((branch) => branch.branchId === asset?.branchId),
  );
  const employee = employees.find((item) => item.id === (values.employeeId || initialEmployeeId));
  const targetBranch = context?.branches.find((branch) => branch.id === values.toBranchId);

  const impact = kind && asset ? buildImpact(kind, asset, currentUser.fullName, { employee, targetBranch, values }) : undefined;

  const operationState: OperationState = {
    ...initialOperationState(),
    step: "confirm",
    completed: ["select", "record", "review"],
    impact,
    submitting: mutation.isPending,
  };

  const missing = missingFields(kind, values, initialEmployeeId);

  return (
    <Dialog
      open={Boolean(kind)}
      onOpenChange={(open) => {
        if (!open) {
          setValues({});
          setFile(undefined);
          setAcknowledged(false);
          mutation.reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{copy?.title ?? "Operación de inventario"}</DialogTitle>
          <DialogDescription>{copy?.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {kind === "catalog" ? (
            <>
              <Field id="catalog-sku" label="SKU" value={values.sku} onChange={(value) => set("sku", value)} />
              <Field
                id="catalog-name"
                label="Nombre del tipo de activo"
                value={values.name}
                onChange={(value) => set("name", value)}
              />
            </>
          ) : null}

          {kind === "asset" ? (
            <>
              <Choice
                id="asset-item"
                label="Tipo de activo"
                value={values.itemId}
                onChange={(value) => set("itemId", value)}
                options={catalog.map((item) => ({ value: item.id, label: `${item.name} · ${item.sku}` }))}
              />
              <Choice
                id="asset-branch"
                label="Sucursal"
                value={values.branchId}
                onChange={(value) => set("branchId", value)}
                options={(context?.branches ?? []).map((branch) => ({ value: branch.id, label: branch.name }))}
              />
              <Field
                id="asset-tag"
                label="Etiqueta única"
                value={values.assetTag}
                onChange={(value) => set("assetTag", value)}
              />
              <Field
                id="asset-serial"
                label="Número de serie"
                value={values.serialNumber}
                onChange={(value) => set("serialNumber", value)}
              />
              <ConditionChoice value={values.condition} onChange={(value) => set("condition", value)} />
            </>
          ) : null}

          {kind === "assign" ? (
            <Choice
              id="assign-employee"
              label="Persona"
              value={values.employeeId || initialEmployeeId}
              onChange={(value) => set("employeeId", value)}
              options={employees.map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.jobTitle || item.email}`,
              }))}
            />
          ) : null}

          {kind === "transfer" ? (
            <Choice
              id="transfer-branch"
              label="Sucursal de destino"
              value={values.toBranchId}
              onChange={(value) => set("toBranchId", value)}
              options={(context?.branches ?? [])
                .filter((branch) => branch.id !== asset?.branchId)
                .map((branch) => ({ value: branch.id, label: branch.name }))}
            />
          ) : null}

          {["deliver", "receiveReturn", "validate", "retire"].includes(kind ?? "") ? (
            <ConditionChoice value={values.condition} onChange={(value) => set("condition", value)} />
          ) : null}

          {/* «Retirar definitivamente» era la tercera opción de este
              desplegable, junto a «Disponible». Ahora la baja tiene su propia
              acción y aquí solo quedan los dos destinos reversibles. */}
          {kind === "validate" ? (
            <Choice
              id="validate-result"
              label="¿En qué estado queda?"
              value={values.status || "AVAILABLE"}
              onChange={(value) => set("status", value)}
              options={[
                { value: "AVAILABLE", label: "Disponible para volver a asignarse" },
                { value: "MAINTENANCE", label: "Necesita mantenimiento" },
              ]}
            />
          ) : null}

          {!["catalog", "asset"].includes(kind ?? "") ? (
            <Field
              id="operation-notes"
              label="Notas"
              value={values.notes}
              placeholder="Opcional"
              onChange={(value) => set("notes", value)}
            />
          ) : null}

          {needsFile ? (
            <div>
              <Label htmlFor="inventory-evidence">Evidencia (PDF, JPG o PNG)</Label>
              <Input
                id="inventory-evidence"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(event) => setFile(event.target.files?.[0])}
              />
              <p className="mt-1 text-2xs text-ink-3">
                Queda adjunta al movimiento del activo y no se puede sustituir después.
              </p>
            </div>
          ) : null}

          {mutation.isError ? (
            <InlineNote tone="danger" title="No se pudo completar la operación">
              {getApiErrorMessage(mutation.error, "El servidor rechazó la operación.")}
            </InlineNote>
          ) : null}

          {missing.length ? (
            <p className="text-sm text-ink-2">
              Falta {missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} y ${missing.at(-1)}`}.
            </p>
          ) : null}

          {impact && copy ? (
            <>
              <ImpactReview impact={impact} />
              <ConfirmPanel
                state={operationState}
                operationName={copy.title}
                onConfirm={() => mutation.mutate()}
                acknowledged={acknowledged}
                onAcknowledgedChange={setAcknowledged}
              />
            </>
          ) : (
            <Button
              className="w-full"
              disabled={missing.length > 0}
              loading={mutation.isPending}
              loadingLabel="Guardando…"
              onClick={() => mutation.mutate()}
            >
              {copy?.confirmLabel ?? "Confirmar"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Qué cambia con cada operación, con los datos que la pantalla ya tiene.
 *
 * Solo se construye para las operaciones que actúan sobre un activo existente:
 * crear un tipo o registrar un activo no tienen «antes».
 */
function buildImpact(
  kind: Exclude<DialogKind, null>,
  asset: InventoryAssetDto,
  responsible: string,
  extra: {
    employee?: { name: string };
    targetBranch?: { name: string };
    values: Record<string, string>;
  },
): OperationImpact | undefined {
  if (kind === "catalog" || kind === "asset") return undefined;

  const copy = OPERATION[kind];
  const currentStatus = assetStatusLabel(asset.status);
  const custody = asset.employee?.name ?? "Sin asignar";
  const lines: OperationImpact["lines"] = [];
  const warnings: OperationImpact["warnings"] = [];
  const blockers: OperationImpact["blockers"] = [];

  if (kind === "assign") {
    lines.push({ label: "Estado", before: currentStatus, after: "Reservado" });
    lines.push({ label: "Custodia", before: custody, after: extra.employee?.name ?? "Sin elegir" });
    if (!extra.employee) {
      blockers.push({
        code: "NO_EMPLOYEE",
        cause: "No has elegido a quién se le asigna.",
        owner: "Quien gestiona el inventario",
        resolution: "Elige una persona de la sucursal del activo.",
        fieldId: "assign-employee",
      });
    }
  }

  if (kind === "deliver") {
    lines.push({ label: "Estado", before: currentStatus, after: "Entregado" });
    lines.push({ label: "Responsable del activo", before: "La empresa", after: custody });
  }

  if (kind === "transfer") {
    lines.push({ label: "Sucursal", before: asset.branch.name, after: extra.targetBranch?.name ?? "Sin elegir" });
    lines.push({ label: "Estado", before: currentStatus, after: "En tránsito" });
    if (!extra.targetBranch) {
      blockers.push({
        code: "NO_BRANCH",
        cause: "No has elegido la sucursal de destino.",
        owner: "Quien gestiona el inventario",
        resolution: "Elige a qué sucursal se traslada el activo.",
        fieldId: "transfer-branch",
      });
    } else {
      warnings.push({
        code: "OUT_OF_SCOPE",
        message: `El activo dejará de aparecer en el inventario de ${asset.branch.name}.`,
      });
    }
  }

  if (kind === "requestReturn") {
    lines.push({ label: "Estado", before: currentStatus, after: "Devolución pendiente" });
    lines.push({ label: "Custodia", before: custody, after: `${custody} (hasta que lo entregue)` });
  }

  if (kind === "receiveReturn") {
    lines.push({ label: "Estado", before: currentStatus, after: "Recibido, pendiente de validar" });
    lines.push({ label: "Custodia", before: custody, after: "La empresa" });
  }

  if (kind === "validate") {
    const target = extra.values.status || "AVAILABLE";
    lines.push({ label: "Estado", before: currentStatus, after: assetStatusLabel(target) });
    if (extra.values.condition) {
      lines.push({
        label: "Condición registrada",
        before: conditionLabel(asset.condition),
        after: conditionLabel(extra.values.condition),
        adverse: extra.values.condition === "DAMAGED",
      });
    }
  }

  if (kind === "retire") {
    lines.push({ label: "Estado", before: currentStatus, after: "Retirado" });
    lines.push({ label: "Disponible para asignar", before: "Sí", after: "No" });
    warnings.push({
      code: "OUT_OF_INVENTORY",
      message: "Deja de contar en las cifras del inventario y no se puede volver a asignar, entregar ni transferir.",
    });
  }

  return {
    headline: `${copy.title}: ${asset.item.name} (${asset.assetTag})`,
    affectedCount: 1,
    affectedLabel: "activo",
    lines,
    warnings,
    blockers,
    responsible,
    irreversible: copy.irreversible,
  };
}

function missingFields(kind: DialogKind, values: Record<string, string>, initialEmployeeId?: string): string[] {
  const missing: string[] = [];
  if (kind === "catalog") {
    if (!values.sku?.trim()) missing.push("el SKU");
    if (!values.name?.trim()) missing.push("el nombre");
  }
  if (kind === "asset") {
    if (!values.itemId) missing.push("el tipo de activo");
    if (!values.branchId) missing.push("la sucursal");
    if (!values.assetTag?.trim()) missing.push("la etiqueta única");
  }
  if (kind === "assign" && !(values.employeeId || initialEmployeeId)) missing.push("la persona");
  if (kind === "transfer" && !values.toBranchId) missing.push("la sucursal de destino");
  return missing;
}

function Field({
  id,
  label,
  value = "",
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Choice({
  id,
  label,
  value = "",
  onChange,
  options,
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Seleccionar" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** El desplegable ofrecía «NEW», «GOOD», «FAIR» y «DAMAGED» sin traducir. */
function ConditionChoice({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  return (
    <Choice
      id="asset-condition"
      label="Condición"
      value={value}
      onChange={onChange}
      options={CONDITION_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
    />
  );
}
