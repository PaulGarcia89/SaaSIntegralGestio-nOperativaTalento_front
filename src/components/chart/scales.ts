/**
 * Motor de escalas, geometría y formato de los gráficos.
 *
 * Este archivo es matemática pura: no importa React ni toca el DOM. Es la única
 * parte del motor de gráficos que se puede probar de verdad, así que aquí vive
 * todo lo que decide DÓNDE cae un valor y CÓMO se lee, y los componentes se
 * limitan a pintar el resultado.
 *
 * Convenciones:
 *  - «dominio» son valores del negocio; «rango» son píxeles del viewBox.
 *  - Ninguna función lanza: ante datos imposibles (NaN, series vacías, un solo
 *    valor) devuelven un resultado vacío o neutro. Un gráfico nunca debe tumbar
 *    la pantalla que lo contiene.
 */

/** Punto de una serie. `x` e `y` son números; `label` es la etiqueta legible. */
export type ChartPoint = {
  readonly x: number;
  readonly y: number;
  readonly label?: string;
};

/** Par [inicio, fin]. Se usa tanto para dominios como para rangos de píxeles. */
export type NumericRange = readonly [number, number];

/** Pasos "redondos" admitidos para las marcas de eje: 1, 2, 2.5, 5 y 10 × 10^n. */
const PASOS_REDONDOS = [1, 2, 2.5, 5, 10] as const;

/** Tolerancia para comparar flotantes cuando se generan marcas de eje. */
const EPSILON = 1e-9;

function pasoRedondo(bruto: number): number {
  if (!Number.isFinite(bruto) || bruto <= 0) return 1;
  const exponente = Math.floor(Math.log10(bruto));
  const magnitud = Math.pow(10, exponente);
  const fraccion = bruto / magnitud;
  const elegido = PASOS_REDONDOS.find((candidato) => fraccion <= candidato + EPSILON) ?? 10;
  return elegido * magnitud;
}

/** Recorta el ruido de coma flotante que arrastra multiplicar el paso. */
function redondearAlPaso(valor: number, paso: number): number {
  const decimales = Math.max(0, Math.min(12, Math.ceil(-Math.log10(paso)) + 1));
  return Number(valor.toFixed(decimales));
}

const dosDecimales = (valor: number): number => Number(valor.toFixed(2));

/**
 * Marcas de eje "redondas" dentro de [min, max].
 *
 * Reglas:
 *  - El paso siempre es 1, 2, 2.5, 5 o 10 por una potencia de diez, de modo que
 *    las etiquetas se leen de un vistazo (0, 25, 50, 75, 100) y no en cifras
 *    arbitrarias (0, 23, 46, 69).
 *  - Si el rango cruza el cero, el cero SIEMPRE es una marca: es la referencia
 *    que separa lo positivo de lo negativo y sin ella el gráfico engaña.
 *  - Un dominio de un solo valor se abre hasta el cero, porque un eje sin
 *    recorrido no informa de nada.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];

  const objetivo = Math.max(2, Math.min(12, Math.floor(count) || 2));
  const bajo = Math.min(min, max);
  const alto = Math.max(min, max);

  if (bajo === alto) {
    // Serie plana. Con todo a cero mostramos 0-1; si no, abrimos hacia el cero.
    if (bajo === 0) return [0, 1];
    return bajo > 0 ? niceTicks(0, alto, objetivo) : niceTicks(bajo, 0, objetivo);
  }

  const paso = pasoRedondo((alto - bajo) / objetivo);
  const inicio = Math.ceil(bajo / paso - EPSILON) * paso;
  const marcas: number[] = [];
  for (let i = 0; inicio + i * paso <= alto + paso * EPSILON; i += 1) {
    marcas.push(redondearAlPaso(inicio + i * paso, paso));
  }

  // Red de seguridad: si el redondeo dejó fuera el cero de un rango que lo
  // cruza, se añade a mano y se reordena.
  if (bajo < 0 && alto > 0 && !marcas.includes(0)) {
    marcas.push(0);
    marcas.sort((a, b) => a - b);
  }

  if (marcas.length < 2) return [redondearAlPaso(bajo, paso), redondearAlPaso(alto, paso)];
  return marcas;
}

/** Escala lineal invocable: `escala(valor)` devuelve el píxel. */
export type LinearScale = ((value: number) => number) & {
  readonly domain: NumericRange;
  readonly range: NumericRange;
  /** Marcas redondas del dominio. */
  ticks: (count?: number) => number[];
  /** Píxel a valor del dominio. Necesario para el cursor del ratón. */
  invert: (pixel: number) => number;
};

