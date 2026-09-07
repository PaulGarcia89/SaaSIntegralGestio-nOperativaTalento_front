import localFont from "next/font/local";

/**
 * Tipografía del producto.
 *
 * Geist y Geist Mono, variables, autoalojadas bajo SIL Open Font License 1.1
 * (`public/fonts/OFL.txt`). Se sirven desde el propio dominio a propósito: sin
 * petición a un tercero no hay salto de maqueta al llegar la fuente, no se
 * filtra la IP del usuario a otro servicio y el build no depende de la red.
 *
 * Reparto de papeles
 * ------------------
 * - `geistSans` es a la vez display y cuerpo. La diferencia entre titular y
 *   párrafo la marcan el peso, el tamaño y el interletraje, no dos familias
 *   distintas: en una interfaz operativa, dos familias compiten.
 * - `geistMono` es para CIFRAS y códigos —identificadores, importes, ejes de
 *   gráfico, columnas numéricas—, que es donde el ancho fijo evita que un
 *   número salte al cambiar de 199 a 200.
 *
 * Peso y estrategia de carga
 * --------------------------
 * - Geist Sans: 69,7 KB, `preload: true`. Es la fuente del primer texto que se
 *   pinta, así que precargarla evita el parpadeo.
 * - Geist Mono: 71,6 KB, `preload: false`. No aparece por encima del pliegue
 *   más que en cifras sueltas, y precargar 141 KB para eso penaliza la primera
 *   carga sin ganar nada.
 * - `display: "swap"` en ambas: preferimos texto legible de inmediato con la
 *   tipografía de reserva a un bloqueo de render.
 * - `adjustFontFallback: false` porque las métricas de reserva ya se declaran a
 *   mano en `fallback`; dejar que Next genere las suyas encima produce un
 *   segundo ajuste y con él un salto visible.
 */

/*
 * Las listas de reserva van ESCRITAS AQUÍ y no en una constante compartida:
 * `next/font` las lee en tiempo de compilación con un analizador estático y
 * rechaza cualquier valor que no sea un literal («Font loader values must be
 * explicitly written literals»). Extraerlas a una constante rompe el build.
 */

export const geistSans = localFont({
  src: [
    {
      path: "../../public/fonts/Geist-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
  preload: true,
  fallback: [
    "ui-sans-serif",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  adjustFontFallback: false,
});

export const geistMono = localFont({
  src: [
    {
      path: "../../public/fonts/GeistMono-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Consolas",
    "Liberation Mono",
    "monospace",
  ],
  adjustFontFallback: false,
});

/** Clases que exponen ambas familias como variables CSS en `<html>`. */
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
