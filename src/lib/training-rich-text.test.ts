import { describe, expect, it } from "vitest";
import { blockHtml, richTextToPlain, sanitizeRichText } from "@/lib/training-rich-text";

/**
 * Sin navegador (`DOMParser`) el saneado cae a texto plano: nunca deja pasar
 * una etiqueta. Con navegador conserva solo la lista blanca; eso se prueba en
 * el propio reproductor.
 */
describe("texto enriquecido de una lección", () => {
  it("fuera del navegador nunca devuelve etiquetas", () => {
    const html = "<p>Hola <strong>mundo</strong></p><script>alert(1)</script>";
    expect(sanitizeRichText(html)).not.toMatch(/<[a-z]/i);
    expect(sanitizeRichText(html)).toContain("Hola");
  });

  it("blockHtml entiende las tres formas en que se guardó el contenido", () => {
    expect(blockHtml({ text: "a < b" })).toBe("<p>a &lt; b</p>");
    expect(blockHtml({ body: "cuerpo" })).toBe("<p>cuerpo</p>");
    expect(blockHtml({ html: "<p>x</p>" })).toContain("x");
    expect(blockHtml(null)).toBeNull();
    expect(blockHtml({ other: 1 })).toBeNull();
  });

  it("richTextToPlain compacta espacios y entidades", () => {
    expect(richTextToPlain("<p>Uno&nbsp;&amp;   dos</p>")).toBe("Uno & dos");
  });
});
