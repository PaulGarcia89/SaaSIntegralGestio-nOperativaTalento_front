"""
ATS: los mensajes del servidor dejan de llegar en crudo.

En las ocho pantallas del módulo no había una sola llamada a
`getApiErrorMessage`. Todas hacían `error instanceof Error ? error.message :
"algo genérico"`, lo que significa que cuando el servidor responde 403 se le
muestra a quien recluta el texto interno de NestJS —normalmente en inglés y a
veces un array de validación serializado—, y cuando responde 500 se muestra el
mensaje de la excepción.

`getApiErrorMessage` traduce el código de estado a una frase en español
(«No tienes permiso para realizar esta acción», «Existe un conflicto con la
información actual…») y conserva el detalle del servidor donde sí aporta
—400, 409, 422—.

La transformación se hace con un pequeño analizador en vez de una expresión
regular porque el «si no» del ternario puede ser una llamada con paréntesis y
comillas anidadas: `t("p360.checkTemplates")`.
"""

import re
from pathlib import Path

ROOT = Path("src/app/(app)/ats")
IMPORT_LINE = 'import { getApiErrorMessage } from "@/lib/backend";\n'


def find_alternative_end(text: str, start: int) -> int:
    """Final del «si no» de un ternario: donde se cierra el contexto que lo rodea."""
    depth = 0
    index = start
    quote = None
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
        if char in "([{":
            depth += 1
        elif char in ")]}":
            if depth == 0:
                return index
            depth -= 1
        elif char == "," and depth == 0:
            return index
        index += 1
    raise AssertionError("no se encontró el final del ternario")


def rewrite(text: str) -> tuple[str, int]:
    changes = 0
    pattern = re.compile(r"([A-Za-z_$][\w$.]*)\s+instanceof\s+Error\s*\?\s*\1\.message\s*:\s*")
    while True:
        match = pattern.search(text)
        if not match:
            break
        subject = match.group(1)
        end = find_alternative_end(text, match.end())
        alternative = text[match.end() : end].strip()
        text = f"{text[: match.start()]}getApiErrorMessage({subject}, {alternative}){text[end:]}"
        changes += 1
    return text, changes


def add_import(text: str) -> str:
    if "getApiErrorMessage" not in text:
        return text
    if re.search(r"getApiErrorMessage[^\n]*from \"@/lib/backend\"", text):
        return text
    # Si ya se importa algo del backend, se añade ahí en vez de duplicar la línea.
    block = re.search(r"import \{([^}]*)\} from \"@/lib/backend\";", text)
    if block:
        inner = block.group(1)
        if "getApiErrorMessage" in inner:
            return text
        separator = ",\n  " if "\n" in inner else ", "
        replacement = f"import {{{inner.rstrip()}{separator}getApiErrorMessage }} from \"@/lib/backend\";"
        if "\n" in inner:
            replacement = f"import {{{inner.rstrip().rstrip(',')},\n  getApiErrorMessage,\n}} from \"@/lib/backend\";"
        return text[: block.start()] + replacement + text[block.end() :]
    anchor = text.index("\n", text.index("import "))
    return text[: anchor + 1] + IMPORT_LINE + text[anchor + 1 :]


def main():
    total = 0
    for path in sorted(ROOT.rglob("page.tsx")):
        original = path.read_text(encoding="utf-8")
        rewritten, changes = rewrite(original)
        if not changes:
            continue
        rewritten = add_import(rewritten)
        assert "getApiErrorMessage" in rewritten
        path.write_text(rewritten, encoding="utf-8")
        print("ok", path, changes, "mensajes")
        total += changes
    print("total:", total)


main()
