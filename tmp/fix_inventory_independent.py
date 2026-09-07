"""
El inventario de restaurante deja de colgar del de activos.

En el menú ya eran dos secciones independientes, pero fuera del menú seguían
tratados como dos caras de una misma cosa:

1. **`/inventory` estaba declarada con `module: "asset_inventory"` y permiso
   `asset_inventory.view`.** Es la pantalla que elige entre los dos
   inventarios, así que una empresa que contrata SOLO restaurante recibía
   «este módulo no está habilitado» al abrirla —siendo falso: su inventario sí
   está habilitado, es el otro el que no—. La pantalla ya sabe resolver las
   cuatro combinaciones (ninguno, uno, el otro, los dos), así que la puerta
   sobra: se pasa a capacidad base y decide la pantalla, que es donde vive esa
   lógica.

2. **Pasar por un selector para elegir entre una sola opción.** Con un único
   inventario contratado, la pantalla mostraba una tarjeta y un clic de más.
   Ahora lleva directamente al módulo que la empresa tiene.

3. **`getInventoryModuleFromPath` era código muerto** —solo la referenciaba su
   propia prueba— y era el último sitio que codificaba «un inventario con dos
   sabores»: una lista de rutas que decidía cuál de los dos módulos gobierna
   una ruta. Fuera los dos.
"""

NAV = "src/lib/navigation.ts"
TEST = "src/lib/navigation.test.ts"
ENTRY = "src/components/inventory-entry.tsx"


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


# ── 1. /inventory deja de exigir el módulo de activos ─────────────────────
edit(
    NAV,
    [
        (
            '''{ href: "/inventory", label: "Inventario", group: "Operaciones", module: "asset_inventory", permission: "asset_inventory.view",''',
            '''// El selector entre los dos inventarios. No pertenece a ninguno de los dos
  // módulos: exigir `asset_inventory` hacía que una empresa con SOLO
  // restaurante recibiera «este módulo no está habilitado», que es falso. La
  // pantalla resuelve las cuatro combinaciones por su cuenta.
  { href: "/inventory", label: "Inventario", group: "Operaciones", module: "dashboard", permission: "dashboard.view",''',
        ),
    ],
)


def drop_dead_helper():
    """`getInventoryModuleFromPath` y su prueba: el último «un inventario con dos sabores»."""
    import re

    src = open(NAV, encoding="utf-8").read()
    match = re.search(r"\nexport function getInventoryModuleFromPath\(pathname: string\) \{.*?\n\}\n", src, re.S)
    assert match, "no se encontró el ayudante"
    open(NAV, "w", encoding="utf-8").write(src[: match.start()] + "\n" + src[match.end() :])

    test = open(TEST, encoding="utf-8").read()
    test = test.replace("  getInventoryModuleFromPath,\n", "")
    block = re.search(
        r"\n  it\([^\n]*\n(?:[^\n]*\n)*?[^\n]*getInventoryModuleFromPath[^\n]*\n(?:[^\n]*\n)*?  \}\);\n",
        test,
    )
    assert block, "no se encontró la prueba del ayudante"
    open(TEST, "w", encoding="utf-8").write(test[: block.start()] + "\n" + test[block.end() :])
    print("ok", NAV, "y", TEST, "— ayudante muerto retirado")


drop_dead_helper()

# ── 2. Con un solo inventario contratado no hay nada que elegir ───────────
edit(
    ENTRY,
    [
        (
            '''export function InventoryEntry() {
  const { hasModule, isBootstrapping, accessContextVerified, currentTenant } = useAppStore();
  const assetEnabled = hasModule("asset_inventory");
  const restaurantEnabled = hasModule("restaurant_inventory");
  const enabledCount = Number(assetEnabled) + Number(restaurantEnabled);''',
            '''export function InventoryEntry() {
  const router = useRouter();
  const { hasModule, isBootstrapping, accessContextVerified, currentTenant } = useAppStore();
  const assetEnabled = hasModule("asset_inventory");
  const restaurantEnabled = hasModule("restaurant_inventory");
  const enabledCount = Number(assetEnabled) + Number(restaurantEnabled);
  const ready = !isBootstrapping && accessContextVerified && Boolean(currentTenant.id);
  const only = enabledCount === 1 ? (assetEnabled ? "/inventory/assets" : "/inventory/restaurant") : null;

  // Elegir entre una sola opción no es elegir. Con un único inventario
  // contratado esta pantalla era una tarjeta y un clic de más.
  useEffect(() => {
    if (ready && only) router.replace(only);
  }, [only, ready, router]);''',
        ),
        (
            '''import Link from "next/link";
import { ArrowRight, Boxes, ChefHat, type LucideIcon } from "lucide-react";''',
            '''import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Boxes, ChefHat, type LucideIcon } from "lucide-react";''',
        ),
        (
            '''      {isBootstrapping || !accessContextVerified ? (
        <SkeletonRows rows={2} label="Cargando los módulos de inventario" />''',
            '''      {isBootstrapping || !accessContextVerified || only ? (
        <SkeletonRows rows={2} label="Cargando los módulos de inventario" />''',
        ),
        (
            ''' * · Cuando solo había un módulo activo se añadía un aviso —«el otro inventario
 *   no está habilitado»— que no lleva a ninguna decisión. Fuera.
 * · Solo el botón era clicable, no la tarjeta entera.''',
            ''' * · Cuando solo había un módulo activo se añadía un aviso —«el otro inventario
 *   no está habilitado»— que no lleva a ninguna decisión. Fuera.
 * · Solo el botón era clicable, no la tarjeta entera.
 * · Con un único inventario contratado seguía habiendo que elegir entre una
 *   sola opción. Ahora se entra directamente: los dos inventarios son módulos
 *   independientes, no dos variantes de uno.''',
        ),
    ],
)
