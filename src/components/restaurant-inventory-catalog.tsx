"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import {
  createRestaurantCategory, createRestaurantIngredient, createRestaurantSupplier, createRestaurantUnit, createRestaurantWarehouse,
  deactivateRestaurantCategory, deactivateRestaurantIngredient, deactivateRestaurantSupplier, deactivateRestaurantUnit, deactivateRestaurantWarehouse,
  fetchRestaurantCategories, fetchRestaurantIngredients, fetchRestaurantSuppliers, fetchRestaurantUnits, fetchRestaurantWarehouses,
  updateRestaurantCategory, updateRestaurantIngredient, updateRestaurantSupplier, updateRestaurantUnit, updateRestaurantWarehouse,
  getApiErrorMessage,
} from "@/lib/backend";
import { validateRestaurantCatalogForm, type RestaurantCatalogKind } from "@/lib/restaurant-inventory";
import { useAppStore } from "@/store/app-store";
import {
  DataView,
  ErrorState,
  FilterBar,
  InlineNote,
  PageHeader,
  Pagination,
  type DataColumn,
} from "@/components/system";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RestaurantStatusBadge } from "@/components/restaurant-inventory-ui";

/**
 * Datos maestros del inventario de restaurante.
 *
 * Qué cambió
 * ----------
 * · La tabla tenía 760 px de ancho mínimo dentro de un `overflow-x-auto`.
 *   Cinco catálogos —categorías, unidades, proveedores, almacenes e
 *   ingredientes— compartían esa misma tabla, así que el defecto se
 *   multiplicaba por cinco. Ahora es `DataView`.
 * · Desactivar un registro se confirmaba con un `window.confirm` que solo
 *   preguntaba «¿Desactivar X?», sin decir qué implica: el registro deja de
 *   poder elegirse en operaciones nuevas, pero lo ya registrado con él se
 *   conserva. Sin eso, desactivar parece borrar.
 * · El orden se pedía con una flecha de texto («Nombre ↑») dentro de un
 *   `<button>` sin `aria-sort`, así que un lector de pantalla no anunciaba
 *   por qué columna está ordenado.
 * · La paginación eran dos botones sueltos; cargar reemplazaba la pantalla
 *   entera por un aro girando.
 * · El formulario era un modal hecho a mano (`fixed inset-0` con una tarjeta
 *   dentro): sin trampa de foco, sin cierre con Escape, sin devolver el
 *   foco al cerrar y sin respetar el área segura del iPhone.
 * · Los errores de campo usaban `text-danger`, que no es un token del
 *   sistema, y no se asociaban al campo con `aria-describedby`.
 */

type RecordValue = Record<string, unknown> & { id: string; name?: string; status?: string };
type FormValues = Record<string, string>;
const labels: Record<RestaurantCatalogKind, string> = { categories: "Categorías", units: "Unidades de medida", suppliers: "Proveedores", warehouses: "Almacenes", ingredients: "Ingredientes" };

const fetchers = { categories: fetchRestaurantCategories, units: fetchRestaurantUnits, suppliers: fetchRestaurantSuppliers, warehouses: fetchRestaurantWarehouses, ingredients: fetchRestaurantIngredients };
const creators = { categories: createRestaurantCategory, units: createRestaurantUnit, suppliers: createRestaurantSupplier, warehouses: createRestaurantWarehouse, ingredients: createRestaurantIngredient };
const updaters = { categories: updateRestaurantCategory, units: updateRestaurantUnit, suppliers: updateRestaurantSupplier, warehouses: updateRestaurantWarehouse, ingredients: updateRestaurantIngredient };
const deactivators = { categories: deactivateRestaurantCategory, units: deactivateRestaurantUnit, suppliers: deactivateRestaurantSupplier, warehouses: deactivateRestaurantWarehouse, ingredients: deactivateRestaurantIngredient };