export function linearScale({ domain, range }: { domain: NumericRange; range: NumericRange }): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const utilizable = [d0, d1, r0, r1].every((valor) => Number.isFinite(valor));
  const recorridoDominio = d1 - d0;
  const recorridoRango = r1 - r0;
  const centroRango = (r0 + r1) / 2;

  const escala = (value: number): number => {
    if (!utilizable || !Number.isFinite(value)) return Number.NaN;
    // Dominio de un solo valor: todo cae en el centro del rango. Dividir por
    // cero daría Infinity y sacaría el trazo del lienzo.
    if (recorridoDominio === 0) return centroRango;
    return r0 + ((value - d0) / recorridoDominio) * recorridoRango;
  };

  return Object.assign(escala, {
    domain,
    range,
    ticks: (count = 5): number[] => niceTicks(d0, d1, count),
    invert: (pixel: number): number => {
      if (!utilizable || !Number.isFinite(pixel)) return Number.NaN;
      if (recorridoRango === 0) return d0;
      return d0 + ((pixel - r0) / recorridoRango) * recorridoDominio;
    },
  });
}

/** Escala de bandas para barras: categoría → píxel de inicio de su banda. */
export type BandScale = ((category: string) => number) & {
  readonly domain: readonly string[];
  readonly range: NumericRange;
  /** Ancho de la barra, ya descontado el hueco. */
  bandwidth: () => number;
  /** Distancia entre inicios de banda consecutivos. */
  step: () => number;
  /** Centro de la banda: donde va la etiqueta del eje. */
  center: (category: string) => number;
};

export function bandScale({
  domain,
  range,
  padding = 0.2,
}: {
  domain: readonly string[];
  range: NumericRange;
  padding?: number;
}): BandScale {
  const [r0, r1] = range;
  const utilizable = Number.isFinite(r0) && Number.isFinite(r1) && domain.length > 0;
  const hueco = Number.isFinite(padding) ? Math.max(0, Math.min(0.9, padding)) : 0;
  const paso = utilizable ? (r1 - r0) / domain.length : 0;
  const ancho = paso * (1 - hueco);

  const escala = (category: string): number => {
    const indice = domain.indexOf(category);
    if (!utilizable || indice < 0) return Number.NaN;
    return r0 + indice * paso + (paso * hueco) / 2;
  };

  return Object.assign(escala, {
    domain,
    range,
    bandwidth: (): number => (utilizable ? Math.abs(ancho) : 0),
    step: (): number => (utilizable ? paso : 0),
    center: (category: string): number => {
      const inicio = escala(category);
      return Number.isFinite(inicio) ? inicio + ancho / 2 : Number.NaN;
    },
  });
}

/** Agrupa los puntos en tramos contiguos con coordenadas válidas. */
function tramosValidos(points: readonly ChartPoint[]): ChartPoint[][] {
  const tramos: ChartPoint[][] = [];
  let actual: ChartPoint[] = [];
  for (const punto of points) {
    if (Number.isFinite(punto.x) && Number.isFinite(punto.y)) {
      actual.push(punto);
    } else if (actual.length > 0) {
      tramos.push(actual);
      actual = [];
    }
  }
  if (actual.length > 0) tramos.push(actual);
  return tramos;
}

/**
 * Cadena `d` de una línea, en coordenadas ya convertidas a píxeles.
 *
 * DECISIÓN: línea recta, sin curvas de Bézier. Una curva suave dibuja entre dos
 * mediciones valores que nunca se midieron —y en datos operativos (stock, horas,
 * incidencias) eso es inventar—; además produce sobreimpulsos que sugieren
 * máximos inexistentes. El segmento recto dice exactamente lo que se sabe: dos
 * medidas y la interpolación más honesta entre ellas.
 *
 * Un hueco (valor no finito) parte el trazo en dos subrutas en vez de unir por
 * encima del vacío, para que «no hay dato» no se lea como «hay una recta».
 */
