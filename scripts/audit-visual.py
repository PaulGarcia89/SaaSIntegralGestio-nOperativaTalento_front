#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Inventario visual: qué patrón usa cada pantalla y qué le falta.

Recorre cada `page.tsx` y su árbol de importaciones, y marca qué piezas del
sistema aparecen: fichas (`DataView`), cabecera, acción recomendada, métricas,
distintivos de estado, estados vacíos, esqueletos y gráficos.

Sirve para dos cosas: elegir por dónde seguir —midiendo, no por intuición— y
comprobar que el patrón se aplica de forma coherente en vez de quedarse en
unas pocas pantallas.

    python3 scripts/audit-visual.py
"""
import io, os, re, unicodedata
from collections import defaultdict

fuentes = {}
for raiz, dirs, fs in os.walk("src"):
    dirs[:] = [d for d in dirs if d not in {"node_modules", ".next"}]
    for f in fs:
        if (f.endswith(".tsx") or f.endswith(".ts")) and ".test." not in f:
            p = os.path.join(raiz, f).replace(os.sep, "/")
            fuentes[p] = unicodedata.normalize("NFC", io.open(p, encoding="utf-8").read())

def resolver(spec):
    if not spec.startswith("@/"): return None
    b = "src/" + spec[2:]
    for c in (b + ".tsx", b + ".ts", b + "/index.tsx", b + "/index.ts"):
        if c in fuentes: return c
    return None

deps = {p: {r for r in (resolver(m.group(1)) for m in re.finditer(r'from "(@/[^"]+)"', s)) if r} for p, s in fuentes.items()}

def arbol(p, v=None):
    v = v or set()
    if p in v: return v
    v.add(p)
    for d in deps.get(p, ()): arbol(d, v)
    return v

def ruta_de(p):
    r = p.replace("src/app", "").replace("/page.tsx", "")
    return re.sub(r'/\((?:app|auth)\)', '', r) or "/"

paginas = sorted(p for p in fuentes if "/app/" in p and p.endswith("page.tsx"))
SENAL = {
    "DataView":        re.compile(r'<DataView[\s>]'),
    "tabla cruda":     re.compile(r'<table[\s>]'),
    "scroll-x":        re.compile(r'overflow-x-auto'),
    "PageHeader":      re.compile(r'<PageHeader[\s>]'),
    "NextAction":      re.compile(r'<NextAction[\s>]'),
    "Metric":          re.compile(r'<Metric(?:Row|Card)?[\s>]'),
    "StatusBadge":     re.compile(r'<StatusBadge[\s>]'),
    "EmptyState":      re.compile(r'<(?:EmptyState|SimpleEmpty)[\s>]'),
    "Skeleton":        re.compile(r'<Skeleton\w*[\s>]|state="loading"'),
    "gráfico":         re.compile(r'recharts|<svg[\s>]|conic-gradient|linear-gradient\(to right'),
}
resumen = defaultdict(int)
filas = []
for pag in paginas:
    arb = {a for a in arbol(pag) if a.endswith(".tsx") and "/components/ui/" not in a}
    texto = "\n".join(fuentes[a] for a in arb)
    marcas = {k: bool(rx.search(texto)) for k, rx in SENAL.items()}
    for k, v in marcas.items():
        if v: resumen[k] += 1
    filas.append((ruta_de(pag), marcas))

print(f"PANTALLAS: {len(paginas)}\n")
print(f"{'señal':16s} {'pantallas':>10s}")
for k in SENAL:
    print(f"{k:16s} {resumen[k]:10d}")
print()
print("=== pantallas con TABLA CRUDA (sin DataView) ===")
sin = [r for r, m in filas if m["tabla cruda"] and not m["DataView"]]
print(len(sin))
for r in sin: print("   ", r)
print()
print("=== pantallas SIN PageHeader ===")
sinh = [r for r, m in filas if not m["PageHeader"]]
print(len(sinh), sinh[:25])
print()
print("=== pantallas SIN estado vacío ===")
sinv = [r for r, m in filas if not m["EmptyState"]]
print(len(sinv), sinv[:20])