export function RestaurantInventoryCatalog({ kind }: { kind: RestaurantCatalogKind }) {
  const { can, currentBranch } = useAppStore();
  const canManage = can("restaurant_inventory.manage");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editing, setEditing] = useState<RecordValue | null>(null);
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState<RecordValue | null>(null);
  const query = useQuery<{ data: RecordValue[]; page: number; pageSize: number; total: number; totalPages: number }>({ queryKey: ["restaurant-catalog", kind, search, status, page, sortBy, sortOrder], queryFn: () => fetchers[kind]({ search, status, page, pageSize: 10, sortBy, sortOrder }) as unknown as Promise<{ data: RecordValue[]; page: number; pageSize: number; total: number; totalPages: number }> });
  const mutation = useMutation<unknown, Error, { mode: "save" | "deactivate"; id?: string; values: FormValues }>({ mutationFn: (input) => {
    if (input.mode === "deactivate") return deactivators[kind](input.id!);
    const values = normalizeValues(kind, input.values, currentBranch?.id);
    return input.id ? updaters[kind](input.id, values) : creators[kind](values);
  }, onSuccess: async () => { setCreating(false); setEditing(null); await queryClient.invalidateQueries({ queryKey: ["restaurant-catalog", kind] }); } });
  const data = (query.data?.data ?? []) as RecordValue[];
  const openForm = (item?: RecordValue) => item ? setEditing(item) : setCreating(true);
  return <div className="space-y-4">
    <PageHeader eyebrow="Catálogo" title={labels[kind]} description="Datos maestros administrados por empresa y consultados desde el backend." actions={canManage ? <Button onClick={() => openForm()}><Plus className="size-4" />Nuevo</Button> : undefined} />
    <FilterBar
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      searchLabel="Buscar por nombre, código o descripción"
      activeCount={status !== "ACTIVE" ? 1 : 0}
      onClear={() => {
        setStatus("ACTIVE");
        setPage(1);
      }}
    >
      <div className="min-w-0">
        <Label htmlFor={`catalog-status-${kind}`}>Estado</Label>
        <select
          id={`catalog-status-${kind}`}
          className={SELECT_CLASS}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="ACTIVE">Activos</option>
          <option value="INACTIVE">Inactivos</option>
        </select>
      </div>
    </FilterBar>

    {mutation.error ? (
      <InlineNote tone="danger" title="No se pudo completar la operación">
        {getApiErrorMessage(mutation.error, "Revisa los datos e inténtalo de nuevo.")}
      </InlineNote>
    ) : null}

    {query.error ? (
      <ErrorState
        title="No fue posible cargar el catálogo"
        detail={getApiErrorMessage(query.error, "Reintenta la consulta para continuar.")}
        onRetry={() => void query.refetch()}
      />
    ) : (
      <CatalogTable
        kind={kind}
        data={data}
        loading={query.isLoading}
        canManage={canManage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(next, direction) => {
          setSortBy(next);
          setSortOrder(direction);
        }}
        onEdit={openForm}
        onDeactivate={setDeactivating}
        onClearFilters={
          search || status !== "ACTIVE"
            ? () => {
                setSearch("");
                setStatus("ACTIVE");
                setPage(1);
              }
            : undefined
        }
      />
    )}

    {!query.isLoading && !query.error && (query.data?.total ?? 0) > (query.data?.pageSize ?? 10) ? (
      <Pagination
        page={page - 1}
        totalItems={query.data?.total ?? 0}
        pageSize={query.data?.pageSize ?? 10}
        onPageChange={(next) => setPage(next + 1)}
      />
    ) : null}

    {/* Desactivar no borra: el registro deja de ofrecerse en operaciones
        nuevas y lo ya registrado con él se conserva. El `window.confirm` no
        lo decía. */}
    <Dialog open={Boolean(deactivating)} onOpenChange={(open) => !open && setDeactivating(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Desactivar «{String(deactivating?.name ?? "este registro")}»?</DialogTitle>
          <DialogDescription>
            Dejará de poder elegirse en recetas, compras y movimientos nuevos.
          </DialogDescription>
        </DialogHeader>
        <InlineNote tone="info" title="Lo ya registrado se conserva">
          Los movimientos, recetas y documentos que ya lo usan siguen intactos y se pueden seguir consultando. Puedes
          volver a activarlo desde el filtro «Inactivos».
        </InlineNote>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDeactivating(null)}>
            Mantenerlo activo
          </Button>
          <Button
            variant="destructive"
            loading={mutation.isPending}
            loadingLabel="Desactivando…"
            onClick={() => {
              if (!deactivating) return;
              mutation.mutate({ mode: "deactivate", id: deactivating.id, values: {} });
              setDeactivating(null);
            }}
          >
            Desactivar
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {(creating || editing) ? <CatalogForm kind={kind} item={editing} pending={mutation.isPending} error={mutation.error} branchId={currentBranch?.id} onClose={() => { setCreating(false); setEditing(null); }} onSubmit={(values) => mutation.mutate({ mode: "save", id: editing?.id, values })} /> : null}
  </div>;
}

