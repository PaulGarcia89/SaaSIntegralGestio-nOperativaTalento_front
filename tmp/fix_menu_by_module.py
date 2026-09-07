"""
Una sección de menú por módulo.

Hasta ahora las secciones agrupaban por INTENCIÓN —«Operación diaria»,
«Supervisión», «Reportes y análisis»— y eso repartía cada módulo entre tres o
cuatro sitios. El inventario de restaurante, por ejemplo, tenía veinte
pantallas en «Operación diaria», trece en «Reportes» y una en
«Administración». Con la suscripción por módulos eso es justo lo contrario de
lo que hace falta: si una empresa contrata solo reclutamiento, sus pantallas
aparecían diluidas entre secciones medio vacías, y al no contratar un módulo
quedaban huecos repartidos por todo el menú en vez de desaparecer un bloque
entero.

Ahora la sección ES el módulo. Contratar un módulo añade su sección completa;
no contratarlo la quita entera. Es la misma regla que ya aplica el backend al
habilitar módulos, reflejada en el menú.

Dentro de cada módulo se conserva el área (`NavGroup`) como subdivisión: en el
inventario de restaurante separa las veinte pantallas de operación de las
trece de análisis, que con 34 entradas sigue haciendo falta. En un módulo con
un solo área el rótulo no se pinta, porque repetiría el nombre de la sección.

Dos consecuencias que simplifican:

· Desaparecen `supervisionRoutes` y `reportRoutes`, los dos conjuntos que
  movían pantallas fuera de su módulo. Eran la causa de que un módulo no
  cupiera en un sitio.
· Desaparece el submenú desplegable de inventario y su reetiquetado en el
  store. Existía para dar a los dos módulos de inventario un bloque propio
  dentro de «Operación diaria»; ahora cada uno TIENE su bloque propio. Era
  además el origen de los dos fallos de la captura: el área vacía y la
  configuración de restaurante inalcanzable.
"""

NAV = "src/lib/navigation.ts"
STORE = "src/store/app-store.tsx"
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


# ── 1. Las secciones pasan a ser los módulos ──────────────────────────────
edit(
    NAV,
    [
        (
            '''export type NavSection =
  | "inicio"
  | "operacion"
  | "supervision"
  | "reportes"
  | "administracion"
  | "plataforma";

export const navSections: ReadonlyArray<{ id: NavSection; label: string; hint: string }> = [
  { id: "inicio", label: "Inicio", hint: "Tu punto de partida" },
  { id: "operacion", label: "Operación diaria", hint: "Lo que se registra hoy" },
  { id: "supervision", label: "Supervisión", hint: "Lo que hay que vigilar" },
  { id: "reportes", label: "Reportes y análisis", hint: "Lo que se consulta" },
  { id: "administracion", label: "Administración", hint: "Cómo se configura la empresa" },
  { id: "plataforma", label: "Gobierno de plataforma", hint: "Alcance multiempresa" },
];''',
            '''export type NavSection =
  | "inicio"
  | "ats"
  | "onboarding"
  | "training"
  | "productivity"
  | "asset_inventory"
  | "restaurant_inventory"
  | "notifications"
  | "reportes"
  | "administracion"
  | "plataforma";

/**
 * Una sección por módulo.
 *
 * Contratar un módulo añade su sección entera; no contratarlo la quita entera.
 * Antes las secciones agrupaban por intención y repartían cada módulo entre
 * tres o cuatro sitios, así que al no contratar uno quedaban huecos por todo
 * el menú en vez de desaparecer un bloque.
 *
 * «Inicio» es la excepción deliberada: reúne el panel y el perfil, que no se
 * contratan —están siempre— y son una pantalla cada uno.
 */
export const navSections: ReadonlyArray<{ id: NavSection; label: string; hint: string }> = [
  { id: "inicio", label: "Inicio", hint: "Tu punto de partida" },
  { id: "ats", label: "Reclutamiento", hint: "Vacantes, candidatos y contratación" },
  { id: "onboarding", label: "Incorporación", hint: "Documentos y firmas de quien entra" },
  { id: "training", label: "Capacitación", hint: "Cursos, evaluaciones y certificados" },
  { id: "productivity", label: "Personas y productividad", hint: "Equipo, turnos e indicadores" },
  { id: "asset_inventory", label: "Inventario de activos", hint: "Equipos, entregas y devoluciones" },
  { id: "restaurant_inventory", label: "Inventario de restaurante", hint: "Ingredientes, recetas y consumo" },
  { id: "notifications", label: "Alertas", hint: "Lo que reclama tu atención" },
  { id: "reportes", label: "Reportes", hint: "Lo que se consulta y se exporta" },
  { id: "administracion", label: "Administración", hint: "Cómo se configura la empresa" },
  { id: "plataforma", label: "Gobierno de plataforma", hint: "Alcance multiempresa" },
];''',
        ),
        (
            '''  if (supervisionRoutes.has(item.href)) return "supervision";
  if (reportRoutes.has(item.href)) return "reportes";
  if (item.group === "Inicio") return "inicio";
  if (item.group === "Gobierno de plataforma") return "plataforma";
  if (item.group === "Administración") return "administracion";
  if (item.group === "Analítica") return "reportes";
  return "operacion";''',
            '''  // La sección es el módulo. Las dos excepciones son de audiencia, no de
  // intención: el módulo `admin` sirve a dos públicos distintos —la empresa y
  // la plataforma— y cada uno necesita su bloque.
  if (item.group === "Gobierno de plataforma") return "plataforma";
  if (item.module === "admin") return "administracion";
  if (item.module === "dashboard" || item.module === "profile") return "inicio";
  if (item.module === "reports") return "reportes";
  return item.module as NavSection;''',
        ),
    ],
)

