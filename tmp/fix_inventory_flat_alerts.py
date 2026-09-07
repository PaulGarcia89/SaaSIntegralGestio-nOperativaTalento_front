"""
Dos correcciones, y una de ellas es un error mío.

1. **El inventario seguía mostrando una sola entrada.** En el commit anterior
   escribí que «desaparece el submenú desplegable de inventario», y solo quité
   el reetiquetado del store. El filtro `isInventorySubmenuItem` seguía en la
   barra lateral escondiendo todo ítem de inventario que no fuera la raíz, y
   el submenú solo se desplegaba estando ya dentro. Resultado: la sección
   «Inventario de restaurante» enseñaba una entrada de 34, y la de activos una
   de 10.

   El submenú tenía sentido cuando los dos inventarios compartían la sección
   «Operación diaria» con otros treinta ítems y había que plegarlos. Ahora cada
   módulo TIENE su sección, que ya está plegada por defecto: plegar dentro de
   lo plegado escondía el módulo de quien lo contrató. Fuera el filtro, fuera
   el submenú y fuera `inventoryModuleRoots`.

   Las 34 pantallas de restaurante se siguen leyendo porque el área las separa:
   19 de operación, 14 de análisis y 1 de configuración.

2. **Alertas pasa a Administración.** Una sección con un único elemento que se
   llama igual que ella —«ALERTAS › Alertas»— no es una sección, es una fila
   con un envoltorio. Notificaciones es además una capacidad transversal, no un
   módulo que se opere.
"""

NAV = "src/lib/navigation.ts"
SHELL = "src/components/app-shell.tsx"


def edit(path, pairs):
    src = open(path, encoding="utf-8").read()
    original = src
    for old, new in pairs:
        count = src.count(old)
        assert count == 1, f"{path}: {count} apariciones de\n{old[:170]}"
        src = src.replace(old, new)
    assert src != original
    open(path, "w", encoding="utf-8").write(src)
    print("ok", path, len(pairs), "cambios")


# ── 1. La barra lateral deja de esconder el inventario ────────────────────
edit(
    SHELL,
    [
        (
            '''const inventoryModuleRoots = new Set(["/inventory/assets", "/inventory/restaurant"]);
''',
            "",
        ),
        (
            '''  const isInventorySubmenuItem = (item: SidebarNavigationItem) =>
    !inventoryModuleRoots.has(item.href) &&
    (item.module === "asset_inventory" || item.module === "restaurant_inventory");

''',
            "",
        ),
        (
            '''                      {/* Los elementos se calculan ANTES de rotular. El rótulo
                          salía de `group.items` y la lista de
                          `group.items.filter(...)`, así que un área cuyos
                          elementos se filtran enteros dejaba el encabezado
                          solo: es el «Inventario de restaurante» vacío que
                          aparecía bajo Administración. */}
                      {groups
                        .map((group) => ({
                          group: group.group,
                          items: group.items.filter((item) => !isInventorySubmenuItem(item)),
                          all: group.items,
                        }))
                        .filter((group) => group.items.length > 0)
                        .map((group, _index, visibleGroups) => (
                        <div key={group.group}>''',
            '''                      {/* Un área sin elementos no se rotula: el encabezado
                          salía de `group.items` y la lista de una versión
                          filtrada, así que un área cuyos elementos se filtraban
                          enteros dejaba el rótulo solo. */}
                      {groups
                        .filter((group) => group.items.length > 0)
                        .map((group, _index, visibleGroups) => (
                        <div key={group.group}>''',
        ),
        (
            '''                            {group.items
                              .map((item) => {
                                const active = item.href === activeHref;
                                const NavIcon = navigationIcons[item.icon];
                                const submenu = inventoryModuleRoots.has(item.href)
                                  ? group.items.filter(
                                      (candidate) =>
                                        candidate.module === item.module && isInventorySubmenuItem(candidate),
                                    )
                                  : [];
                                const submenuActive = submenu.some((candidate) => candidate.href === activeHref);

                                return (
                                  <li key={item.href}>
                                    <SidebarLink
                                      href={item.href}
                                      label={localizedNavLabel(item.label, t)}
                                      icon={NavIcon}
                                      active={active}
                                      onNavigate={onNavigate}
                                    />
                                    {/* El submenú de inventario solo se abre si
                                        estás dentro. Antes se desplegaba
                                        siempre: 28 enlaces permanentes. */}
                                    {submenu.length > 0 && (active || submenuActive) ? (
                                      <ul className="mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                                        {submenu.map((child) => (
                                          <li key={child.href}>
                                            <SidebarLink
                                              href={child.href}
                                              label={localizedNavLabel(child.label, t)}
                                              icon={navigationIcons[child.icon]}
                                              active={child.href === activeHref}
                                              onNavigate={onNavigate}
                                              dense
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                    ) : null}
                                  </li>
                                );
                              })}''',
            '''                            {/* Sin submenú: cada módulo ya es una sección
                                plegable, y plegar dentro de lo plegado
                                escondía el módulo de quien lo contrató. Las 34
                                pantallas de restaurante se leen porque el área
                                las separa en operación, análisis y ajustes. */}
                            {group.items.map((item) => (
                              <li key={item.href}>
                                <SidebarLink
                                  href={item.href}
                                  label={localizedNavLabel(item.label, t)}
                                  icon={navigationIcons[item.icon]}
                                  active={item.href === activeHref}
                                  onNavigate={onNavigate}
                                />
                              </li>
                            ))}''',
        ),
    ],
)

# ── 2. Alertas deja de ser una sección propia ─────────────────────────────
edit(
    NAV,
    [
        (
            '''  { id: "notifications", label: "Alertas", hint: "Lo que reclama tu atención" },\n''',
            "",
        ),
        (
            '''  | "notifications"\n''',
            "",
        ),
        (
            '''  if (item.module === "dashboard" || item.module === "profile") return "inicio";''',
            '''  if (item.module === "dashboard" || item.module === "profile") return "inicio";
  // Las alertas no son un módulo que se opere, son una capacidad transversal:
  // una sección con un único elemento llamado igual que ella —«Alertas ›
  // Alertas»— no es una sección, es una fila con un envoltorio.
  if (item.module === "notifications") return "administracion";''',
        ),
        (
            '''{ href: "/notifications", label: "Alertas", group: "Analítica",''',
            '''{ href: "/notifications", label: "Alertas", group: "Administración",''',
        ),
    ],
)
