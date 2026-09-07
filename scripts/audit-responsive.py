#!/usr/bin/env python3
"""
Auditoría de desbordamiento horizontal en pantallas estrechas.

Busca las cuatro causas reales de que una página se pueda arrastrar de lado en
un iPhone, que es el defecto que el encargo pide evitar explícitamente:

1. Anchos fijos por encima del viewport más estrecho que hay que soportar
   (320 px, iPhone SE en vertical).
2. `min-w-[Npx]` con N mayor que ese ancho, que fuerza la barra horizontal
   aunque el contenedor sea flexible.
3. Rejillas con columnas de ancho fijo cuya suma supera el viewport sin
   declarar un punto de ruptura antes.
4. Hijos de flex o grid que contienen algo desbordable (una tabla, un texto
   largo, un `overflow-x-auto`) SIN `min-w-0`. Es la causa más frecuente y la
   menos evidente: por omisión `min-width` vale `auto` en un hijo de flex o
   grid, así que el hijo se niega a encogerse por debajo de su contenido y
   quien acaba desbordándose es la página entera, no el bloque.
"""

import os
import re
import sys

NARROW = 320  # iPhone SE vertical, el más estrecho que hay que soportar.

ROOT = "src"
SKIP_DIRS = {"node_modules", ".next"}

fixed_w = re.compile(r"(?<![\w-])(?:min-)?w-\[(\d+)px\]")
grid_cols = re.compile(r"grid-cols-\[([^\]]+)\]")
px_in_track = re.compile(r"(\d+)px")
overflowable = re.compile(r"overflow-x-auto|<table|whitespace-nowrap")
has_min_w0 = re.compile(r"min-w-0")
# Prefijos responsive: `md:w-[400px]` solo aplica a partir de ese punto.
responsive_prefix = re.compile(r"(sm|md|lg|xl|2xl):$")


def collect():
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if name.endswith((".tsx", ".ts", ".css")):
                yield os.path.join(base, name)


findings = []

for path in collect():
    with open(path, encoding="utf-8") as handle:
        lines = handle.readlines()

    for number, line in enumerate(lines, start=1):
        # 1 y 2 — anchos fijos.
        for match in fixed_w.finditer(line):
            value = int(match.group(1))
            if value <= NARROW:
                continue
            before = line[max(0, match.start() - 4) : match.start()]
            if responsive_prefix.search(before):
                continue  # solo aplica en pantallas anchas
            findings.append((path, number, "ancho-fijo", f"{match.group(0)} = {value}px > {NARROW}px"))

        # 3 — rejillas de columnas fijas.
        for match in grid_cols.finditer(line):
            before = line[max(0, match.start() - 4) : match.start()]
            if responsive_prefix.search(before):
                continue
            total = sum(int(px) for px in px_in_track.findall(match.group(1)))
            if total > NARROW:
                findings.append((path, number, "rejilla-fija", f"columnas suman {total}px > {NARROW}px"))

    # 4 — hijos de flex/grid con contenido desbordable y sin `min-w-0`.
    text = "".join(lines)
    if overflowable.search(text) and not has_min_w0.search(text):
        if re.search(r"className=\"[^\"]*(flex|grid)[^\"]*\"", text):
            findings.append((path, 0, "sin-min-w-0", "contiene tabla o scroll horizontal dentro de flex/grid sin min-w-0"))

by_kind = {}
for path, number, kind, detail in findings:
    by_kind.setdefault(kind, []).append((path, number, detail))

print(f"Ancho de referencia: {NARROW}px\n")
if not findings:
    print("Sin riesgos de desbordamiento horizontal.")
    sys.exit(0)

for kind in ("ancho-fijo", "rejilla-fija", "sin-min-w-0"):
    items = by_kind.get(kind, [])
    if not items:
        continue
    print(f"── {kind}: {len(items)}")
    for path, number, detail in sorted(items):
        where = f"{path}:{number}" if number else path
        print(f"   {where}\n      {detail}")
    print()

print(f"TOTAL: {len(findings)}")
