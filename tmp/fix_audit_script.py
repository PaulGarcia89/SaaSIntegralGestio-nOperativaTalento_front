"""
El auditor de responsive dejaba de ser creíble.

Reportaba 23 hallazgos y casi todos eran suyos, no del código:

1. **Leía los comentarios.** El único hallazgo de «rejilla fija» apuntaba a
   una línea de `employees-workspace.tsx` que dice, dentro de un bloque de
   documentación, cuál era la rejilla que se SUSTITUYÓ. El auditor señalaba
   la descripción del defecto ya corregido.

2. **Confundía el desplazamiento vertical con el horizontal.** `overflowable`
   buscaba `overflow-x-auto`, pero la ventana de doce líneas alcanzaba
   cualquier `overflow-y-auto` cercano —el de casi todos los diálogos largos—,
   y con eso marcaba cinco secciones del diálogo de automatizaciones que no
   se desplazan a lo ancho en absoluto.

Una herramienta de medición que avisa de lo que no pasa se acaba ignorando, y
entonces deja de servir para lo que sí pasa. Es el mismo error que pintar de
rojo un estado desconocido.
"""

P = "scripts/audit-responsive.py"

PAIRS = [
    # ── Los comentarios no son código ─────────────────────────────────────
    (
        '''def collect():''',
        '''# Un comentario que describe un defecto ya corregido no es ese defecto. El
# auditor señalaba la línea de documentación que explica qué rejilla se
# sustituyó, en vez de una rejilla real.
block_comment = re.compile(r"/\\*.*?\\*/", re.S)
line_comment = re.compile(r"(?m)^\\s*(?://|\\*|/\\*|\\*/).*$")


def strip_comments(text):
    """Sustituye los comentarios por líneas en blanco, conservando la numeración."""
    without_blocks = block_comment.sub(lambda m: "\\n" * m.group(0).count("\\n"), text)
    return line_comment.sub("", without_blocks)


def collect():''',
    ),
    # ── Solo el desplazamiento HORIZONTAL desborda a lo ancho ─────────────
    (
        '''overflowable = re.compile(r"overflow-x-auto|<table|whitespace-nowrap")''',
        '''# `overflow-y-auto` no desborda a lo ancho: es el de casi todos los diálogos
# largos, y colarlo aquí marcaba cinco secciones que no se desplazan.
overflowable = re.compile(r"overflow-x-auto|overflow-x-scroll|(?<![-\\w])overflow-auto|<table|whitespace-nowrap")''',
    ),
    (
        '''    with open(path, encoding="utf-8") as handle:
        lines = handle.readlines()''',
        '''    with open(path, encoding="utf-8") as handle:
        lines = strip_comments(handle.read()).splitlines(keepends=True)''',
    ),
]


def main():
    src = open(P, encoding="utf-8").read()
    original = src
    for old, new in PAIRS:
        count = src.count(old)
        assert count == 1, f"{count} apariciones de:\n{old[:120]}"
        src = src.replace(old, new)
    assert src != original
    open(P, "w", encoding="utf-8").write(src)
    print("ok", P)


main()
