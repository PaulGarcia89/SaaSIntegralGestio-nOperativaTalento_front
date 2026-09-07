"""
Lo que se ve en la captura del iPhone 14, por orden de causa.

1. **`overflow-wrap: anywhere` en `p, li, dd, dt, label` y en los titulares.**
   Es la causa raíz de que «SuperiorTech · USA» salga apilado una letra por
   línea. `anywhere` no solo parte la palabra donde sea: además hace que el
   ancho MÍNIMO de contenido del elemento sea cero, así que cualquier
   contenedor flex o grid puede aplastarlo hasta dejarlo en nada, y entonces
   el texto se apila carácter a carácter. `break-word` parte igual las
   palabras que de verdad no caben, pero NO toca el ancho mínimo, así que el
   contenedor sigue reservando sitio.

2. **La miga de pan no se podía encoger.** `AppBreadcrumb` es un flex sin
   `min-w-0` ni truncado, así que a 390 px «Resumen administrativo ›
   Configuración de empresa» empuja la fila de la cabecera y deja al nombre de
   la empresa sin espacio. En un teléfono la miga además sobra: el título de
   la página está tres centímetros más abajo y dice lo mismo. Se oculta hasta
   `sm` y a partir de ahí se trunca.

3. **`Metric` pintaba en monoespaciada también las palabras.** La cifra en
   monoespaciada con `tabular-figures` está bien —es lo que alinea las
   columnas de números—, pero «Activa» y «Empresarial» no son cifras: salían
   en monoespaciada, con el cero barrado del mismo tipo, y «Empresarial» se
   partía a mitad de palabra. Ahora la monoespaciada se aplica solo cuando el
   valor es una cifra.

4. **Siete controles fijos en la cabecera a 390 px.** Menú, buscar, idioma,
   tema, notificaciones y avatar no dejaban ancho para el contexto. El
   selector de idioma y el de tema pasan al menú de usuario en móvil, que es
   donde se cambian una vez cada mucho.
"""

import re

CSS = "src/app/globals.css"
SHELL = "src/components/app-shell.tsx"
BREADCRUMB = "src/components/breadcrumb.tsx"
LAYOUT = "src/components/system/layout.tsx"


def edit(path, pairs):
    src = open(path, encoding="utf-8").read()
    original = src
    for old, new in pairs:
        count = src.count(old)
        assert count == 1, f"{path}: {count} apariciones de\n{old[:160]}"
        src = src.replace(old, new)
    assert src != original
    open(path, "w", encoding="utf-8").write(src)
    print("ok", path, len(pairs), "cambios")


# ── 1. La regla global que aplastaba el texto ─────────────────────────────
edit(
    CSS,
    [
        (
            """h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display-family), sans-serif;
  font-weight: 600;
  letter-spacing: -0.021em;
  overflow-wrap: anywhere;
  text-wrap: balance;
  color: hsl(var(--ink-1));
}""",
            """h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display-family), sans-serif;
  font-weight: 600;
  letter-spacing: -0.021em;
  /* `anywhere` no solo parte la palabra donde sea: pone a cero el ancho
     mínimo de contenido, así que un contenedor flex o grid puede aplastar el
     elemento hasta dejarlo en nada y el texto acaba apilado una letra por
     línea. `break-word` parte lo que de verdad no cabe y respeta el mínimo. */
  overflow-wrap: break-word;
  text-wrap: balance;
  color: hsl(var(--ink-1));
}""",
        ),
        (
            """p, li, dd, dt, label, figcaption {
  overflow-wrap: anywhere;
  text-align: start;
  text-wrap: pretty;
}""",
            """p, li, dd, dt, label, figcaption {
  /* Ver la nota de los titulares: `anywhere` era la causa de que el nombre de
     la empresa saliera apilado letra a letra en la cabecera del teléfono. */
  overflow-wrap: break-word;
  text-align: start;
  text-wrap: pretty;
}""",
        ),
    ],
)

# ── 2. La miga de pan ─────────────────────────────────────────────────────
edit(
    BREADCRUMB,
    [
        (
            '''    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">''',
            '''    // En un teléfono la miga sobra —el título de la página dice lo mismo unos
    // centímetros más abajo— y, al ser un flex sin `min-w-0`, ensanchaba la
    // cabecera hasta dejar al nombre de la empresa sin sitio.
    <nav
      aria-label="Breadcrumb"
      className="hidden min-w-0 items-center gap-1 overflow-hidden text-xs text-muted-foreground sm:flex"
    >''',
        ),
        (
            '''        <span key={crumb.href ?? crumb.label} className="flex items-center gap-1">''',
            '''        <span key={crumb.href ?? crumb.label} className="flex min-w-0 items-center gap-1">''',
        ),
        (
            '''            <Link href={crumb.href} className={cn("transition hover:text-foreground")}>
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{crumb.label}</span>''',
            '''            <Link href={crumb.href} className={cn("truncate transition hover:text-foreground")}>
              {crumb.label}
            </Link>
          ) : (
            <span className="truncate font-medium text-foreground">{crumb.label}</span>''',
        ),
    ],
)

# ── 3. La cifra en monoespaciada, las palabras no ─────────────────────────
edit(
    LAYOUT,
    [
        (
            '''      <p className={cn("font-mono text-2xl font-semibold tabular-figures", valueTone)}>{value}</p>''',
            '''      {/* La monoespaciada con `tabular-figures` alinea columnas de cifras; en
          una palabra solo la afea y, con el cero barrado, la hace parecer un
          dato técnico. «Activa» y «Empresarial» no son cifras. */}
      <p
        className={cn(
          "text-2xl font-semibold",
          /^[\\d\\s.,%+\\-/$€£¥]+$/.test(value) ? "font-mono tabular-figures" : "hyphens-auto",
          valueTone,
        )}
        lang="es"
      >
        {value}
      </p>''',
        ),
    ],
)

# ── 4. Menos controles fijos en la cabecera del teléfono ──────────────────
edit(
    SHELL,
    [
        (
            '''              <LanguageSelector compact />
              <DensityToggle className="hidden sm:inline-flex" />
              <ThemeToggle />''',
            '''              {/* Idioma y tema se cambian una vez cada mucho: en un teléfono
                  ocupaban ancho fijo que le hacía falta al contexto, y viven
                  en el menú de usuario. */}
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <LanguageSelector compact />
                <DensityToggle />
                <ThemeToggle />
              </div>''',
        ),
    ],
)