# ── 2. El store deja de reetiquetar el inventario ─────────────────────────
edit(
    STORE,
    [
        (
            '''      }).allowed).map((item) => {
        // El reetiquetado agrupa el inventario OPERATIVO bajo su módulo. Un
        // ítem que ya pertenece a Administración —la configuración del
        // módulo— tiene que quedarse ahí: al moverlo, dejaba de estar en el
        // grupo de Administración, el filtro de submenú lo ocultaba por no
        // ser una raíz, y su raíz vive en otra sección, así que no aparecía
        // en ningún sitio.
        if (item.group === "Administración") return item;
        if (item.module === "asset_inventory") return { ...item, group: "Inventario de activos" as const, ...(item.href === "/inventory/assets" ? { label: "Inventario de activos" } : {}) };
        if (item.module === "restaurant_inventory") return { ...item, group: "Inventario de restaurante" as const, ...(item.href === "/inventory/restaurant" ? { label: "Inventario de restaurante" } : {}) };
        return item;
      });''',
            '''      }).allowed);
      // Antes, aquí se reetiquetaba todo ítem de inventario para darle un
      // bloque propio dentro de «Operación diaria». Ahora cada módulo ES una
      // sección, así que ese bloque ya existe: reetiquetar solo servía para
      // aplastar la separación entre operación y análisis dentro del módulo.''',
        ),
    ],
)

# ── 3. La barra lateral deja de tener submenú de inventario ───────────────
edit(
    SHELL,
    [
        (
            '''const sectionIcons: Record<NavSection, LucideIcon> = {
  inicio: Gauge,
  operacion: Compass,
  supervision: Eye,
  reportes: ChartNoAxesCombined,
  administracion: Settings,
  plataforma: ShieldCheck,
};''',
            '''const sectionIcons: Record<NavSection, LucideIcon> = {
  inicio: Gauge,
  ats: Briefcase,
  onboarding: FileSignature,
  training: GraduationCap,
  productivity: Users,
  asset_inventory: Boxes,
  restaurant_inventory: UtensilsCrossed,
  notifications: Bell,
  reportes: ChartNoAxesCombined,
  administracion: Settings,
  plataforma: ShieldCheck,
};''',
        ),
    ],
)