export function buildLinePath(points: readonly ChartPoint[]): string {
  const partes: string[] = [];
  for (const tramo of tramosValidos(points)) {
    partes.push(
      tramo
        .map((punto, indice) => `${indice === 0 ? "M" : "L"}${dosDecimales(punto.x)},${dosDecimales(punto.y)}`)
        .join(" "),
    );
  }
  return partes.join(" ");
}

/** Cadena `d` del área bajo la línea, cerrada contra `baselineY`. */
export function buildAreaPath(points: readonly ChartPoint[], baselineY: number): string {
  if (!Number.isFinite(baselineY)) return "";
  const base = dosDecimales(baselineY);
  const partes: string[] = [];
  for (const tramo of tramosValidos(points)) {
    const primero = tramo[0];
    const ultimo = tramo[tramo.length - 1];
    const cuerpo = tramo
      .map((punto) => `L${dosDecimales(punto.x)},${dosDecimales(punto.y)}`)
      .join(" ");
    partes.push(`M${dosDecimales(primero.x)},${base} ${cuerpo} L${dosDecimales(ultimo.x)},${base} Z`);
  }
  return partes.join(" ");
}

const coordenadaX = (punto: ChartPoint): number => (Number.isFinite(punto.x) ? punto.x : 0);
const coordenadaY = (punto: ChartPoint): number => (Number.isFinite(punto.y) ? punto.y : 0);

/**
 * Reduce una serie a `maxPoints` conservando su forma (LTTB, «largest triangle
 * three buckets»).
 *
 * Hace falta porque mil `<circle>` y un `path` de mil vértices bloquean el hilo
 * principal al redibujar. LTTB elige de cada tramo el punto que forma el
 * triángulo mayor con el anterior elegido y la media del tramo siguiente, así
 * que los picos y los valles —lo que de verdad se mira en un gráfico
 * operativo— sobreviven al muestreo. Primer y último punto se conservan
 * siempre.
 */
export function downsample(points: readonly ChartPoint[], maxPoints: number): ChartPoint[] {
  const total = points.length;
  if (total === 0) return [];
  if (!Number.isFinite(maxPoints) || maxPoints <= 0) return [];

  const limite = Math.floor(maxPoints);
  if (total <= limite) return [...points];
  if (limite === 1) return [points[0]];
  if (limite === 2) return [points[0], points[total - 1]];

  const muestreados: ChartPoint[] = [points[0]];
  const tamanoTramo = (total - 2) / (limite - 2);
  let anterior = 0;

  for (let i = 0; i < limite - 2; i += 1) {
    const inicioTramo = Math.floor(i * tamanoTramo) + 1;
    const finTramo = Math.min(Math.floor((i + 1) * tamanoTramo) + 1, total - 1);
    const inicioSiguiente = finTramo;
    const finSiguiente = Math.min(Math.floor((i + 2) * tamanoTramo) + 1, total);

    if (finTramo <= inicioTramo) {
      const indice = Math.min(inicioTramo, total - 2);
      muestreados.push(points[indice]);
      anterior = indice;
      continue;
    }

    let mediaX = 0;
    let mediaY = 0;
    let cuenta = 0;
    for (let j = inicioSiguiente; j < finSiguiente; j += 1) {
      mediaX += coordenadaX(points[j]);
      mediaY += coordenadaY(points[j]);
      cuenta += 1;
    }
    if (cuenta > 0) {
      mediaX /= cuenta;
      mediaY /= cuenta;
    }

    const puntoA = points[anterior];
    const ax = coordenadaX(puntoA);
    const ay = coordenadaY(puntoA);

    let mejorIndice = inicioTramo;
    let mejorArea = -1;
    for (let j = inicioTramo; j < finTramo; j += 1) {
      const area =
        Math.abs((ax - mediaX) * (coordenadaY(points[j]) - ay) - (ax - coordenadaX(points[j])) * (mediaY - ay)) / 2;
      if (area > mejorArea) {
        mejorArea = area;
        mejorIndice = j;
      }
    }

    muestreados.push(points[mejorIndice]);
    anterior = mejorIndice;
  }

  muestreados.push(points[total - 1]);
  return muestreados;
}

