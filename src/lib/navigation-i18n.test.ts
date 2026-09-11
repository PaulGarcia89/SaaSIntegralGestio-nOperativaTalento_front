import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import esCommon from "@/i18n/locales/es/common.json";
import enCommon from "@/i18n/locales/en/common.json";
import { appNavigation, navSections } from "@/lib/navigation";
import { restaurantSections } from "@/lib/restaurant-navigation";

/**
 * El menú lateral está en las 108 pantallas: si una entrada no tiene clave, la
 * aplicación entera se queda a medias en inglés.
 *
 * Por qué existe esta prueba
 * --------------------------
 * `localizedNavLabel` busca `nav.<etiqueta>` y, si no la encuentra, devuelve la
 * etiqueta tal cual. Ese respaldo es correcto —nunca enseña una clave cruda—
 * pero es SILENCIOSO: faltaban 74 claves de 100 y el menú seguía en español sin
 * que nada avisara, ni el typecheck, ni el build, ni las demás pruebas.
 *
 * Esta prueba convierte ese silencio en un fallo. Cuando alguien añada una
 * pantalla al menú, sabrá en el momento que le falta la traducción.
 */

const es = esCommon as Record<string, string>;
const en = enCommon as Record<string, string>;

/**
 * Se leen del fuente y no de `appNavigation` a propósito: así se comprueban
 * TODAS las entradas declaradas, incluidas las que un filtro de permisos o de
 * módulo pudiera dejar fuera del arreglo exportado.
 */
const fuente = readFileSync(join(process.cwd(), "src/lib/navigation.ts"), "utf8");
const etiquetas = [...new Set([...fuente.matchAll(/\{ href: "[^"]+", label: "([^"]+)"/g)].map((m) => m[1]))];
const areas = [...new Set([...fuente.matchAll(/group: "([^"]+)"/g)].map((m) => m[1]))];

describe("el menú lateral está traducido", () => {
  it("encuentra las entradas del menú", () => {
    expect(etiquetas.length).toBeGreaterThan(50);
  });

  it("cada entrada tiene clave en los dos idiomas", () => {
    expect(etiquetas.filter((label) => !(`nav.${label}` in es))).toEqual([]);
    expect(etiquetas.filter((label) => !(`nav.${label}` in en))).toEqual([]);
  });

  /**
   * Leer el fuente no basta desde que el inventario de restaurante impone su
   * propio rótulo sobre `appNavigation`: en el archivo sigue escrito
   * «Desperdicios» y en pantalla se lee «Registrar merma», así que la clave
   * que hace falta es la del segundo. Aquí se comprueban las etiquetas que el
   * usuario ve de verdad, incluidas las de la navegación dentro del módulo.
   */
  it("cada etiqueta efectiva, no solo la escrita en el fuente, tiene clave", () => {
    const efectivas = [...new Set([
      ...appNavigation.map((item) => item.label),
      ...restaurantSections.flatMap((section) => [section.label, ...section.items.map((item) => item.label)]),
    ])];
    expect(efectivas.filter((label) => !(`nav.${label}` in es))).toEqual([]);
    expect(efectivas.filter((label) => !(`nav.${label}` in en))).toEqual([]);
  });

  it("cada área tiene clave en los dos idiomas", () => {
    expect(areas.filter((group) => !(`nav.group.${group}` in es))).toEqual([]);
    expect(areas.filter((group) => !(`nav.group.${group}` in en))).toEqual([]);
  });

  it("cada sección tiene clave en los dos idiomas", () => {
    const ids = navSections.map((section) => section.id);
    expect(ids.filter((id) => !(`nav.section.${id}` in es))).toEqual([]);
    expect(ids.filter((id) => !(`nav.section.${id}` in en))).toEqual([]);
  });

  it("ninguna entrada quedó con el mismo texto en los dos idiomas por descuido", () => {
    // Hay términos que se escriben igual —«Pipeline», «Marketing»—; el resto
    // coincidiendo es señal de una traducción copiada sin traducir.
    const IGUALES_A_PROPOSITO = new Set(["Pipeline", "Onboarding", "Dashboard"]);
    const sospechosas = etiquetas
      .filter((label) => es[`nav.${label}`] === en[`nav.${label}`])
      .filter((label) => !IGUALES_A_PROPOSITO.has(es[`nav.${label}`]))
      .filter((label) => es[`nav.${label}`].length > 6);
    expect(sospechosas).toEqual([]);
  });
});