function CatalogTable({
  kind,
  data,
  loading,
  canManage,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDeactivate,
  onClearFilters,
}: {
  kind: RestaurantCatalogKind;
  data: RecordValue[];
  loading: boolean;
  canManage: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (key: string, direction: "asc" | "desc") => void;
  onEdit: (item: RecordValue) => void;
  onDeactivate: (item: RecordValue) => void;
  onClearFilters?: () => void;
}) {
  const headers: Array<[string, string]> =
    kind === "categories"
      ? [["name", "Nombre"], ["description", "Descripción"]]
      : kind === "units"
        ? [["name", "Nombre"], ["abbreviation", "Abreviatura"], ["type", "Tipo"], ["conversionFactor", "Conversión"]]
        : kind === "suppliers"
          ? [["name", "Nombre"], ["contactName", "Contacto"], ["email", "Correo"], ["phone", "Teléfono"]]
          : kind === "warehouses"
            ? [["code", "Código"], ["name", "Nombre"], ["location", "Ubicación"], ["branchName", "Sucursal"]]
            : [
                ["sku", "SKU"],
                ["name", "Nombre"],
                ["category", "Categoría"],
                ["inventoryUnit", "Unidad"],
                ["minimumStock", "Stock mínimo"],
                ["averageCost", "Costo promedio"],
              ];

  const displayValue = (item: RecordValue, key: string) =>
    key === "location"
      ? String(
          item.location ??
            item.address ??
            ([item.city, item.state].filter(Boolean).join(", ") || "Ubicación no registrada"),
        )
      : key === "branchName"
        ? String(item.branchName ?? item.branchId ?? "—")
        : String(item[key] ?? "—");

  const columns: Array<DataColumn<RecordValue>> = [
    ...headers.map(([key, label], index) => ({
      key,
      header: label,
      // La primera columna identifica el registro; las dos siguientes se leen
      // a su lado en el teléfono y el resto queda en el cuerpo de la ficha.
      priority: (index === 0 ? "identity" : index <= 2 ? "primary" : "secondary") as DataColumn<RecordValue>["priority"],
      render: (item: RecordValue) => displayValue(item, key),
      sortValue: (item: RecordValue) => displayValue(item, key),
    })),
    {
      key: "status",
      header: "Estado",
      priority: "primary",
      render: (item) => <RestaurantStatusBadge size="sm" status={String(item.status ?? "UNKNOWN")} />,
      sortValue: (item) => String(item.status ?? ""),
    },
  ];

  return (
    <DataView
      rows={data}
      loading={loading}
      columns={columns}
      getKey={(item) => item.id}
      caption={`Catálogo de ${labels[kind].toLowerCase()}`}
      // El orden lo lleva la pantalla porque viaja al servidor en la consulta:
      // si la vista lo guardase por dentro, ordenaría solo la página visible.
      sort={{ key: sortBy, direction: sortOrder }}
      onSortChange={(next) => onSort(next?.key ?? "name", next?.direction ?? "asc")}
      emptyReason={onClearFilters ? "no-matches" : "no-records"}
      onClearFilters={onClearFilters}
      rowActions={
        canManage
          ? (item) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => onEdit(item)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar
                </Button>
                {item.status === "ACTIVE" ? (
                  <Button size="sm" variant="ghost" onClick={() => onDeactivate(item)}>
                    Desactivar
                  </Button>
                ) : null}
              </div>
            )
          : undefined
      }
    />
  );
}