/** Mínimo y máximo de los valores válidos de una serie. `null` si no hay ninguno. */
export function extent(points: readonly ChartPoint[]): NumericRange | null {
  let minimo = Number.POSITIVE_INFINITY;
  let maximo = Number.NEGATIVE_INFINITY;
  let hay = false;
  for (const punto of points) {
    if (!Number.isFinite(punto.y)) continue;
    hay = true;
    if (punto.y < minimo) minimo = punto.y;
    if (punto.y > maximo) maximo = punto.y;
  }
  return hay ? [minimo, maximo] : null;
}

/** Separa la parte entera con puntos de millar y la decimal con coma. */
export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "—";
  const seguros = Math.max(0, Math.min(6, Math.floor(decimals)));
  const signo = value < 0 ? "-" : "";
  const absoluto = Math.abs(value).toFixed(seguros);
  const [entera, decimal] = absoluto.split(".");
  const conMillares = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimal ? `${signo}${conMillares},${decimal}` : `${signo}${conMillares}`;
}

/** Quita el «,0» que sobra en las cifras abreviadas: «1,0 k» se lee peor que «1 k». */
function sinDecimalCero(texto: string): string {
  return texto.endsWith(",0") ? texto.slice(0, -2) : texto;
}

/**
 * Cifra abreviada para ejes y métricas: «1,2 k», «3,4 M», «1,5 MM».
 * Separador decimal español (coma) y espacio antes del sufijo.
 */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const absoluto = Math.abs(value);
  if (absoluto >= 1e9) return `${sinDecimalCero(formatNumber(value / 1e9, 1))} MM`;
  if (absoluto >= 1e6) return `${sinDecimalCero(formatNumber(value / 1e6, 1))} M`;
  if (absoluto >= 1000) return `${sinDecimalCero(formatNumber(value / 1000, 1))} k`;
  if (absoluto > 0 && absoluto < 1) return formatNumber(value, 2);
  return formatNumber(value, Number.isInteger(value) ? 0 : 1);
}

/** Porcentaje con coma decimal. `signed` antepone «+» a lo positivo. */
export function formatPercent(value: number, decimals = 1, signed = false): string {
  if (!Number.isFinite(value)) return "—";
  const cifra = formatNumber(value, decimals);
  const prefijo = signed && value > 0 ? "+" : "";
  return `${prefijo}${cifra} %`;
}

/**
 * Frase que resume una serie en prosa, para el `<figcaption>` y el bloque
 * `sr-only`. Se genera SIEMPRE a partir de los datos: quien no ve el gráfico
 * recibe el mismo contenido que quien lo ve, no una descripción escrita a mano
 * que envejece con el primer cambio de datos.
 */
export function describeSeries(
  name: string,
  points: readonly ChartPoint[],
  formatter: (value: number) => string = formatCompact,
): string {
  const validos = points.filter((punto) => Number.isFinite(punto.y));
  if (validos.length === 0) return `${name}: todavía no hay valores registrados.`;
  if (validos.length === 1) {
    const unico = validos[0];
    const referencia = unico.label ? ` en ${unico.label}` : "";
    return `${name}: un único valor de ${formatter(unico.y)}${referencia}.`;
  }

  const primero = validos[0];
  const ultimo = validos[validos.length - 1];
  const recorrido = extent(validos) ?? [primero.y, ultimo.y];
  const diferencia = ultimo.y - primero.y;
  const direccion = diferencia > 0 ? "sube" : diferencia < 0 ? "baja" : "se mantiene";

  const desde = primero.label ? `${formatter(primero.y)} (${primero.label})` : formatter(primero.y);
  const hasta = ultimo.label ? `${formatter(ultimo.y)} (${ultimo.label})` : formatter(ultimo.y);

  const variacion =
    primero.y === 0
      ? diferencia === 0
        ? "sin variación"
        : `${direccion} ${formatter(Math.abs(diferencia))} desde cero, sin porcentaje calculable`
      : `${direccion} ${formatter(Math.abs(diferencia))} (${formatPercent((diferencia / Math.abs(primero.y)) * 100, 1, true)})`;

  return `${name}: ${validos.length} valores entre ${formatter(recorrido[0])} y ${formatter(recorrido[1])}. Empieza en ${desde} y termina en ${hasta}; ${variacion}.`;
}
