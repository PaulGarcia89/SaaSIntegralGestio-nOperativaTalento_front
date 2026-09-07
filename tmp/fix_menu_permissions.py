"""
Menú y permisos: cuatro defectos, todos de acceso, no de estilo.

1. **Dieciocho permisos de inventario de restaurante existían en el TIPO
   `PermissionKey` y en el backend, pero no en el array `PERMISSION_KEYS`.**
   La matriz de roles recorre el array, así que esos permisos no se podían
   conceder desde ninguna parte del producto. Once entradas del menú los
   exigen —caducidades, conteos programados, varianza, mermas, auditoría,
   previsión, costes por sucursal, márgenes, comparativo entre unidades,
   comisariato y presupuesto de compras—, de modo que esas once pantallas
   eran inalcanzables para cualquier persona de una empresa. Solo las veía
   `admin_saas`, que se salta `can()` por rol.

2. **Tres entradas del menú pedían un permiso y la pantalla comprobaba otro.**
   `/admin/users` aparecía con `users.view` pero la pantalla exige
   `admin.users`; `/admin/roles`, `roles.view` frente a `admin.roles`;
   `/admin/audit`, `admin.view` frente a `audit.view`. Quien tuviera el
   primero y no el segundo veía la entrada en el menú y se topaba con el
   bloqueo al entrar. El menú debe prometer exactamente lo que la pantalla
   concede.

3. **El menú pintaba el rótulo de un área vacía.** Es lo que se ve en la
   captura: bajo «Administración» aparece «INVENTARIO DE RESTAURANTE» sin
   nada debajo. El rótulo se decidía sobre `group.items` y los elementos se
   pintaban sobre `group.items.filter(...)`: si el filtro se los llevaba
   todos, quedaba el encabezado solo.

4. **`/inventory/restaurant/settings` era inalcanzable.** El store reetiqueta
   como «Inventario de restaurante» TODO ítem de ese módulo, incluida la
   configuración, que pertenece al área de Administración. Al reetiquetarla
   dejaba de estar en el grupo de Administración; al no ser una raíz, el
   filtro de submenú la ocultaba; y como su raíz vive en otra sección, tampoco
   aparecía colgando de ella. La pantalla existía y no se podía abrir desde el
   menú.
"""

CONTRACTS = "src/lib/contracts.ts"
NAV = "src/lib/navigation.ts"
STORE = "src/store/app-store.tsx"
SHELL = "src/components/app-shell.tsx"

# Códigos que el backend concede y el producto no podía asignar.
MISSING = [
    "restaurant_inventory.adjustments.create",
    "restaurant_inventory.audit.read",
    "restaurant_inventory.budgets.manage",
    "restaurant_inventory.commercial.view",
    "restaurant_inventory.commissary.manage",
    "restaurant_inventory.counts.approve",
    "restaurant_inventory.counts.schedule",
    "restaurant_inventory.expiry_alerts.view",
    "restaurant_inventory.operations.confirm",
    "restaurant_inventory.operations.create",
    "restaurant_inventory.receipts.confirm",
    "restaurant_inventory.receipts.create",
    "restaurant_inventory.recipes.manage",
    "restaurant_inventory.settings.manage",
    "restaurant_inventory.shrinkage.view",
    "restaurant_inventory.transfers.manage",
    "restaurant_inventory.variance.view",
]


def edit(path, pairs):
    src = open(path, encoding="utf-8").read()
    original = src
    for old, new in pairs:
        count = src.count(old)
        assert count == 1, f"{path}: {count} apariciones de\n{old[:150]}"
        src = src.replace(old, new)
    assert src != original
    open(path, "w", encoding="utf-8").write(src)
    print("ok", path, len(pairs), "cambios")


# ── 1. Los permisos que faltaban en la matriz ─────────────────────────────
block = "".join(f'  "{key}",\n' for key in MISSING)
edit(
    CONTRACTS,
    [
        (
            '''  "platform.integrations.manage",
] as const satisfies readonly PermissionKey[];''',
            '''  "platform.integrations.manage",
  // Estos diecisiete existían en el tipo `PermissionKey` y los concede el
  // backend, pero faltaban aquí. La matriz de roles recorre ESTE array, así
  // que no se podían asignar desde ninguna parte del producto y las once
  // pantallas de inventario que los exigen eran inalcanzables para cualquier
  // persona de una empresa.
''' + block + '''] as const satisfies readonly PermissionKey[];''',
        )
    ],
)

# ── 2. El menú promete lo que la pantalla concede ─────────────────────────
edit(
    NAV,
    [
        (
            '''{ href: "/admin/users", label: "Usuarios", group: "Administración", module: "admin", permission: "users.view"''',
            '''{ href: "/admin/users", label: "Usuarios", group: "Administración", module: "admin", permission: "admin.users"''',
        ),
        (
            '''{ href: "/admin/roles", label: "Roles y permisos", group: "Administración", module: "admin", permission: "roles.view"''',
            '''{ href: "/admin/roles", label: "Roles y permisos", group: "Administración", module: "admin", permission: "admin.roles"''',
        ),
        (
            '''{ href: "/admin/audit", label: "Auditoría", group: "Gobierno de plataforma", module: "admin", permission: "admin.view"''',
            '''{ href: "/admin/audit", label: "Auditoría", group: "Gobierno de plataforma", module: "admin", permission: "audit.view"''',
        ),
    ],
)

# ── 4. La configuración de restaurante se queda en Administración ─────────
edit(
    STORE,
    [
        (
            '''        if (item.module === "asset_inventory") return { ...item, group: "Inventario de activos" as const,''',
            '''        // El reetiquetado agrupa el inventario OPERATIVO bajo su módulo. Un
        // ítem que ya pertenece a Administración —la configuración del
        // módulo— tiene que quedarse ahí: al moverlo, dejaba de estar en el
        // grupo de Administración, el filtro de submenú lo ocultaba por no
        // ser una raíz, y su raíz vive en otra sección, así que no aparecía
        // en ningún sitio.
        if (item.group === "Administración") return item;
        if (item.module === "asset_inventory") return { ...item, group: "Inventario de activos" as const,''',
        ),
    ],
)

# ── 3. Un área sin elementos visibles no se rotula ────────────────────────
edit(
    SHELL,
    [
        (
            '''                      {groups.map((group) => (
                        <div key={group.group}>
                          {/* El área solo se rotula si la sección tiene más de
                              una: con una sola, el rótulo repite la sección. */}
                          {groups.length > 1 ? (''',
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
                        <div key={group.group}>
                          {/* El área solo se rotula si la sección tiene más de
                              una: con una sola, el rótulo repite la sección. */}
                          {visibleGroups.length > 1 ? (''',
        ),
        (
            '''                          <ul className="space-y-0.5">
                            {group.items
                              .filter((item) => !isInventorySubmenuItem(item))
                              .map((item) => {''',
            '''                          <ul className="space-y-0.5">
                            {group.items
                              .map((item) => {''',
        ),
    ],
)
