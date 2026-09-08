/**
 * Texto enriquecido de una lección, seguro para pintar.
 *
 * Los bloques `RICH_TEXT` guardan `content.html` (así los crea el editor y así
 * los cargó el guion de datos de prueba). Antes el reproductor los pintaba con
 * `JSON.stringify(content)`, o sea, la persona veía `{"html":"<p>…"}`.
 *
 * Aquí se conserva SOLO una lista corta de etiquetas de texto y se descartan
 * atributos, scripts, estilos y cualquier URL que no sea http(s) o mailto.
 * Es una lista blanca, no una lista negra: lo que no está permitido se
 * sustituye por su texto. No hay dependencia nueva: lo hace `DOMParser`, que
 * solo existe en el navegador; en el servidor devuelve el texto plano.
 */

const ALLOWED = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "H1", "H2", "H3", "H4", "BLOCKQUOTE", "A", "CODE", "PRE"]);
const SAFE_HREF = /^(https?:|mailto:)/i;

export function sanitizeRichText(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return stripTags(html);
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const out = doc.createElement("div");
  const walk = (node: Node, parent: HTMLElement) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        parent.appendChild(doc.createTextNode(child.textContent ?? ""));
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const element = child as HTMLElement;
      const tag = element.tagName.toUpperCase();
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "IFRAME" || tag === "OBJECT" || tag === "EMBED") return;
      if (!ALLOWED.has(tag)) {
        walk(element, parent);
        return;
      }
      const clean = doc.createElement(tag.toLowerCase());
      if (tag === "A") {
        const href = element.getAttribute("href") ?? "";
        if (SAFE_HREF.test(href)) {
          clean.setAttribute("href", href);
          clean.setAttribute("target", "_blank");
          clean.setAttribute("rel", "noreferrer noopener");
        }
      }
      walk(element, clean);
      parent.appendChild(clean);
    });
  };
  walk(doc.body, out);
  return out.innerHTML;
}

/** Texto plano de un bloque, para vistas donde no cabe el formato. */
export function richTextToPlain(html: string): string {
  return stripTags(html).replace(/\s+/g, " ").trim();
}

function stripTags(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

/** Contenido legible de un bloque, sea cual sea la forma en que se guardó. */
export function blockHtml(content: Record<string, unknown> | null | undefined): string | null {
  if (!content) return null;
  if (typeof content.html === "string") return sanitizeRichText(content.html);
  if (typeof content.text === "string") return `<p>${escapeHtml(content.text)}</p>`;
  if (typeof content.body === "string") return `<p>${escapeHtml(content.body)}</p>`;
  return null;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
