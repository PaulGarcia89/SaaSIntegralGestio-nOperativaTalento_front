const FALLBACK = "#0EA5B7";

/**
 * Fondos contra los que se valida el color de marca cuando se usa como TEXTO.
 * Deben coincidir con `--background` y `--sidebar` de `globals.css`.
 */
const SURFACE_LIGHT = { h: 210, s: 40, l: 98 };
const SURFACE_DARK = { h: 222, s: 47, l: 7 };
const SURFACE_SIDEBAR = { h: 220, s: 29, l: 12 };

/** Umbral WCAG 2.2 AA para texto normal. */
const AA_NORMAL_TEXT = 4.5;

/**
 * Opacidad del tinte de marca en distintivos y chips (`bg-primary/10`).
 *
 * Es la superficie MÁS exigente sobre la que aparece la marca como texto, así
 * que es contra ella —y no contra el fondo puro— contra la que se valida. Un
 * umbral fijo más alto también servía, pero no se adapta al tono: este cálculo
 * sí, porque mezcla el color real de cada tenant.
 */
const BRAND_TINT_ALPHA = 0.1;

type Hsl = { h: number; s: number; l: number };

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  };
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }): Hsl {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  if (hue < 0) hue += 360;
  const lightness = (max + min) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  return { h: hue, s: saturation * 100, l: lightness * 100 };
}

function hslToRgb({ h, s, l }: Hsl) {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = light - c / 2;
  const [r, g, b] =
    hp < 1 ? [c, x, 0]
    : hp < 2 ? [x, c, 0]
    : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c]
    : hp < 5 ? [x, 0, c]
    : [c, 0, x];
  return { r: r + m, g: g + m, b: b + m };
}

