"""
Campos que hacían que iOS ampliara la página al enfocarlos.

Safari en iPhone hace zoom sobre cualquier campo cuyo tamaño de letra sea
menor de 16 px, y después NO vuelve atrás: la pantalla se queda desplazada y
más ancha que el visor. Quedan doce campos con `text-sm` (14 px) y sin un
`text-base` para móvil, repartidos por incorporación, firmas, el portal del
candidato y tres componentes sueltos.

El patrón que ya usa el resto del proyecto es `text-base sm:text-sm`: 16 px en
el teléfono, 14 px de ahí en adelante. La letra grande solo se paga donde
importa.

Aparte, tres controles se quedaban en `h-10` (40 px), por debajo del mínimo
táctil de 44 px que fija `--control-h-touch`.

El análisis no se hace con una expresión regular sobre `<input ...>`: un
`onChange={(e) => ...}` contiene un `>` que corta la etiqueta por la mitad y
deja fuera justo los campos con manejador, que son casi todos. Se recorre la
etiqueta saltando llaves y comillas.
"""

import re
import pathlib

ROOT = pathlib.Path("src")


def tag_end(text: str, start: int) -> int:
    """Fin real de una etiqueta JSX, saltando llaves y cadenas."""
    index, depth, quote = start, 0, None
    while index < len(text):
        char = text[index]
        if quote:
            if char == "\\":
                index += 2
                continue
            if char == quote:
                quote = None
            index += 1
            continue
        if char in "\"'`":
            quote = char
            index += 1
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
        elif char == ">" and depth == 0:
            return index
        index += 1
    return -1


def fix_classes(cls: str) -> str:
    updated = cls
    # 16 px en el teléfono, 14 px a partir de `sm`.
    if "text-sm" in updated and "text-base" not in updated:
        updated = re.sub(r"(^|\s)text-sm(\s|$)", r"\1text-base sm:text-sm\2", updated, count=1)
    # Altura táctil mínima.
    if re.search(r"(^|\s)h-(8|9|10)(\s|$)", updated) and "min-h" not in updated:
        updated = re.sub(r"(^|\s)h-(?:8|9|10)(\s|$)", r"\1min-h-[var(--control-h-touch)]\2", updated, count=1)
    return updated


def main():
    total = 0
    touched = []
    for path in sorted(ROOT.rglob("*.tsx")):
        text = path.read_text(encoding="utf-8")
        original = text
        offset = 0
        for match in list(re.finditer(r"<(input|textarea|select)\b", text, re.I)):
            start = match.start() + offset
            end = tag_end(text, match.end() + offset)
            if end < 0:
                continue
            tag = text[start:end]
            attr = re.search(r'className="([^"]*)"', tag)
            if not attr:
                continue
            cls = attr.group(1)
            fixed = fix_classes(cls)
            if fixed == cls:
                continue
            new_tag = tag[: attr.start(1)] + fixed + tag[attr.end(1) :]
            text = text[:start] + new_tag + text[end:]
            offset += len(new_tag) - len(tag)
            total += 1
        if text != original:
            path.write_text(text, encoding="utf-8")
            touched.append(str(path))
    for path in touched:
        print("ok", path)
    print("campos corregidos:", total)


main()
