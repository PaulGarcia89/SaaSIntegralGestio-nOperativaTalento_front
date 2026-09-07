"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Wrench } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  createInventoryMaintenance,
  fetchInventoryAssets,
  fetchInventoryMaintenance,
  getApiErrorMessage,
  resolveInventoryMaintenance,
} from "@/lib/backend";
import {
  ConfirmPanel,
  EmptyState,
  ErrorState,
  InlineNote,
  PageHeader,
  PageSection,
  SkeletonRows,
  StatusBadge,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";
import {
  MAINTENANCE_TYPE_OPTIONS,
  formatDateTime,
  formatMoney,
  maintenanceStatusLabel,
  maintenanceStatusTone,
  maintenanceTypeLabel,
} from "@/lib/inventory-labels";
import { initialOperationState, type OperationImpact, type OperationState } from "@/lib/operation-flow";

type Ticket = Awaited<ReturnType<typeof fetchInventoryMaintenance>>[number];

/**
 * Mantenimiento de activos.
 *
 * Qué cambió
 * ----------
 * · Era la única pantalla del módulo SIN estado de carga, SIN estado de error
 *   y SIN estado vacío: `tickets.data?.map(...)` sobre `undefined` dejaba la
 *   página en blanco bajo el título tanto mientras cargaba como si la consulta
 *   fallaba, y las dos situaciones se veían igual.
 * · «Resolver» cerraba la orden con un clic: sin confirmación, sin decir que
 *   no se deshace, sin recoger el coste real ni las notas —que el endpoint sí
 *   acepta— y SIN `.catch`, así que un fallo del servidor no se veía y quedaba
 *   la impresión de que se había resuelto.
 * · El tipo y el estado se imprimían con su código: se leía «CORRECTIVE ·
 *   OPEN».
 * · El campo «Tipo» era un texto libre con «CORRECTIVO» de valor inicial
 *   mientras el backend devuelve «CORRECTIVE»: se guardaba en español lo que
 *   luego se mostraba en inglés. Ahora es una lista cerrada.
 * · El listado de activos enlazaba aquí con `?assetId=`, pero esta pantalla
 *   nunca leía los parámetros: el activo preseleccionado se perdía y había que
 *   buscarlo a mano.
 *
 * El contrato del backend no cambia.
 */
export default function InventoryMaintenancePage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const requestedAssetId = searchParams.get("assetId") ?? "";
  const { currentUser } = useAppStore();

  const [open, setOpen] = useState(Boolean(requestedAssetId));
  const [resolving, setResolving] = useState<Ticket | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const tickets = useQuery({ queryKey: ["inventory-maintenance"], queryFn: fetchInventoryMaintenance });
  const assets = useQuery({ queryKey: ["inventory-assets"], queryFn: () => fetchInventoryAssets() });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inventory-maintenance"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-assets"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-analytics"] }),
    ]);

  const resolve = useMutation({
    mutationFn: (ticket: Ticket) =>
      resolveInventoryMaintenance(ticket.id, {
        costAmount: cost.trim() ? Number(cost) : undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: async () => {
      closeResolve();
      await refresh();
    },
  });

  function openResolve(ticket: Ticket) {
    setResolving(ticket);
    setAcknowledged(false);
    setCost(ticket.costAmount === undefined || ticket.costAmount === null ? "" : String(ticket.costAmount));
    setNotes("");
    resolve.reset();
  }

  function closeResolve() {
    setResolving(null);
    setAcknowledged(false);
    setCost("");
    setNotes("");
  }

  const impact: OperationImpact | undefined = resolving
    ? {
        headline: `Cerrar el mantenimiento «${resolving.title}»`,
        affectedCount: 1,
        affectedLabel: "activo",
        lines: [
          {
            label: resolving.asset.item.name,
            before: maintenanceStatusLabel(resolving.status),
            after: "Resuelto",
          },
          {
            label: "Disponibilidad del activo",
            before: "En mantenimiento",
            after: "Vuelve a estar disponible",
          },
        ],
        cost: cost.trim()
          ? { label: "Coste real del trabajo", amount: formatMoney(cost, resolving.currency), adverse: true }
          : undefined,
        warnings: cost.trim()
          ? []
          : [
              {
                code: "NO_COST",
                message: "Sin coste real, el gasto de este mantenimiento no queda registrado en la ficha del activo.",
              },
            ],
        blockers: [],
        responsible: currentUser.fullName,
        // Cerrar la orden la saca de la cola y libera el activo; reabrirla
        // exige crear otra orden, que no es un «deshacer».
        irreversible: true,
      }
    : undefined;

  const operationState: OperationState = {
    ...initialOperationState(),
    step: "confirm",
    completed: ["select", "record", "review"],
    impact,
    submitting: resolve.isPending,
  };

  const openTickets = tickets.data?.filter((ticket) => ticket.status.toUpperCase() !== "RESOLVED") ?? [];
  const closedTickets = tickets.data?.filter((ticket) => ticket.status.toUpperCase() === "RESOLVED") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ciclo de vida"
        title="Mantenimiento de activos"
        description="Trabajos preventivos y correctivos, con su coste y su fecha objetivo."
        meta={openTickets.length ? <span>{openTickets.length} sin cerrar</span> : null}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Registrar mantenimiento
          </Button>
        }
      />

      {resolve.error ? (
        <InlineNote tone="danger" title="No se pudo cerrar el mantenimiento">
          {getApiErrorMessage(resolve.error, "El servidor rechazó la operación.")}
        </InlineNote>
      ) : null}

      {tickets.isLoading ? (
        <SkeletonRows rows={4} label="Cargando los mantenimientos" />
      ) : tickets.isError ? (
        <ErrorState
          title="No fue posible cargar los mantenimientos"
          detail={getApiErrorMessage(tickets.error, "Reintenta la consulta para continuar.")}
          onRetry={() => void tickets.refetch()}
        />
      ) : !tickets.data?.length ? (
        <EmptyState
          reason="no-records"
          title="No hay mantenimientos registrados"
          description="Registra uno cuando un activo necesite revisión, reparación o calibración."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Registrar el primero
            </Button>
          }
        />
      ) : (
        <>
          <PageSection
            title="Sin cerrar"
            description="Trabajos que todavía mantienen un activo fuera de servicio."
          >
            {openTickets.length ? (
              <TicketList tickets={openTickets} onResolve={openResolve} />
            ) : (
              <InlineNote tone="success" title="Nada pendiente">
                Todos los mantenimientos registrados están cerrados.
              </InlineNote>
            )}
          </PageSection>

          {closedTickets.length ? (
            <PageSection title="Cerrados" description="Historial de los trabajos ya resueltos.">
              <TicketList tickets={closedTickets} />
            </PageSection>
          ) : null}
        </>
      )}

      <MaintenanceDialog
        open={open}
        assets={assets.data ?? []}
        initialAssetId={requestedAssetId}
        onClose={() => setOpen(false)}
        onSuccess={async () => {
          await refresh();
          setOpen(false);
        }}
      />

      <Dialog open={Boolean(resolving)} onOpenChange={(next) => !next && closeResolve()}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Cerrar el mantenimiento</DialogTitle>
            <DialogDescription>
              Registra cómo terminó el trabajo antes de darlo por resuelto.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="maintenance-cost">Coste real</Label>
              <Input
                id="maintenance-cost"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={cost}
                placeholder="Opcional"
                onChange={(event) => setCost(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maintenance-notes">Qué se hizo</Label>
              <Input
                id="maintenance-notes"
                value={notes}
                placeholder="Opcional"
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>

          {impact ? (
            <ConfirmPanel
              state={operationState}
              operationName="Cerrar el mantenimiento"
              onConfirm={() => resolving && resolve.mutate(resolving)}
              onBack={closeResolve}
              acknowledged={acknowledged}
              onAcknowledgedChange={setAcknowledged}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TicketList({ tickets, onResolve }: { tickets: Ticket[]; onResolve?: (ticket: Ticket) => void }) {
  return (
    <ul className="divide-y divide-line">
      {tickets.map((ticket) => (
        <li key={ticket.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 py-4">
          <div className="min-w-0">
            <p className="font-medium text-ink-1">{ticket.title}</p>
            <p className="truncate text-sm text-ink-2">
              {ticket.asset.item.name} · {ticket.asset.assetTag} · {ticket.asset.branch.name}
            </p>
            <p className="mt-1 text-2xs text-ink-3">
              {maintenanceTypeLabel(ticket.type)}
              {ticket.dueAt ? ` · vence el ${formatDateTime(ticket.dueAt)}` : " · sin fecha objetivo"}
              {ticket.costAmount !== undefined && ticket.costAmount !== null
                ? ` · ${formatMoney(ticket.costAmount, ticket.currency)}`
                : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <StatusBadge
              size="sm"
              tone={maintenanceStatusTone(ticket.status)}
              label={maintenanceStatusLabel(ticket.status)}
            />
            {onResolve ? (
              <Button size="sm" variant="secondary" onClick={() => onResolve(ticket)}>
                Cerrar
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function MaintenanceDialog({
  open,
  assets,
  initialAssetId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  assets: Array<{ id: string; assetTag: string; item: { name: string } }>;
  initialAssetId?: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({
    type: "CORRECTIVE",
    assetId: initialAssetId ?? "",
  });
  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const mutation = useMutation({
    mutationFn: () =>
      createInventoryMaintenance({
        assetId: values.assetId,
        title: values.title,
        type: values.type,
        dueAt: values.dueAt || undefined,
        costAmount: values.cost?.trim() ? Number(values.cost) : undefined,
        vendor: values.vendor,
        description: values.description,
      }),
    onSuccess,
  });

  const asset = assets.find((item) => item.id === values.assetId);

  const missing: string[] = [];
  if (!values.assetId) missing.push("el activo");
  if (!values.title?.trim()) missing.push("el título del trabajo");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar un mantenimiento</DialogTitle>
          <DialogDescription>
            {asset
              ? `Sobre ${asset.item.name} (${asset.assetTag}). El activo quedará marcado como en mantenimiento.`
              : "El activo quedará marcado como en mantenimiento hasta que se cierre el trabajo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="maintenance-asset">Activo</Label>
            <Select value={values.assetId} onValueChange={(value) => set("assetId", value)}>
              <SelectTrigger id="maintenance-asset">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.item.name} · {item.assetTag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maintenance-title">Título del trabajo</Label>
            <Input
              id="maintenance-title"
              value={values.title ?? ""}
              placeholder="Cambio de batería"
              onChange={(event) => set("title", event.target.value)}
            />
          </div>

          {/* Lista cerrada: el campo era texto libre y guardaba «CORRECTIVO»
              donde el backend espera «CORRECTIVE». */}
          <div>
            <Label htmlFor="maintenance-type">Tipo</Label>
            <Select value={values.type} onValueChange={(value) => set("type", value)}>
              <SelectTrigger id="maintenance-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="maintenance-due">Fecha objetivo</Label>
              <Input
                id="maintenance-due"
                type="date"
                value={values.dueAt ?? ""}
                onChange={(event) => set("dueAt", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="maintenance-estimate">Coste estimado</Label>
              <Input
                id="maintenance-estimate"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={values.cost ?? ""}
                onChange={(event) => set("cost", event.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="maintenance-vendor">Proveedor</Label>
            <Input
              id="maintenance-vendor"
              value={values.vendor ?? ""}
              placeholder="Opcional"
              onChange={(event) => set("vendor", event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="maintenance-description">Descripción</Label>
            <Input
              id="maintenance-description"
              value={values.description ?? ""}
              placeholder="Opcional"
              onChange={(event) => set("description", event.target.value)}
            />
          </div>

          {mutation.isError ? (
            <InlineNote tone="danger" title="No se pudo registrar">
              {getApiErrorMessage(mutation.error, "El servidor rechazó el mantenimiento.")}
            </InlineNote>
          ) : null}

          {missing.length ? (
            <p className="text-sm text-ink-2">
              Falta {missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} y ${missing.at(-1)}`}.
            </p>
          ) : null}

          <Button
            className="w-full"
            disabled={missing.length > 0}
            loading={mutation.isPending}
            loadingLabel="Registrando…"
            onClick={() => mutation.mutate()}
          >
            <Wrench className="size-4" aria-hidden="true" />
            Registrar mantenimiento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
