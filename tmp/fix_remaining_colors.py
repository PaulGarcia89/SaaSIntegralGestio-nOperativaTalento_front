"""
Último barrido de color crudo del producto.

Dos cosas a la vez:

1. Los tokens `--landing-*` pasan a llamarse `--surface-dark-*`. Se crearon
   para la portada, pero los paneles siempre oscuros aparecen también en
   productividad, en la preincorporación del candidato y en el armazón. Un
   token llamado «landing» usado en el panel de productividad es un nombre que
   miente, y los nombres que mienten se copian.

2. Se sustituyen los 94 colores crudos que quedaban en 21 archivos. Los casos
   son tres:

   · Paneles siempre oscuros (`bg-slate-950`, `text-white`, `bg-white/10`):
     pasan a los tokens oscuros.
   · Avisos y estados (`bg-amber-100`, `bg-emerald-50`, `text-emerald-800`):
     pasan a los tonos de estado, que sí responden al tema. El par ámbar de
     `use-unsaved-changes` e `integration-state` estaba duplicado literalmente
     en los dos archivos.
   · Un degradado morado en el avatar del perfil (`from-violet-400
     to-indigo-500`). El morado estaba prohibido explícitamente.

No se tocan los valores de MARCA DEL INQUILINO —los `#0f766e` de
`portal-theme` y `career-portal-settings`—: son datos por defecto de la
configuración del portal de empleo de cada empresa, no el estilo del producto.
Sí se corrige el `#0EA5B7` del store, que era el color de reserva del acento
cuando el formulario de empresas ya usaba otro: dos valores por defecto
distintos para el mismo dato.
"""

import re
import pathlib

ROOT = pathlib.Path("src")

# ── 1. Renombrado de tokens ───────────────────────────────────────────────
RENAMES = {
    "--landing-deep": "--surface-dark-1",
    "--landing-mid": "--surface-dark-2",
    "--landing-far": "--surface-dark-3",
    "--landing-ink": "--surface-dark-ink",
    "--color-landing-deep": "--color-surface-dark-1",
    "--color-landing-mid": "--color-surface-dark-2",
    "--color-landing-far": "--color-surface-dark-3",
    "--color-landing-ink": "--color-surface-dark-ink",
    "landing-deep": "surface-dark-1",
    "landing-mid": "surface-dark-2",
    "landing-far": "surface-dark-3",
    "landing-ink": "surface-dark-ink",
}

# ── 2. Colores crudos restantes ───────────────────────────────────────────
CLASSES = {
    # Paneles siempre oscuros.
    "bg-slate-950": "bg-surface-dark-1",
    "text-white/80": "text-surface-dark-ink/80",
    "text-white/70": "text-surface-dark-ink/70",
    "text-white/60": "text-surface-dark-ink/60",
    "text-white": "text-surface-dark-ink",
    "bg-white/20": "bg-surface-dark-ink/20",
    "bg-white/15": "bg-surface-dark-ink/15",
    "bg-white/10": "bg-surface-dark-ink/10",
    "bg-white/80": "bg-surface-1/80",
    "border-white/15": "border-surface-dark-ink/15",
    "border-white/10": "border-surface-dark-ink/10",
    # Acento sobre oscuro.
    "bg-cyan-300": "bg-accent-fill",
    "text-cyan-200": "text-accent-fill",
    # Estados.
    "bg-emerald-500/15": "bg-status-success/15",
    "border-emerald-400/40": "border-status-success/40",
    "bg-emerald-400": "bg-status-success",
    "text-emerald-100": "text-status-success",
    "bg-emerald-100": "bg-status-success/15",
    "bg-emerald-50": "bg-status-success/10",
    "text-emerald-900": "text-status-success",
    "text-emerald-800": "text-status-success",
    "text-emerald-700": "text-status-success",
    "text-emerald-600": "text-status-success",
    "bg-amber-100": "bg-status-warning/15",
    "border-amber-300": "border-status-warning/40",
    "text-amber-950": "text-status-warning",
    "text-amber-800": "text-status-warning",
    "text-amber-600": "text-status-warning",
    "to-cyan-100/50": "to-accent-fill/20",
    # El morado del avatar del perfil.
    "from-violet-400": "from-accent-fill",
    "to-indigo-500": "to-accent-line",
}

LITERALS = {
    "rgba(15,23,42,0.28)": "hsl(213_40%_10%_/_0.28)",
    "#2563eb": "hsl(205_80%_45%)",
}

PREFIXES = "(?:bg|text|border|from|to|via|ring|shadow|decoration|divide|outline|fill|stroke)"
PALETTE = ("(?:cyan|slate|white|blue|emerald|amber|sky|teal|rose|gray|zinc|indigo|violet|"
           "purple|red|green|orange|yellow|lime|pink|fuchsia|stone|neutral)")
RAW = re.compile(rf"(?<![\w-]){PREFIXES}-{PALETTE}(?:-[0-9]{{2,3}})?(?:/[0-9]{{1,3}})?(?![\w-])")
HEX = re.compile(r"#[0-9a-fA-F]{6}\b|rgba?\([^)]*\)")

# Archivos donde un hexadecimal es un DATO (marca del inquilino), no estilo.
DATOS = {
    "src/components/portal-theme.tsx",
    "src/components/career-portal-settings.tsx",
    "src/app/(app)/admin/tenants/page.tsx",
    "src/app/layout.tsx",
    # El acento por defecto de una empresa nueva: lo sobreescribe cada
    # inquilino desde su configuración, así que es un dato, no un estilo.
    "src/store/app-store.tsx",
}


def strip_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"(?m)^\s*//.*$", "", text)


def main():
    # 1. Renombrado, en CSS y en TSX.
    renamed = 0
    for path in list(ROOT.rglob("*.tsx")) + [pathlib.Path("src/app/globals.css")]:
        text = path.read_text(encoding="utf-8")
        original = text
        for old, new in sorted(RENAMES.items(), key=lambda item: -len(item[0])):
            pattern = re.compile(rf"(?<![\w-]){re.escape(old)}(?![\w-])")
            text, count = pattern.subn(new, text)
            renamed += count
        if text != original:
            path.write_text(text, encoding="utf-8")
    print("tokens renombrados:", renamed)

    # 2. Sustitución de color crudo.
    total = 0
    for path in sorted(ROOT.rglob("*.tsx")):
        if "/components/ui/" in str(path):
            continue
        text = path.read_text(encoding="utf-8")
        original = text
        for old, new in sorted(CLASSES.items(), key=lambda item: -len(item[0])):
            pattern = re.compile(rf"(?<![\w-]){re.escape(old)}(?![\w-])")
            text, count = pattern.subn(new, text)
            total += count
        if str(path) not in DATOS:
            for old, new in LITERALS.items():
                total += text.count(old)
                text = text.replace(old, new)
        if text != original:
            path.write_text(text, encoding="utf-8")
            print("  ok", path)
    print("colores sustituidos:", total)

    # 3. Comprobación.
    pending = []
    for path in sorted(ROOT.rglob("*.tsx")):
        if "/components/ui/" in str(path) or str(path) in DATOS:
            continue
        body = strip_comments(path.read_text(encoding="utf-8"))
        for match in list(RAW.finditer(body)) + list(HEX.finditer(body)):
            pending.append(f"{path}: {match.group(0)}")
    print("\nquedan:", len(pending))
    for item in pending:
        print("  ", item)


main()
