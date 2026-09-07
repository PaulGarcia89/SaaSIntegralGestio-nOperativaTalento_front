"use client";

import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Puente responsive para las tablas escritas como filas `<tr>` crudas.
 *
 * Por qué existe
 * --------------
 * Cinco pantallas de restaurante declaraban su tabla con un ayudante local
 * idéntico —`Table({ headers, children })`— que pintaba
 * `<table className="w-full min-w-[NNNpx]">` dentro de un `overflow-x-auto`.
 * En un teléfono eso obliga a arrastrar de lado una tabla de ocho o nueve
 * columnas; en varias de ellas el producto llegaba a IMPRIMIR la instrucción
 * de deslizar.
 *
 * El destino de todas es `DataView`, que compone la ficha móvil a partir de
 * una declaración de columnas con su jerarquía. Pero pasar a `DataView` exige
 * reescribir cada fila —hoy son `<tr>` con JSX arbitrario dentro de cada
 * `<td>`— y eso son cinco reescrituras con riesgo de perder detalles de cada
 * pantalla. Este componente cubre el tramo intermedio: acepta EXACTAMENTE la
 * misma API que el ayudante que sustituye, y en el teléfono descompone cada
 * fila en una ficha legible en vez de mandarla a un carrusel horizontal.
 *
 * No es el sitio donde deben quedarse: cuando cada pantalla tenga sus
 * columnas declaradas, este archivo desaparece. Está aquí, y no en
 * `components/system`, precisamente para que no se convierta en la salida
 * fácil del resto del producto.
 *
 * Cómo funciona
 * -------------
 * Lee los `<td>` de cada `<tr>` y los empareja por posición con `headers`. La
 * primera celda es el título de la ficha; el resto se leen como pares
 * etiqueta/valor. Si la fila trae `onClick`, la ficha ofrece un botón en vez
 * de hacer clicable un contenedor con contenido interactivo dentro.
 */
export function RowTable({
  caption,
  headers,
  children,
  rowActionLabel = "Ver detalle",
}: {
  /** Título accesible: obligatorio cuando hay más de una tabla en pantalla. */
  caption: string;
  headers: string[];
  children: ReactNode;
  rowActionLabel?: string;
}) {
  const rows = Children.toArray(children).filter(isValidElement) as Array<
    ReactElement<{ children?: ReactNode; onClick?: () => void }>
  >;

  return (
    <div className="min-w-0">
      {/* ── Escritorio ─────────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-xl border border-line bg-surface-1 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface-2 text-ink-2">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-4 py-3 text-2xs font-semibold uppercase tracking-[0.08em]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">{children}</tbody>
        </table>
      </div>

      {/* ── Teléfono ───────────────────────────────────────────────── */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row, rowIndex) => {
          const cells = Children.toArray(row.props.children).filter(isValidElement) as Array<
            ReactElement<{ children?: ReactNode }>
          >;
          const [first, ...rest] = cells;
          const onClick = row.props.onClick;

          return (
            <li key={row.key ?? rowIndex} className="rounded-lg border border-line bg-surface-1 p-4">
              {first ? <p className="font-medium text-ink-1">{first.props.children}</p> : null}

              <dl className="mt-3 space-y-2">
                {rest.map((cell, index) => {
                  const label = headers[index + 1];
                  if (!label) return null;
                  return (
                    <div
                      key={`${rowIndex}-${label}`}
                      className="grid grid-cols-[minmax(5.5rem,0.45fr)_minmax(0,1fr)] items-start gap-3"
                    >
                      <dt className="text-2xs text-ink-3">{label}</dt>
                      <dd className="min-w-0 break-words text-sm text-ink-1">{cell.props.children}</dd>
                    </div>
                  );
                })}
              </dl>

              {onClick ? (
                <Button variant="secondary" className="mt-3 w-full" onClick={onClick}>
                  {rowActionLabel}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
