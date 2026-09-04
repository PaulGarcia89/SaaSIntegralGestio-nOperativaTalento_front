import { describe, expect, it } from "vitest";
import { createTenantTheme, __testing } from "@/lib/tenant-branding";

const { contrastRatio } = __testing;

/** Deben coincidir con `globals.css`. */
const SURFACE_LIGHT = { h: 210, s: 40, l: 98 };
const SURFACE_DARK = { h: 222, s: 47, l: 7 };
const SURFACE_SIDEBAR = { h: 220, s: 29, l: 12 };
const WHITE = { h: 0, s: 0, l: 100 };

function parse(value: string) {
  const [h, s, l] = value.split(" ");
  return { h: Number(h), s: Number.parseFloat(s), l: Number.parseFloat(l) };
}

/**
 * Marcas de prueba elegidas por ser problemáticas:
 * - `#2563EB` es el acento real del tenant de pruebas y el que hacía fallar axe.
 * - El amarillo y el verde lima son los peores casos para texto sobre fondo
 *   claro; el azul marino, para texto sobre fondo oscuro.
 */
const BRANDS = ["#2563EB", "#0EA5B7", "#EAB308", "#84CC16", "#1E1B4B", "#DB2777", "#000000", "#FFFFFF"];

describe("createTenantTheme", () => {
  it("valida el punto de partida: el color de relleno NO sirve como texto", () => {
    // Documenta el defecto que motivó el cambio. Con el acento real del tenant
    // de pruebas, el relleno usado como texto quedaba muy por debajo de AA.
    const { primary } = createTenantTheme("#2563EB");
    expect(contrastRatio(parse(primary), SURFACE_SIDEBAR)).toBeLessThan(4.5);
    expect(contrastRatio(parse(primary), SURFACE_DARK)).toBeLessThan(4.5);
  });

  describe.each(BRANDS)("marca %s", (brand) => {
    const theme = createTenantTheme(brand);

    it("texto sobre fondo claro cumple AA", () => {
      expect(contrastRatio(parse(theme.textOnLight), SURFACE_LIGHT)).toBeGreaterThanOrEqual(4.5);
    });

    it("texto sobre fondo oscuro cumple AA", () => {
      expect(contrastRatio(parse(theme.textOnDark), SURFACE_DARK)).toBeGreaterThanOrEqual(4.5);
    });

    it("texto sobre la barra lateral cumple AA", () => {
      expect(contrastRatio(parse(theme.textOnSidebar), SURFACE_SIDEBAR)).toBeGreaterThanOrEqual(4.5);
    });

    it("el texto blanco sobre el relleno de marca cumple AA", () => {
      const foreground = parse(theme.foreground);
      expect(contrastRatio(parse(theme.primary), foreground)).toBeGreaterThanOrEqual(4.5);
    });

    it("conserva el tono de la marca", () => {
      const source = __testing.rgbToHsl(__testing.hexToRgb(theme.hex));
      // Los grises no tienen tono significativo, así que se excluyen.
      if (source.s < 5) return;
      expect(parse(theme.textOnLight).h).toBe(Math.round(source.h));
      expect(parse(theme.textOnDark).h).toBe(Math.round(source.h));
    });
  });

  it("recurre al color por defecto si el acento no es un hex valido", () => {
    expect(createTenantTheme("azul").hex).toBe("#0EA5B7");
    expect(createTenantTheme(undefined).hex).toBe("#0EA5B7");
  });

  it("mantiene el relleno en la franja 38-48% cuando ahi ya es legible", () => {
    for (const brand of ["#2563EB", "#0EA5B7", "#DB2777", "#1E1B4B"]) {
      const { l } = parse(createTenantTheme(brand).primary);
      expect(l).toBeGreaterThanOrEqual(38);
      expect(l).toBeLessThanOrEqual(48);
    }
  });

  it("oscurece el relleno de una marca acromatica hasta que su texto sea legible", () => {
    // Un gris al 48 % no alcanza AA contra blanco ni contra casi negro.
    const { l } = parse(createTenantTheme("#FFFFFF").primary);
    expect(l).toBeLessThan(48);
  });

  it("el blanco puro sigue siendo legible como texto sobre fondo claro", () => {
    const theme = createTenantTheme("#FFFFFF");
    expect(contrastRatio(parse(theme.textOnLight), WHITE)).toBeGreaterThanOrEqual(4.5);
  });
});
