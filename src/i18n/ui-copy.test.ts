import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import english from "./locales/en/ui-copy.json";
import { translateUiCopy } from "./ui-copy";

const dictionary: Record<string, string> = english;
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : path.endsWith(".tsx") ? [path] : [];
  });
}
describe("interface copy language switching", () => {
  it("switches both directions without changing the source", () => {
    for (const locale of ["es", "en", "es"] as const) {
      expect(translateUiCopy(locale, "Guardar")).toBe(locale === "en" ? "Save" : "Guardar");
    }
  });
  it("interpolates counts in both languages and treats inserted content literally", () => {
    expect(translateUiCopy("en", "{{count}} pendientes", { count: 3 })).toBe("3 pending");
    expect(translateUiCopy("es", "{{count}} pendientes", { count: 3 })).toBe("3 pendientes");
    expect(translateUiCopy("en", "toString")).toBe("toString");
    expect(translateUiCopy("en", "{{name}}", { name: "{{count}}" })).toBe("{{count}}");
  });
  it("distinguishes account status from an inventory asset", () => {
    expect(translateUiCopy("en", "Activo")).toBe("Asset");
    expect(translateUiCopy("en", "Activo", {}, "status")).toBe("Active");
    expect(translateUiCopy("es", "Activo", {}, "status")).toBe("Activo");
  });
  it("preserves spacing and leaves unknown company content intact", () => {
    expect(translateUiCopy("en", " Guardar ")).toBe(" Save ");
    for (const value of ["DATALINK TECH CORP", "KendallDr", "", "Curso interno de DATALINK"]) {
      expect(translateUiCopy("en", value)).toBe(value);
    }
  });
  it("has a nonempty English entry for every explicitly marked static string", () => {
    const missing: string[] = [];
    for (const path of sourceFiles("src")) {
      const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node: ts.Node) {
        if (ts.isCallExpression(node) && node.expression.getText(file) === "uiText") {
          const arg = node.arguments[0];
          if (arg && ts.isStringLiteral(arg) && !dictionary[arg.text.trim()]?.trim()) missing.push(`${path}: ${arg.text}`);
        }
        ts.forEachChild(node, visit);
      }
      visit(file);
    }
    expect(missing).toEqual([]);
  });
});
