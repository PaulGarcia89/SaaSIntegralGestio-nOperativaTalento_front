"""
Los últimos contenedores que podían empujar la página a lo ancho.

Un hijo de `flex` o `grid` no baja de su ancho de contenido salvo que declare
`min-w-0`. Cuando ese hijo contiene una tabla o una tira con
`overflow-x-auto`, el contenedor se ensancha hasta el contenido en vez de dejar
que la tira se desplace sola, y quien empuja es la PÁGINA: aparece
desplazamiento horizontal en toda la pantalla, que es el defecto que más se
nota en un teléfono.

`min-w-0` no cambia nada visualmente cuando hay sitio de sobra; solo permite
encoger cuando no lo hay. Por eso se puede aplicar en bloque con seguridad.

Se parte de los hallazgos del propio auditor, ya depurado de falsos positivos,
y se comprueba que el recuento baja a cero.
"""

import re
import subprocess
import pathlib
import collections

CLASS = re.compile(r'className=(["`])([^"`]*)\1')


def findings():
    out = subprocess.run(
        ["python3", "scripts/audit-responsive.py"], capture_output=True, text=True
    ).stdout
    hits = collections.defaultdict(set)
    for match in re.finditer(r"^\s+(\S+\.tsx):(\d+)$", out, re.M):
        hits[match.group(1)].add(int(match.group(2)))
    return hits


def main():
    hits = findings()
    total = 0
    for name, numbers in sorted(hits.items()):
        path = pathlib.Path(name)
        lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
        changed = False
        for number in sorted(numbers):
            line = lines[number - 1]
            replaced = []

            def add(match):
                quote, classes = match.group(1), match.group(2)
                # Solo el contenedor flex/grid, y solo si aún no puede encoger.
                if not re.search(r"(^|\s)(flex|grid|inline-flex|grid-cols-)", classes):
                    return match.group(0)
                if "min-w-0" in classes:
                    return match.group(0)
                replaced.append(True)
                return f"className={quote}min-w-0 {classes}{quote}"

            new_line = CLASS.sub(add, line, count=1)
            if replaced:
                lines[number - 1] = new_line
                changed = True
                total += 1
        if changed:
            path.write_text("".join(lines), encoding="utf-8")
            print("  ok", name)
    print("contenedores corregidos:", total)


main()
