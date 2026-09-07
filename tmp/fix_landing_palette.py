"""
La portada pública deja de estar pintada en cian.

Era la mayor deuda de color que quedaba: 118 clases y hexadecimales crudos en
`landing-sections.tsx`, más los de la cabecera, la portada y las dos pantallas
de acceso. Todo en cian y pizarra (`#071b33 → #075e75`, `cyan-400`), una
paleta que no aparece en ninguna otra parte del producto. La página que ve un
cliente potencial y el producto que compra no parecían de la misma empresa, y
la marca elegida era grafito y ámbar.

Se sustituye clase por clase, sin tocar la estructura: es una operación
mecánica y verificable —el recuento tiene que quedar en cero—, no una
reescritura de 24 KB de JSX que no puedo comprobar visualmente desde aquí.

La portada se mantiene oscura en los dos temas, porque es una pieza de marca y
no una pantalla de trabajo: para eso están los tokens `--landing-*`, que usan
el mismo grafito que el resto de la interfaz.
"""

import re
import pathlib

FILES = [
    "src/components/landing/landing-sections.tsx",
    "src/components/landing/landing-header.tsx",
    "src/app/page.tsx",
    "src/app/(auth)/register-company/page.tsx",
    "src/app/(auth)/login/page.tsx",
]

# El orden importa: las claves más largas primero, para que `text-cyan-300/80`
# no lo pise `text-cyan-300`.
CLASSES = {
    # ── Fondo oscuro de marca ─────────────────────────────────────────────
    "text-white/85": "text-landing-ink/85",
    "text-white/75": "text-landing-ink/75",
    "text-white/65": "text-landing-ink/65",
    "text-white": "text-landing-ink",
    "bg-white/90": "bg-surface-1/90",
    "bg-white/85": "bg-surface-1/85",
    "bg-white/80": "bg-surface-1/80",
    "bg-white/70": "bg-surface-1/70",
    "bg-white/60": "bg-surface-1/60",
    "bg-white/15": "bg-landing-ink/15",
    "bg-white/10": "bg-landing-ink/10",
    "bg-white": "bg-surface-1",
    "border-white/90": "border-landing-ink/90",
    "border-white/25": "border-landing-ink/25",
    "border-white/20": "border-landing-ink/20",
    "border-white/15": "border-landing-ink/15",
    "border-white/10": "border-landing-ink/10",
    "bg-slate-950/98": "bg-landing-deep/98",
    "bg-slate-950/35": "bg-landing-deep/35",
    "bg-slate-950": "bg-landing-deep",
    "bg-slate-900": "bg-landing-mid",
    "bg-slate-50": "bg-surface-2",
    # Tinta sobre superficies claras o sobre el ámbar: no debe seguir al tema.
    "text-slate-950": "text-landing-deep",
    "text-slate-900": "text-ink-1",
    "text-slate-700": "text-ink-1",
    "text-slate-600": "text-ink-2",
    "text-slate-500": "text-ink-3",
    "text-slate-400": "text-ink-3",
    # Estas dos van sobre el fondo oscuro del héroe.
    "text-slate-300": "text-landing-ink/75",
    "text-slate-200": "text-landing-ink/85",
    # ── Acento: cian → ámbar ──────────────────────────────────────────────
    "bg-cyan-400/15": "bg-accent-fill/15",
    "bg-cyan-300/30": "bg-accent-fill/30",
    "bg-cyan-300/20": "bg-accent-fill/20",
    "bg-cyan-300/15": "bg-accent-fill/15",
    "bg-cyan-300/10": "bg-accent-fill/10",
    "bg-cyan-200/25": "bg-accent-fill/25",
    "bg-cyan-50/80": "bg-accent-fill/10",
    "bg-cyan-500": "bg-accent-line",
    "bg-cyan-400": "bg-accent-fill",
    "bg-cyan-300": "bg-accent-fill",
    "bg-cyan-100": "bg-accent-fill/15",
    "bg-cyan-50": "bg-accent-fill/10",
    "text-cyan-950": "text-accent-ink",
    "text-cyan-800": "text-accent-ink",
    "text-cyan-700": "text-accent-ink",
    "text-cyan-600": "text-accent-ink",
    "text-cyan-500": "text-accent-line",
    "text-cyan-300/80": "text-accent-fill/80",
    "text-cyan-300": "text-accent-fill",
    "text-cyan-200": "text-accent-fill",
    "text-cyan-100": "text-accent-fill",
    "text-cyan-50/85": "text-landing-ink/85",
    "border-cyan-300/40": "border-accent-line/40",
    "border-cyan-300/20": "border-accent-line/20",
    "border-cyan-300": "border-accent-line",
    "border-cyan-200/80": "border-accent-line/50",
    "border-cyan-200/15": "border-accent-line/15",
    "border-cyan-200": "border-accent-line/40",
    "border-cyan-100": "border-accent-line/25",
    "from-cyan-500/80": "from-accent-line/80",
    "from-cyan-400": "from-accent-fill",
    "via-cyan-200/80": "via-accent-fill/80",
    "via-cyan-400": "via-accent-fill",
    "to-cyan-500": "to-accent-line",
    "to-cyan-200": "to-accent-fill/60",
    "shadow-cyan-500/20": "shadow-accent-line/20",
    "shadow-cyan-400/20": "shadow-accent-fill/20",
    # ── Verdes y azules sueltos ───────────────────────────────────────────
    "text-emerald-800": "text-status-success",
    "text-emerald-600": "text-status-success",
    "text-emerald-200": "text-status-success",
    "text-emerald-100": "text-status-success",
    "bg-emerald-300/10": "bg-status-success/10",
    "bg-emerald-300": "bg-status-success",
    "bg-emerald-100": "bg-status-success/15",
    "border-emerald-200/15": "border-status-success/20",
    "text-amber-200": "text-accent-fill",
    # Puntos de leyenda de las etapas del embudo.
    "bg-teal-300": "bg-status-success",
    "bg-blue-400": "bg-status-info",
}

