"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRightLeft, ClipboardList, PackagePlus, Trash2, Truck } from "lucide-react";

import { useUiText } from "@/components/ui-copy";
import { useAppStore } from "@/store/app-store";
import { useRestaurantInventoryContext } from "@/components/restaurant-inventory-context";
import type { PermissionKey } from "@/lib/contracts";

/* ==========================================================================
   QUÉ PUEDO HACER AQUÍ
   ==========================================================================
   Las cinco operaciones del módulo existían solo dentro del panel de la
   primera pantalla. Quien entraba por «Existencias» —que es la entrada
   natural desde la barra lateral y desde cualquier enlace de alerta— veía
   una tabla cuya única acción era «Exportar CSV»: ni recibir mercancía, ni
   registrar una merma, ni contar. La respuesta a «no sé qué puedo hacer» no
   era que faltaran funciones, era que vivían en otra pantalla.

   Ahora la barra viaja con el módulo entero y se pinta encima del contenido,
   en todas sus pantallas. Se filtra por permiso con `canAny`, igual que
   antes: quien no puede registrar mermas no ve el botón de mermas.
   ========================================================================== */

export type OperacionDelModulo = {
  key: string;
  /** Se traduce al pintarla: la lista es una constante de módulo y no alcanza
   *  al traductor. */
  label: string;
  /** Verbo corto para la barra, donde no cabe la frase entera. */
  short: string;
  detail: string;
  href: string;
  icon: ReactNode;
  permissions: PermissionKey[];
};

export const OPERACIONES_DEL_MODULO: OperacionDelModulo[] = [
  {
    key: "receipts",
    label: "Recibir productos",
    short: "Recibir",
    detail: "Registra una entrada de mercancía.",
    href: "/inventory/restaurant/receipts",
    icon: <Truck className="size-5" aria-hidden="true" />,
    permissions: ["restaurant_inventory.manage", "restaurant_inventory.receipts.create"],
  },
  {
    key: "consumption",
    label: "Registrar salida",
    short: "Salida",
    detail: "Descuenta consumo o producción.",
    href: "/inventory/restaurant/consumption",
    icon: <PackagePlus className="size-5" aria-hidden="true" />,
    permissions: ["restaurant_inventory.manage", "restaurant_inventory.operations.create"],
  },
  {
    key: "waste",
    label: "Registrar merma",
    short: "Merma",
    detail: "Producto perdido o dañado.",
    href: "/inventory/restaurant/waste",
    icon: <Trash2 className="size-5" aria-hidden="true" />,
    permissions: ["restaurant_inventory.manage", "restaurant_inventory.operations.create"],
  },
  {
    key: "stock-counts",
    label: "Realizar conteo",
    short: "Contar",
    detail: "Compara existencia física y teórica.",
    href: "/inventory/restaurant/stock-counts",
    icon: <ClipboardList className="size-5" aria-hidden="true" />,
    permissions: ["restaurant_inventory.manage", "restaurant_inventory.counts.approve"],
  },
  {
    key: "transfers",
    label: "Transferir productos",
    short: "Transferir",
    detail: "Mueve existencias entre almacenes.",
    href: "/inventory/restaurant/transfers",
    icon: <ArrowRightLeft className="size-5" aria-hidden="true" />,
    permissions: ["restaurant_inventory.manage", "restaurant_inventory.transfers.manage"],
  },
];

/** Las operaciones que este usuario puede ejecutar, en orden de frecuencia. */
export function useOperacionesPermitidas() {
  const { canAny } = useAppStore();
  return OPERACIONES_DEL_MODULO.filter((operacion) => canAny(operacion.permissions));
}

/**
 * Barra de operaciones del módulo.
 *
 * Una fila que se desliza sola en el teléfono en vez de apilarse en cinco
 * líneas y empujar el contenido fuera de la primera pantalla. El botón de la
 * pantalla en la que ya estás se marca con `aria-current` y no se oculta:
 * desaparecer el sitio donde estás obliga a recontar los botones en cada
 * navegación.
 *
 * Altura: `--control-h-touch` siempre, y 3.5 rem en modo cocina. Nunca por
 * debajo de 44 px, que es el mínimo que se puede acertar de pie, con guantes
 * y el teléfono en una mano.
 */
export function RestaurantActionBar() {
  const uiText = useUiText();
  const pathname = usePathname();
  const { compactMode } = useRestaurantInventoryContext();
  const operaciones = useOperacionesPermitidas();

  if (!operaciones.length) return null;

  return (
    <nav aria-label={uiText("Operaciones del inventario")} className="min-w-0">
      <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.16em] text-ink-3">
        {uiText("Qué puedes hacer aquí")}
      </p>
      <ul className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {operaciones.map((operacion) => {
          const aqui = pathname.startsWith(operacion.href);
          return (
            <li key={operacion.key} className="shrink-0">
              <Link
                href={operacion.href}
                aria-current={aqui ? "page" : undefined}
                title={uiText(operacion.detail)}
                className={`flex items-center gap-2 rounded-xl border px-4 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                  compactMode ? "min-h-14" : "min-h-[var(--control-h-touch)]"
                } ${
                  aqui
                    ? "border-action bg-surface-2 text-ink-1 shadow-e1"
                    : "border-line bg-surface-1 text-ink-1 hover:border-line-strong hover:bg-surface-2"
                }`}
              >
                <span className="text-ink-2" aria-hidden="true">{operacion.icon}</span>
                <span className="whitespace-nowrap">{uiText(operacion.short)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
