#!/usr/bin/env python3
"""
Auditoría de contraste, medida sobre píxeles.

Por qué hace falta
------------------
Que una clase de color exista no significa que llegue a aplicarse, y que se
aplique no significa que se lea. En este proyecto ocurrieron las dos cosas a
la vez: una regla de elemento sin capa anulaba en silencio los `text-*` de
todos los titulares, y el titular de la portada acabó pintándose casi negro
sobre un fondo casi negro. Ni el typecheck, ni las pruebas, ni el build lo
ven: el CSS es válido. `globals.layers.test.ts` cubre la causa —reglas sin
capa—; esto cubre el efecto.

Cómo mide
---------
El fondo efectivo de un texto no se puede deducir del CSS: hay degradados,
capas translúcidas, desenfoques y elementos superpuestos. Así que la página se
renderiza DOS veces —una normal y otra con todo el texto en transparente— y el
fondo de cada texto se toma de los píxeles de la segunda. Es exacto por
construcción, sin suposiciones sobre el orden de las capas.

Umbrales WCAG 2.2 AA: 4,5:1 para texto normal y 3:1 para texto grande
(>=24px, o >=18,66px en negrita). Se ignora lo marcado `aria-hidden="true"`,
que por definición no se lee.

Uso
---
    node node_modules/next/dist/bin/next dev &      # o `next start`
    python3 scripts/audit-contrast.py               # portada, 1280 y 390 px
    python3 scripts/audit-contrast.py /jobs /login

Requiere `playwright` y `pillow` en el entorno de Python. Sale con código 1 si
encuentra algún texto por debajo del umbral, para poder encadenarlo en CI.
"""

import sys
from collections import Counter

try:
    from playwright.sync_api import sync_playwright
    from PIL import Image
except ImportError:  # pragma: no cover - depende del entorno
    sys.exit("Faltan dependencias: pip install playwright pillow && playwright install chromium")

BASE = "http://localhost:3000"
ANCHOS = ((1280, 900, "escritorio"), (390, 844, "iphone"))

# Recolecta cada nodo de texto con su color resuelto en sRGB y su recuadro.
# El color se resuelve pintándolo en un lienzo: así `color-mix`, `oklab` y las
# opacidades de Tailwind llegan ya como r,g,b,a y no hay que interpretarlas.
COLLECT = """() => {
  const out = [];
  const ctx = document.createElement('canvas').getContext('2d', {willReadFrequently: true});
  document.querySelectorAll('body *').forEach((el) => {
    if (el.closest('[aria-hidden="true"]')) return;   // decoración, no se lee
    for (const node of el.childNodes) {
      if (node.nodeType !== 3 || !node.textContent.trim()) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = cs.color; ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      out.push({
        text: node.textContent.trim().slice(0, 48),
        tag: el.tagName,
        cls: (el.className || '').toString().slice(0, 90),
        rgba: [d[0], d[1], d[2], d[3] / 255],
        size: parseFloat(cs.fontSize),
        weight: cs.fontWeight,
        rect: [r.x, r.y, r.width, r.height],
      });
      return;
    }
  });
  return out;
}"""

HIDE = """() => {
  const s = document.createElement('style');
  s.textContent = '*, *::before, *::after { color: transparent !important; text-shadow: none !important; } svg { visibility: hidden !important; }';
  document.head.appendChild(s);
}"""


def _lineal(canal):
    c = canal / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminancia(rgb):
    r, g, b = (_lineal(v) for v in rgb[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def revisar(pagina, ancho, alto, etiqueta, ruta):
    from tempfile import NamedTemporaryFile

    pagina.set_viewport_size({"width": ancho, "height": alto})
    pagina.goto(f"{BASE}{ruta}", wait_until="load")
    pagina.wait_for_timeout(600)
    textos = pagina.evaluate(COLLECT)
    pagina.evaluate(HIDE)
    pagina.wait_for_timeout(200)
    with NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        pagina.screenshot(path=tmp.name, full_page=True)
        fondo = Image.open(tmp.name).convert("RGB")

    fallos = []
    for texto in textos:
        x, y, w, h = texto["rect"]
        if x < 0 or y < 0:
            continue
        caja = (int(x + 1), int(y + 1), min(fondo.width, int(x + w - 1)), min(fondo.height, int(y + h - 1)))
        if caja[2] <= caja[0] or caja[3] <= caja[1]:
            continue
        # El fondo más frecuente bajo el texto: sobre un degradado, el
        # representativo, no un extremo.
        bg = Counter(fondo.crop(caja).getdata()).most_common(1)[0][0]
        r, g, b, alfa = texto["rgba"]
        fg = tuple(round(v * alfa + bg[i] * (1 - alfa)) for i, v in enumerate((r, g, b)))
        grande = texto["size"] >= 24 or (texto["size"] >= 18.66 and int(texto["weight"]) >= 700)
        minimo = 3.0 if grande else 4.5
        ratio = contraste(fg, bg)
        if ratio < minimo:
            fallos.append({**texto, "bg": bg, "fg": fg, "ratio": ratio, "minimo": minimo})
    return fallos


def main():
    rutas = sys.argv[1:] or ["/"]
    total = 0
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pagina = navegador.new_page(device_scale_factor=1)
        for ruta in rutas:
            for ancho, alto, etiqueta in ANCHOS:
                fallos = revisar(pagina, ancho, alto, etiqueta, ruta)
                total += len(fallos)
                estado = "sin hallazgos" if not fallos else f"{len(fallos)} por debajo del umbral"
                print(f"\n=== {ruta} · {etiqueta} {ancho}px — {estado} ===")
                for f in sorted(fallos, key=lambda i: i["ratio"]):
                    print(f"  {f['ratio']:5.2f} (mín {f['minimo']}) {f['tag']:6s} «{f['text'][:36]}»")
                    print(f"        tinta {f['fg']} sobre {f['bg']}")
                    print(f"        {f['cls'][:88]}")
        navegador.close()
    print(f"\nTotal: {total}")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