# Hexadecimales y rgba dentro de valores arbitrarios de Tailwind.
LITERALS = {
    # Degradado del héroe de la portada y del alta de empresa.
    "#071b33": "hsl(213_40%_10%)",
    "#0a3252": "hsl(213_34%_15%)",
    "#075e75": "hsl(206_30%_21%)",
    "#082f49": "hsl(213_40%_10%)",
    "#0f766e": "hsl(206_30%_21%)",
    "#f8fafc": "hsl(210_24%_96%)",
    # Tarjeta clara de la vista previa del producto.
    "#ffffff": "hsl(0_0%_100%)",
    "#f0fdfa": "hsl(38_60%_96%)",
    "#eff6ff": "hsl(38_70%_94%)",
    "#ecfeff": "hsl(38_60%_96%)",
    "#cffafe": "hsl(38_80%_88%)",
    # Fondos oscuros interiores.
    "#0e2b3a": "hsl(213_34%_15%)",
    "#0d2037": "hsl(213_38%_12%)",
    "#0b172a": "hsl(213_40%_10%)",
    "#063c5d": "hsl(206_30%_21%)",
    "#0e7490": "hsl(206_30%_28%)",
    # Puntos y trazos de acento.
    "#22d3ee": "hsl(38_94%_52%)",
    "#5eead4": "hsl(158_62%_54%)",
    "#60a5fa": "hsl(205_80%_55%)",
    # Halos y sombras.
    "rgba(34,211,238,.2)": "hsl(38_94%_52%_/_.2)",
    "rgba(34,211,238,.18)": "hsl(38_94%_52%_/_.18)",
    "rgba(34,211,238,.17)": "hsl(38_94%_52%_/_.17)",
    "rgba(34,211,238,.12)": "hsl(38_94%_52%_/_.12)",
    "rgba(8,145,178,.16)": "hsl(206_30%_28%_/_.16)",
    "rgba(8,145,178,.14)": "hsl(206_30%_28%_/_.14)",
    "rgba(59,130,246,.16)": "hsl(205_80%_55%_/_.16)",
    "rgba(110,231,183,.9)": "hsl(158_62%_54%_/_.9)",
    "rgba(14,165,183,0.22)": "hsl(38_94%_52%_/_0.22)",
    "rgba(15,23,42,.10)": "hsl(213_40%_10%_/_.10)",
    "rgba(15,23,42,.07)": "hsl(213_40%_10%_/_.07)",
    "rgba(15,23,42,0.97)": "hsl(213_40%_10%_/_0.97)",
    "rgba(20,33,61,0.95)": "hsl(213_34%_15%_/_0.95)",
    "rgba(1,12,28,.45)": "hsl(213_40%_10%_/_.45)",
    "rgba(255,255,255,.14)": "hsl(210_22%_96%_/_.14)",
    "rgba(255,255,255,.08)": "hsl(210_22%_96%_/_.08)",
    "rgba(255,255,255,.05)": "hsl(210_22%_96%_/_.05)",
}

PREFIXES = "(?:bg|text|border|from|to|via|ring|shadow|decoration|divide|outline|fill|stroke)"
RAW = re.compile(
    rf"(?<![\w-]){PREFIXES}-(?:cyan|slate|white|blue|emerald|amber|sky|teal|rose|gray|zinc|indigo|violet|purple)"
    r"(?:-[0-9]{2,3})?(?:/[0-9]{1,3})?(?![\w-])"
)


def main():
    total = 0
    for name in FILES:
        path = pathlib.Path(name)
        text = path.read_text(encoding="utf-8")
        original = text

        for old, new in sorted(CLASSES.items(), key=lambda item: -len(item[0])):
            # `(?<![\w-])` y `(?![\w-])` evitan que `bg-white` toque `bg-white/10`.
            pattern = re.compile(rf"(?<![\w-]){re.escape(old)}(?![\w-])")
            text, count = pattern.subn(new, text)
            total += count

        for old, new in sorted(LITERALS.items(), key=lambda item: -len(item[0])):
            count = text.count(old)
            text = text.replace(old, new)
            total += count

        if text != original:
            path.write_text(text, encoding="utf-8")
            print("ok", name)

    print("sustituciones:", total)

    # Comprobación: no puede quedar ni un color crudo en la superficie pública.
    pending = []
    for name in FILES:
        text = pathlib.Path(name).read_text(encoding="utf-8")
        for match in RAW.finditer(text):
            pending.append(f"{name}: {match.group(0)}")
        for literal in re.finditer(r"#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)", text):
            pending.append(f"{name}: {literal.group(0)}")
    if pending:
        print("\nQUEDAN CRUDOS:")
        for item in pending:
            print("  ", item)
    else:
        print("sin colores crudos en la superficie pública")


main()