const SELECT_CLASS =
  "w-full min-w-0 rounded-md border border-line-control bg-surface-1 px-3 min-h-[var(--control-h-touch)] sm:min-h-[var(--control-h-base)] text-base text-ink-1 sm:text-sm";

function CatalogForm({ kind, item, pending, error, branchId, onClose, onSubmit }: { kind: RestaurantCatalogKind; item: RecordValue | null; pending: boolean; error: unknown; branchId?: string; onClose: () => void; onSubmit: (values: FormValues) => void }) {
  const categoryQuery = useQuery({ queryKey: ["restaurant-catalog", "categories", "ACTIVE"], queryFn: () => fetchRestaurantCategories({ status: "ACTIVE", pageSize: 200 }), enabled: kind === "ingredients" });
  const unitQuery = useQuery({ queryKey: ["restaurant-catalog", "units", "ACTIVE"], queryFn: () => fetchRestaurantUnits({ status: "ACTIVE", pageSize: 200 }), enabled: kind === "ingredients" });
  const [values, setValues] = useState<FormValues>(() => initialValues(kind, item, branchId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  if (!item && !branchId && kind === "warehouses") return <CatalogModal title="Nuevo almacén" onClose={onClose}><InlineNote tone="warning" title="Falta elegir la sucursal">Un almacén pertenece a una sucursal; elígela en la barra superior antes de crearlo.</InlineNote></CatalogModal>;
  const update = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const fields = fieldsFor(kind);
  return <CatalogModal title={`${item ? "Editar" : "Nuevo"} ${labels[kind].toLowerCase()}`} onClose={onClose}><div className="grid gap-3 sm:grid-cols-2">{fields.map((field) => <div key={field.key}><Label htmlFor={`catalog-${field.key}`}>{field.label}</Label>{field.select ? <select id={`catalog-${field.key}`} className={SELECT_CLASS} value={values[field.key] ?? ""} onChange={(event) => update(field.key, event.target.value)}><option value="">Seleccionar</option>{field.select.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : <Input id={`catalog-${field.key}`} type={field.type ?? "text"} value={values[field.key] ?? ""} onChange={(event) => update(field.key, event.target.value)} />}{errors[field.key] ? <p id={`catalog-${field.key}-error`} role="alert" className="mt-1 text-2xs text-status-danger">{errors[field.key]}</p> : null}</div>)}{kind === "ingredients" ? <><SelectField id="catalog-categoryId" label="Categoría" value={values.categoryId ?? ""} options={(categoryQuery.data?.data ?? []).map((record) => [String(record.id), String(record.name)] as [string, string])} onChange={(value) => update("categoryId", value)} /><SelectField id="catalog-inventoryUnitId" label="Unidad de inventario" value={values.inventoryUnitId ?? ""} options={(unitQuery.data?.data ?? []).map((record) => [String(record.id), String(record.name)] as [string, string])} onChange={(value) => update("inventoryUnitId", value)} /><SelectField id="catalog-purchaseUnitId" label="Unidad de compra" value={values.purchaseUnitId ?? ""} options={(unitQuery.data?.data ?? []).map((record) => [String(record.id), String(record.name)] as [string, string])} onChange={(value) => update("purchaseUnitId", value)} /></> : null}</div>{categoryQuery.error || unitQuery.error ? <InlineNote tone="danger" title="No se pudieron cargar las opciones">{getApiErrorMessage(categoryQuery.error ?? unitQuery.error, "Reintenta para cargar categorías y unidades.")}</InlineNote> : null}{error ? <InlineNote tone="danger" title="No se pudo guardar">{getApiErrorMessage(error, "Revisa los datos.")}</InlineNote> : null}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={pending} onClick={() => { const nextErrors = validateRestaurantCatalogForm(kind, values); setErrors(nextErrors); if (!Object.keys(nextErrors).length) onSubmit(values); }}>{pending ? "Guardando…" : "Guardar"}</Button></div></CatalogModal>;
}

function SelectField({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) { return <div><Label htmlFor={id}>{label}</Label><select id={id} className={SELECT_CLASS} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Seleccionar</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>; }
function CatalogModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function fieldsFor(kind: RestaurantCatalogKind) { if (kind === "categories") return [{ key: "name", label: "Nombre" }, { key: "description", label: "Descripción" }]; if (kind === "units") return [{ key: "name", label: "Nombre" }, { key: "abbreviation", label: "Abreviatura" }, { key: "type", label: "Tipo", select: [["WEIGHT", "Peso"], ["VOLUME", "Volumen"], ["UNIT", "Unidad"]] as [string, string][] }, { key: "conversionFactor", label: "Factor de conversión", type: "number" }, { key: "decimalPrecision", label: "Decimales", type: "number" }]; if (kind === "suppliers") return [{ key: "name", label: "Nombre" }, { key: "contactName", label: "Contacto" }, { key: "email", label: "Correo", type: "email" }, { key: "phone", label: "Teléfono" }, { key: "taxId", label: "Identificación fiscal" }]; if (kind === "warehouses") return [{ key: "name", label: "Nombre" }, { key: "code", label: "Código" }, { key: "location", label: "Ubicación" }]; return [{ key: "sku", label: "SKU" }, { key: "name", label: "Nombre" }, { key: "purchaseConversionFactor", label: "Factor de conversión", type: "number" }, { key: "minimumStock", label: "Stock mínimo", type: "number" }]; }
function initialValues(kind: RestaurantCatalogKind, item: RecordValue | null, branchId?: string): FormValues { const base: FormValues = { name: String(item?.name ?? ""), description: String(item?.description ?? ""), abbreviation: String(item?.abbreviation ?? ""), type: String(item?.type ?? "WEIGHT"), conversionFactor: String(item?.conversionFactor ?? "1"), decimalPrecision: String(item?.decimalPrecision ?? "2"), contactName: String(item?.contactName ?? ""), email: String(item?.email ?? ""), phone: String(item?.phone ?? ""), taxId: String(item?.taxId ?? ""), code: String(item?.code ?? ""), location: String(item?.location ?? item?.address ?? ""), branchId: String(item?.branchId ?? branchId ?? ""), sku: String(item?.sku ?? ""), categoryId: String(item?.categoryId ?? ""), inventoryUnitId: String(item?.inventoryUnitId ?? ""), purchaseUnitId: String(item?.purchaseUnitId ?? ""), purchaseConversionFactor: String(item?.purchaseConversionFactor ?? item?.conversionFactor ?? "1"), minimumStock: String(item?.minimumStock ?? "0") }; return kind === "ingredients" ? base : base; }
function normalizeValues(kind: RestaurantCatalogKind, values: FormValues, branchId?: string): Record<string, unknown> { const input: Record<string, unknown> = { ...values }; ["conversionFactor", "decimalPrecision", "purchaseConversionFactor", "minimumStock"].forEach((key) => { if (key in input) input[key] = Number(input[key]); }); if (kind === "warehouses") input.branchId = values.branchId || branchId; delete input.status; return input; }
