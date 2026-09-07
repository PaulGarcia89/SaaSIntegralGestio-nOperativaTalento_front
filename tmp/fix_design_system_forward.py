"""
`components/design-system` pasa a apoyarse en el sistema, como ya hicieron
`components/ui` y `components/domain`.

Es el cambio de mayor alcance que queda: 60 archivos importan de aquí —51 usan
`InlineFeedback` y 34 usan `PageHeader`—, así que reescribir tres funciones
alinea sesenta pantallas con Administración sin tocar ninguna de ellas.

Hasta ahora había dos encabezados de página distintos conviviendo: el del
sistema (usado en administración) y este, con otra escala tipográfica
(`text-4xl` en escritorio frente a `text-3xl`), el epígrafe en color de marca
en vez de en tinta terciaria, y un borde inferior que el otro no tiene. Dos
pantallas contiguas del mismo producto no se parecían.

Las firmas públicas no cambian: quien llama sigue pasando exactamente las
mismas props, incluidas las que el sistema ya no necesita.
"""

P = "src/components/design-system.tsx"

PAIRS = [
    (
        '''export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return <header className="flex min-w-0 flex-col gap-4 border-b border-border-default pb-5 sm:gap-5 sm:pb-6 lg:flex-row lg:items-end lg:justify-between"><div className="min-w-0 space-y-2">{eyebrow ? <p className="text-sm font-medium text-brand">{eyebrow}</p> : null}<h1 className="text-2xl font-semibold leading-tight text-text-primary sm:text-3xl md:text-4xl">{title}</h1>{description ? <div className="max-w-3xl leading-6 text-text-secondary sm:leading-7">{description}</div> : null}</div>{actions ? <ActionBar>{actions}</ActionBar> : null}</header>;
}''',
        '''/**
 * Encabezado de página.
 *
 * Ya no dibuja nada propio: reenvía al del sistema. Antes existían dos
 * encabezados distintos en el mismo producto —este con `text-4xl`, epígrafe
 * en color de marca y borde inferior; el del sistema sin nada de eso—, así
 * que dos pantallas contiguas no se parecían. La firma se conserva para no
 * tocar las treinta y cuatro pantallas que lo usan.
 */
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return <SystemPageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />;
}''',
    ),
    (
        '''export function InlineFeedback({ tone, title, children, action, loading = false }: { tone: "info" | "success" | "warning" | "danger"; title: string; children?: ReactNode; action?: ReactNode; loading?: boolean }) {
  const Icon = loading ? LoaderCircle : tone === "success" ? CheckCircle2 : tone === "warning" ? TriangleAlert : tone === "danger" ? AlertCircle : Info;
  return <div role={tone === "danger" ? "alert" : "status"} className={cn("flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start", tone === "info" && "border-status-info/30 bg-status-info/5", tone === "success" && "border-status-success/30 bg-status-success/5", tone === "warning" && "border-status-warning/30 bg-status-warning/5", tone === "danger" && "border-status-danger/30 bg-status-danger/5")}><Icon className={cn("size-5 shrink-0", loading && "animate-spin")} /><div className="min-w-0 flex-1"><p className="font-semibold">{title}</p>{children ? <div className="mt-1 text-sm text-text-secondary">{children}</div> : null}</div>{action}</div>;
}''',
        '''/**
 * Aviso en línea. Reenvía a `InlineNote` del sistema.
 *
 * Los cuatro tonos coinciden uno a uno. `loading` se conserva en la firma
 * porque forma parte del contrato público, pero ninguna pantalla lo pasa hoy;
 * cuando llegue en `true` el aviso se muestra en tono neutro, que es lo
 * correcto para algo que todavía no ha terminado de resolverse.
 */
export function InlineFeedback({ tone, title, children, action, loading = false }: { tone: "info" | "success" | "warning" | "danger"; title: string; children?: ReactNode; action?: ReactNode; loading?: boolean }) {
  return <InlineNote tone={loading ? "neutral" : tone} title={title} action={action}>{children}</InlineNote>;
}''',
    ),
    (
        '''export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: { page: number; totalPages: number; totalItems: number; pageSize: number; onPageChange: (page: number) => void }) {
  const start = totalItems ? page * pageSize + 1 : 0; const end = Math.min((page + 1) * pageSize, totalItems);
  return <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-text-secondary">{start}–{end} de {totalItems}</p><div className="flex items-center gap-2"><Button size="icon" variant="secondary" disabled={page <= 0} onClick={() => onPageChange(page - 1)} aria-label="Página anterior"><ChevronLeft /></Button><label className="flex items-center gap-2 text-sm">Página<Input type="number" min={1} max={Math.max(1, totalPages)} value={page + 1} onChange={(event) => onPageChange(Math.max(0, Math.min(totalPages - 1, Number(event.target.value) - 1)))} className="w-16" />de {totalPages}</label><Button size="icon" variant="secondary" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)} aria-label="Página siguiente"><ChevronRight /></Button></div></nav>;
}''',
        '''/**
 * Paginación. Reenvía a la del sistema, que deriva el número de páginas del
 * total en vez de recibirlo: pasarlo por separado permitía que el «de N» y
 * los botones discreparan si quien llamaba calculaba mal uno de los dos.
 *
 * `totalPages` se sigue aceptando porque cinco pantallas lo pasan; se ignora
 * a propósito.
 */
export function Pagination({ page, totalPages: _totalPages, totalItems, pageSize, onPageChange }: { page: number; totalPages: number; totalItems: number; pageSize: number; onPageChange: (page: number) => void }) {
  return <SystemPagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange} />;
}''',
    ),
    (
        '''import { cn } from "@/lib/utils";''',
        '''import { cn } from "@/lib/utils";
import {
  InlineNote,
  PageHeader as SystemPageHeader,
  Pagination as SystemPagination,
} from "@/components/system";''',
    ),
]


def main():
    src = open(P, encoding="utf-8").read()
    original = src
    for old, new in PAIRS:
        count = src.count(old)
        assert count == 1, f"{count} apariciones de:\n{old[:160]}"
        src = src.replace(old, new)
    assert src != original
    open(P, "w", encoding="utf-8").write(src)
    print("ok", P, len(PAIRS), "cambios")


main()