/** Luminancia relativa según WCAG 2.x (canales linealizados). */
function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const channel = (value: number) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: Hsl, b: Hsl) {
  const la = relativeLuminance(hslToRgb(a));
  const lb = relativeLuminance(hslToRgb(b));
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Ajusta la luminosidad del color de marca hasta alcanzar el contraste exigido
 * contra `surface`, conservando tono y saturación.
 *
 * Sobre un fondo claro oscurece; sobre uno oscuro aclara. Si ni el extremo
 * (0 % o 100 %) alcanza el umbral —imposible con tonos reales, pero conviene
 * ser explícito— devuelve el extremo más contrastado que encontró.
 */
function ensureReadable(brand: Hsl, surfaces: Hsl | Hsl[], target = AA_NORMAL_TEXT): Hsl {
  const list = Array.isArray(surfaces) ? surfaces : [surfaces];
  const worst = list.reduce((acc, s) => (contrastRatio(brand, s) < contrastRatio(brand, acc) ? s : acc), list[0]);
  const surfaceIsLight = relativeLuminance(hslToRgb(worst)) > 0.18;
  const step = surfaceIsLight ? -1 : 1;
  const meetsAll = (candidate: Hsl) => list.every((s) => contrastRatio(candidate, s) >= target);

  // Se itera sobre luminosidades ENTERAS porque el valor se emite redondeado a
  // CSS. Validando el valor fraccionario, el redondeo posterior podía devolver
  // el color por debajo del umbral: con `#DB2777` daba 4,45:1 tras redondear.
  let candidate: Hsl = { ...brand, l: Math.round(brand.l) };
  if (meetsAll(candidate)) return candidate;

  for (let lightness = candidate.l + step; lightness >= 0 && lightness <= 100; lightness += step) {
    candidate = { ...brand, l: lightness };
    if (meetsAll(candidate)) return candidate;
  }
  return candidate;
}

const WHITE: Hsl = { h: 0, s: 0, l: 100 };
const NEAR_BLACK: Hsl = { h: 222, s: 47, l: 11 };

/** Mezcla `top` sobre `bottom` con la opacidad indicada, en sRGB. */
function blend(top: Hsl, bottom: Hsl, alpha: number): Hsl {
  const t = hslToRgb(top);
  const b = hslToRgb(bottom);
  return rgbToHsl({
    r: t.r * alpha + b.r * (1 - alpha),
    g: t.g * alpha + b.g * (1 - alpha),
    b: t.b * alpha + b.b * (1 - alpha),
  });
}

/**
 * Elige la luminosidad del relleno de marca.
 *
 * Parte de la franja 38-48 %, que es donde una marca cromática luce como marca.
 * Si en esa franja ningún texto —blanco ni casi negro— alcanza AA, oscurece
 * hasta que el blanco lo consiga. Solo hace falta con marcas acromáticas o muy
 * claras: un gris al 48 % se queda en 4,27:1 contra ambos extremos.
 */
function readableFill({ h, s, l }: Hsl): Hsl {
  const start = Math.round(Math.max(38, Math.min(48, l)));
  for (let lightness = start; lightness >= 0; lightness -= 1) {
    const candidate: Hsl = { h, s, l: lightness };
    const best = Math.max(contrastRatio(candidate, WHITE), contrastRatio(candidate, NEAR_BLACK));
    if (best >= AA_NORMAL_TEXT) return candidate;
  }
  return { h, s, l: 0 };
}

const round = ({ h, s, l }: Hsl): Hsl => ({ h: Math.round(h), s: Math.round(s), l: Math.round(l) });
const format = ({ h, s, l }: Hsl) => `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;

export type TenantTheme = ReturnType<typeof createTenantTheme>;

/**
 * Deriva la paleta de marca de un tenant a partir de su color de acento.
 *
 * El punto clave es que **el color de relleno y el color de texto son
 * distintos**. Antes se usaba uno solo: `--primary` servía a la vez como fondo
 * de botón y como color de texto de etiquetas y encabezados. Funcionaba para el
 * relleno (con texto blanco encima) pero fallaba como texto: con el acento
 * `#2563EB` daba 2,82:1 sobre la barra lateral y 3,14:1 sobre el fondo oscuro,
 * ambos por debajo de AA. La auditoría axe lo detectó en las 21 pantallas.
 *
 * - `primary` / `foreground`: relleno de marca y su texto. Sin cambios.
 * - `text*`: el mismo tono ajustado hasta cumplir 4,5:1 contra cada superficie.
 */
export function createTenantTheme(input?: string) {
  const hex = /^#[0-9a-f]{6}$/i.test(input ?? "") ? input! : FALLBACK;
  const rgb = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(rgb);

  // El relleno se mantiene en una franja media para que el texto blanco encima
  // conserve contraste con cualquier marca.
  // Se redondea el tono y la saturación desde el principio, no al formatear:
  // así lo que se valida es exactamente el color que acaba en el CSS. Con
  // valores fraccionarios, el redondeo posterior dejaba el contraste por debajo
  // del umbral (`#0EA5B7` caía a 4,47:1 sobre un distintivo teñido).
  const brand: Hsl = round({ h, s, l });
  const fill = round(readableFill(brand));

  // El texto del relleno se decide contra el RELLENO, no contra el hex original.
  // Antes se comparaba la luminancia del hex sin recortar, así que una marca
  // muy clara elegía texto oscuro sobre un relleno gris y daba 4,19:1.
  const accentSurface: Hsl = { h: brand.h, s: Math.max(35, brand.s), l: 93 };
  const onWhite = contrastRatio(fill, WHITE);
  const onNearBlack = contrastRatio(fill, NEAR_BLACK);

  return {
    hex,
    primary: format(fill),
    foreground: onNearBlack > onWhite ? "222 47% 11%" : "0 0% 100%",
    accent: `${Math.round(h)} ${Math.max(35, Math.round(s))}% 93%`,
    /** Marca legible como texto sobre el fondo claro. */
    textOnLight: format(
      ensureReadable(brand, [
        SURFACE_LIGHT,
        blend(fill, SURFACE_LIGHT, BRAND_TINT_ALPHA),
        // `--accent`: la marca al 93 % de luminosidad. Es la superficie más
        // clara y teñida donde aparece texto de marca (distintivos), y la que
        // hacía fallar `/notifications` con 4,28:1.
        accentSurface,
      ]),
    ),
    /** Marca legible como texto sobre el fondo oscuro, tinte de chip incluido. */
    textOnDark: format(ensureReadable(brand, blend(fill, SURFACE_DARK, BRAND_TINT_ALPHA))),
    /** Marca legible como texto sobre la barra lateral, que siempre es oscura. */
    textOnSidebar: format(ensureReadable(brand, SURFACE_SIDEBAR)),
  };
}

/** Expuesto para las pruebas: comprueba el contraste de dos colores HSL. */
export const __testing = { contrastRatio, ensureReadable, rgbToHsl, hexToRgb };
