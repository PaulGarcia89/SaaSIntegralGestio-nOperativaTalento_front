import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Toda clase de color usada en el producto tiene que existir como token.
 *
 * Esta prueba nace de un fallo real cometido al renombrar `--landing-*` a
 * `--surface-dark-*`: el renombrado alcanzó `globals.css` pero no las clases
 * `border-landing-ink`, porque la expresión regular exigía que el nombre no
 * fuera precedido de un guion —y ahí lo precede el de `border-`—. Quedaron 86
 * clases apuntando a tokens que ya no existían.
 *
 * Lo grave es que **nada lo detectó**: Tailwind descarta en silencio las
 * utilidades que no reconoce, así que el typecheck pasó, las 554 pruebas
 * pasaron y el build compiló 92 páginas. La portada se habría quedado sin
 * color y el primer aviso habría sido un humano mirándola.
 *
 * Por eso la comprobación es sobre el texto, no sobre el resultado: es el
 * único punto donde se puede ver la discrepancia.
 */

// `process.cwd()` es la raíz del proyecto bajo vitest; `__dirname` apunta a
// src/lib y obligaba a contar saltos hacia arriba.
const ROOT = process.cwd();
const SRC = join(ROOT, "src");

/** Prefijos de Tailwind que aceptan un color. */
const PREFIXES = [
  "bg", "text", "border", "from", "to", "via", "ring", "shadow",
  "decoration", "divide", "outline", "fill", "stroke", "caret", "accent",
];

/** Nombres de color propios del proyecto, tal como los declara `@theme inline`. */
function declaredColors(): Set<string> {
  const css = readFileSync(join(SRC, "app", "globals.css"), "utf8");
  const names = new Set<string>();
  for (const match of css.matchAll(/--color-([a-z0-9-]+)\s*:/g)) {
    names.add(match[1]);
  }
  return names;
}

function tsxFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...tsxFiles(full));
    else if (full.endsWith(".tsx")) found.push(full);
  }
  return found;
}

/**
 * Nombres que Tailwind trae de serie o que el proyecto mapea a los heredados.
 * No hace falta enumerarlos: basta con quedarse solo con las clases cuyo
 * nombre coincide con la FORMA de los tokens propios (`surface-*`, `ink-*`,
 * `accent-*`, `line*`, `status-*`), que son las que este proyecto inventa y
 * por tanto las que se pueden romper al renombrar.
 */
const OWN = /^(surface|ink|line|accent|status|action|on-action|on-accent|canvas|focus)(-|$)/;

describe("tokens de color", () => {
  const declared = declaredColors();

  it("declara los tokens que el sistema da por hechos", () => {
    for (const name of ["surface-1", "ink-1", "line", "accent-fill", "action"]) {
      expect(declared).toContain(name);
    }
  });

  it("ninguna clase de color apunta a un token inexistente", () => {
    const pattern = new RegExp(
      `(?:^|[\\s"'\`{])(?:${PREFIXES.join("|")})-([a-z0-9-]+?)(?:/\\d{1,3})?(?=[\\s"'\`}]|$)`,
      "g",
    );
    const orphans: string[] = [];

    for (const file of tsxFiles(SRC)) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(pattern)) {
        const name = match[1];
        if (!OWN.test(name)) continue;
        if (declared.has(name)) continue;
        orphans.push(`${file.replace(ROOT + "/", "")}: ${match[0].trim()}`);
      }
    }

    // Un token que no existe no pinta nada, y Tailwind no avisa.
    expect(orphans).toEqual([]);
  });
});
