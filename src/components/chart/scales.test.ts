import { describe, expect, it } from "vitest";
import {
  bandScale,
  buildAreaPath,
  buildLinePath,
  describeSeries,
  downsample,
  extent,
  formatCompact,
  formatNumber,
  formatPercent,
  linearScale,
  niceTicks,
  type ChartPoint,
} from "@/components/chart/scales";

/** Atajo para construir series de prueba sin ruido. */
const serie = (valores: readonly number[]): ChartPoint[] =>
  valores.map((valor, indice) => ({ x: indice, y: valor }));

describe("niceTicks", () => {
  it("reparte el eje en pasos redondos", () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(0, 10, 5)).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it("nunca inventa pasos arbitrarios con rangos sucios", () => {
    expect(niceTicks(3, 47, 5)).toEqual([10, 20, 30, 40]);
  });

  it("incluye el cero siempre que el rango lo cruce", () => {
    expect(niceTicks(-30, 60, 5)).toContain(0);
    expect(niceTicks(-5, 5, 4)).toEqual([-5, -2.5, 0, 2.5, 5]);
    expect(niceTicks(-0.3, 0.7, 5)).toContain(0);
  });

  it("abre hacia el cero un dominio de un solo valor", () => {
    expect(niceTicks(7, 7, 5)).toEqual([0, 2, 4, 6]);
    expect(niceTicks(-4, -4, 5)).toEqual([-4, -3, -2, -1, 0]);
  });

  it("con la serie entera a cero muestra el eje 0-1", () => {
    expect(niceTicks(0, 0, 5)).toEqual([0, 1]);
  });

  it("acepta el dominio al revés y lo ordena", () => {
    expect(niceTicks(5, 1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("devuelve una lista vacía si el dominio no es numérico", () => {
    expect(niceTicks(Number.NaN, 10, 5)).toEqual([]);
    expect(niceTicks(0, Number.POSITIVE_INFINITY, 5)).toEqual([]);
  });

  it("trabaja con magnitudes muy pequeñas y muy grandes", () => {
    expect(niceTicks(0, 0.5, 5)).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(niceTicks(0, 5_000_000, 5)).toEqual([0, 1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000]);
  });

  it("nunca devuelve menos de dos marcas", () => {
    expect(niceTicks(0, 1, 0).length).toBeGreaterThanOrEqual(2);
    expect(niceTicks(1.0001, 1.0002, 5).length).toBeGreaterThanOrEqual(2);
  });
});

describe("linearScale", () => {
  it("mapea el dominio sobre el rango de píxeles", () => {
    const escala = linearScale({ domain: [0, 100], range: [0, 200] });
    expect(escala(0)).toBe(0);
    expect(escala(50)).toBe(100);
    expect(escala(100)).toBe(200);
  });

  it("admite el rango invertido que usa el eje vertical", () => {
    const escala = linearScale({ domain: [0, 100], range: [200, 0] });
    expect(escala(0)).toBe(200);
    expect(escala(100)).toBe(0);
  });

  it("extrapola fuera del dominio sin recortar", () => {
    const escala = linearScale({ domain: [0, 10], range: [0, 100] });
    expect(escala(15)).toBe(150);
    expect(escala(-5)).toBe(-50);
  });

  it("coloca en el centro del rango un dominio de un solo valor", () => {
    const escala = linearScale({ domain: [5, 5], range: [0, 200] });
    expect(escala(5)).toBe(100);
    expect(escala(9999)).toBe(100);
    expect(escala.invert(0)).toBe(5);
  });

  it("devuelve NaN ante valores imposibles en lugar de Infinity", () => {
    const escala = linearScale({ domain: [0, 10], range: [0, 100] });
    expect(Number.isNaN(escala(Number.NaN))).toBe(true);
    expect(Number.isNaN(escala(Number.POSITIVE_INFINITY))).toBe(true);
    const rota = linearScale({ domain: [0, Number.NaN], range: [0, 100] });
    expect(Number.isNaN(rota(5))).toBe(true);
    expect(Number.isNaN(rota.invert(5))).toBe(true);
  });

  it("invierte el píxel al valor original", () => {
    const escala = linearScale({ domain: [10, 50], range: [0, 400] });
    expect(escala.invert(escala(32))).toBeCloseTo(32, 10);
    expect(escala.invert(200)).toBe(30);
  });

  it("expone las marcas del propio dominio", () => {
    const escala = linearScale({ domain: [0, 100], range: [0, 200] });
    expect(escala.ticks(5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(escala.domain).toEqual([0, 100]);
    expect(escala.range).toEqual([0, 200]);
  });
});

describe("bandScale", () => {
  const escala = bandScale({ domain: ["ene", "feb", "mar", "abr"], range: [0, 400], padding: 0.2 });

  it("reparte las bandas con su hueco", () => {
    expect(escala.step()).toBe(100);
    expect(escala.bandwidth()).toBe(80);
    expect(escala("ene")).toBe(10);
    expect(escala("mar")).toBe(210);
  });

  it("centra la etiqueta del eje", () => {
    expect(escala.center("ene")).toBe(50);
    expect(escala.center("abr")).toBe(350);
  });

  it("sin hueco las barras se tocan", () => {
    const pegadas = bandScale({ domain: ["a", "b"], range: [0, 100], padding: 0 });
    expect(pegadas("a")).toBe(0);
    expect(pegadas.bandwidth()).toBe(50);
  });

  it("devuelve NaN para una categoría desconocida", () => {
    expect(Number.isNaN(escala("dic"))).toBe(true);
    expect(Number.isNaN(escala.center("dic"))).toBe(true);
  });

  it("sobrevive a un dominio vacío", () => {
    const vacia = bandScale({ domain: [], range: [0, 100] });
    expect(vacia.bandwidth()).toBe(0);
    expect(vacia.step()).toBe(0);
    expect(Number.isNaN(vacia("a"))).toBe(true);
  });

  it("recorta un hueco fuera de escala en vez de producir anchos negativos", () => {
    const exagerada = bandScale({ domain: ["a", "b"], range: [0, 100], padding: 5 });
    expect(exagerada.bandwidth()).toBeGreaterThanOrEqual(0);
  });
});

describe("buildLinePath", () => {
  it("construye segmentos rectos", () => {
    expect(buildLinePath([{ x: 0, y: 10 }, { x: 5, y: 20 }])).toBe("M0,10 L5,20");
  });

  it("no dibuja curvas: no aparece ningún comando C ni Q", () => {
    const d = buildLinePath(serie([1, 8, 3, 9, 2]).map((punto) => ({ x: punto.x * 10, y: punto.y * 10 })));
    expect(d).not.toMatch(/[CQS]/);
  });

  it("parte el trazo donde falta el dato en vez de unir por encima del vacío", () => {
    const d = buildLinePath([
      { x: 0, y: 10 },
      { x: 5, y: Number.NaN },
      { x: 10, y: 30 },
    ]);
    expect(d).toBe("M0,10 M10,30");
  });

  it("devuelve una cadena vacía sin puntos válidos", () => {
    expect(buildLinePath([])).toBe("");
    expect(buildLinePath([{ x: Number.NaN, y: Number.NaN }])).toBe("");
  });

  it("redondea a dos decimales para no inflar el atributo d", () => {
    expect(buildLinePath([{ x: 1.23456, y: 9.87654 }, { x: 2, y: 3 }])).toBe("M1.23,9.88 L2,3");
  });
});

describe("buildAreaPath", () => {
  it("cierra el área contra la línea base", () => {
    expect(buildAreaPath([{ x: 0, y: 10 }, { x: 5, y: 20 }], 100)).toBe("M0,100 L0,10 L5,20 L5,100 Z");
  });

  it("cierra cada tramo por separado cuando hay huecos", () => {
    const d = buildAreaPath([
      { x: 0, y: 10 },
      { x: 5, y: Number.NaN },
      { x: 10, y: 30 },
    ], 50);
    expect(d).toBe("M0,50 L0,10 L0,50 Z M10,50 L10,30 L10,50 Z");
  });

  it("no dibuja nada sin puntos o sin línea base válida", () => {
    expect(buildAreaPath([], 100)).toBe("");
    expect(buildAreaPath([{ x: 0, y: 10 }], Number.NaN)).toBe("");
  });
});

describe("downsample", () => {
  it("no toca una serie que ya cabe", () => {
    const puntos = serie([1, 2, 3]);
    expect(downsample(puntos, 10)).toEqual(puntos);
    expect(downsample(puntos, 3)).toEqual(puntos);
  });

  it("respeta el límite pedido", () => {
    const puntos = serie(Array.from({ length: 1000 }, (_, i) => Math.sin(i / 8) * 100));
    expect(downsample(puntos, 120)).toHaveLength(120);
  });

  it("conserva siempre el primer y el último punto", () => {
    const puntos = serie(Array.from({ length: 500 }, (_, i) => i));
    const reducida = downsample(puntos, 50);
    expect(reducida[0]).toEqual(puntos[0]);
    expect(reducida[reducida.length - 1]).toEqual(puntos[499]);
  });

  it("conserva el pico: es lo único que se mira en una serie operativa", () => {
    const valores = Array.from({ length: 400 }, () => 10);
    valores[173] = 980;
    const reducida = downsample(serie(valores), 40);
    expect(reducida.some((punto) => punto.y === 980)).toBe(true);
  });

  it("mantiene el orden por x", () => {
    const puntos = serie(Array.from({ length: 300 }, (_, i) => (i % 7) * 3));
    const reducida = downsample(puntos, 30);
    const ordenada = [...reducida].sort((a, b) => a.x - b.x);
    expect(reducida).toEqual(ordenada);
  });

  it("cubre los límites: cero puntos, un punto y límites absurdos", () => {
    expect(downsample([], 10)).toEqual([]);
    expect(downsample(serie([5]), 10)).toEqual(serie([5]));
    expect(downsample(serie([1, 2, 3, 4]), 0)).toEqual([]);
    expect(downsample(serie([1, 2, 3, 4]), -3)).toEqual([]);
    expect(downsample(serie([1, 2, 3, 4]), Number.NaN)).toEqual([]);
    expect(downsample(serie([1, 2, 3, 4]), 1)).toEqual([{ x: 0, y: 1 }]);
    expect(downsample(serie([1, 2, 3, 4]), 2)).toEqual([{ x: 0, y: 1 }, { x: 3, y: 4 }]);
  });

  it("no se rompe con valores no finitos por medio", () => {
    const valores = Array.from({ length: 200 }, (_, i) => (i === 90 ? Number.NaN : i));
    const reducida = downsample(serie(valores), 20);
    expect(reducida).toHaveLength(20);
    expect(reducida.every((punto) => Number.isFinite(punto.x))).toBe(true);
  });
});

describe("extent", () => {
  it("devuelve mínimo y máximo ignorando lo no finito", () => {
    expect(extent(serie([4, 1, 9, 3]))).toEqual([1, 9]);
    expect(extent([{ x: 0, y: Number.NaN }, { x: 1, y: 7 }])).toEqual([7, 7]);
  });

  it("devuelve null cuando no hay ningún valor utilizable", () => {
    expect(extent([])).toBeNull();
    expect(extent([{ x: 0, y: Number.NaN }])).toBeNull();
  });

  it("funciona con negativos y con todo a cero", () => {
    expect(extent(serie([-8, -2, -5]))).toEqual([-8, -2]);
    expect(extent(serie([0, 0, 0]))).toEqual([0, 0]);
  });
});

describe("formatNumber", () => {
  it("usa punto de millar y coma decimal", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
    expect(formatNumber(1234.5, 1)).toBe("1.234,5");
    expect(formatNumber(-1234.56, 2)).toBe("-1.234,56");
    expect(formatNumber(0)).toBe("0");
  });

  it("devuelve un guion ante valores imposibles", () => {
    expect(formatNumber(Number.NaN)).toBe("—");
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("formatCompact", () => {
  it("abrevia con separador decimal español", () => {
    expect(formatCompact(1200)).toBe("1,2 k");
    expect(formatCompact(3_400_000)).toBe("3,4 M");
    expect(formatCompact(1_500_000_000)).toBe("1,5 MM");
  });

  it("no arrastra el «,0» que sobra", () => {
    expect(formatCompact(1000)).toBe("1 k");
    expect(formatCompact(2_000_000)).toBe("2 M");
  });

  it("conserva el signo", () => {
    expect(formatCompact(-2500)).toBe("-2,5 k");
  });

  it("deja intactas las cifras pequeñas", () => {
    expect(formatCompact(999)).toBe("999");
    expect(formatCompact(12.5)).toBe("12,5");
    expect(formatCompact(0)).toBe("0");
    expect(formatCompact(0.25)).toBe("0,25");
  });

  it("devuelve un guion ante valores imposibles", () => {
    expect(formatCompact(Number.NaN)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("da el porcentaje con coma decimal", () => {
    expect(formatPercent(12.34)).toBe("12,3 %");
    expect(formatPercent(50, 0)).toBe("50 %");
  });

  it("antepone el signo cuando se pide", () => {
    expect(formatPercent(5, 0, true)).toBe("+5 %");
    expect(formatPercent(-5, 0, true)).toBe("-5 %");
    expect(formatPercent(0, 0, true)).toBe("0 %");
  });
});

describe("describeSeries", () => {
  it("resume rango, extremos y variación", () => {
    expect(describeSeries("Ventas", [{ x: 0, y: 100 }, { x: 1, y: 150 }])).toBe(
      "Ventas: 2 valores entre 100 y 150. Empieza en 100 y termina en 150; sube 50 (+50,0 %).",
    );
  });

  it("usa las etiquetas de los puntos cuando existen", () => {
    const frase = describeSeries("Altas", [
      { x: 0, y: 4, label: "enero" },
      { x: 1, y: 9, label: "febrero" },
    ]);
    expect(frase).toContain("(enero)");
    expect(frase).toContain("(febrero)");
  });

  it("distingue subida, bajada y serie plana", () => {
    expect(describeSeries("A", serie([10, 4]))).toContain("baja");
    expect(describeSeries("B", serie([10, 10]))).toContain("se mantiene");
    expect(describeSeries("C", serie([4, 10]))).toContain("sube");
  });

  it("no calcula porcentajes imposibles cuando se parte de cero", () => {
    const frase = describeSeries("Incidencias", serie([0, 12]));
    expect(frase).toContain("sin porcentaje calculable");
    expect(frase).not.toContain("Infinity");
    expect(frase).not.toContain("NaN");
  });

  it("describe la serie plana a cero sin variación", () => {
    expect(describeSeries("Bajas", serie([0, 0, 0]))).toContain("sin variación");
  });

  it("cubre la serie vacía y la de un solo punto", () => {
    expect(describeSeries("Ventas", [])).toBe("Ventas: todavía no hay valores registrados.");
    expect(describeSeries("Ventas", [{ x: 0, y: 42, label: "enero" }])).toBe(
      "Ventas: un único valor de 42 en enero.",
    );
  });

  it("ignora los puntos no finitos al describir", () => {
    const frase = describeSeries("Turnos", [
      { x: 0, y: 10 },
      { x: 1, y: Number.NaN },
      { x: 2, y: 30 },
    ]);
    expect(frase).toContain("2 valores");
    expect(frase).not.toContain("NaN");
  });

  it("admite un formateador propio", () => {
    expect(describeSeries("Horas", serie([1, 2]), (valor) => `${valor} h`)).toContain("Empieza en 1 h");
  });

  it("mantiene el porcentaje correcto con valores negativos de partida", () => {
    const frase = describeSeries("Margen", serie([-20, -10]));
    expect(frase).toContain("sube");
    expect(frase).toContain("+50,0 %");
  });
});
