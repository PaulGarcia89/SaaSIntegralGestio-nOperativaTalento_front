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
# `overflow-y-auto` no desborda a lo ancho: es el de casi todos los diálogos
# largos, y colarlo aquí marcaba cinco secciones que no se desplazan.
overflowable = re.compile(r"overflow-x-auto|overflow-x-scroll|(?<![-\w])overflow-auto|<table|whitespace-nowrap")
has_min_w0 = re.compile(r"min-w-0")
# Prefijos responsive: `md:w-[400px]` solo aplica a partir de ese punto.
responsive_prefix = re.compile(r"(sm|md|lg|xl|2xl):$")


# Un comentario que describe un defecto ya corregido no es ese defecto. El
# auditor señalaba la línea de documentación que explica qué rejilla se
# sustituyó, en vez de una rejilla real.
block_comment = re.compile(r"/\*.*?\*/", re.S)
line_comment = re.compile(r"(?m)^\s*(?://|\*|/\*|\*/).*$")


def strip_comments(text):
    """Sustituye los comentarios por líneas en blanco, conservando la numeración."""
    without_blocks = block_comment.sub(lambda m: "\n" * m.group(0).count("\n"), text)
    return line_comment.sub("", without_blocks)


def collect():
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if name.endswith((".tsx", ".ts", ".css")):
                yield os.path.join(base, name)


findings = []

for path in collect():
    with open(path, encoding="utf-8") as handle:
        lines = strip_comments(handle.read()).splitlines(keepends=True)

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
    #
    # Se mira una ventana corta: que en el mismo archivo haya un flex por un
    # lado y una tabla por otro no prueba nada. Lo que desborda es una tabla
    # DENTRO de un contenedor flex o grid cercano que no declare `min-w-0`.
    WINDOW = 12
    for number, line in enumerate(lines, start=1):
        if not re.search(r"className=[\"{`][^\"}`]*(flex|grid-cols)", line):
            continue
        window = "".join(lines[number - 1 : number - 1 + WINDOW])
        if not overflowable.search(window):
            continue
        if has_min_w0.search(window):
            continue
        findings.append((path, number, "sin-min-w-0", "tabla o scroll horizontal dentro de flex/grid sin min-w-0"))

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
