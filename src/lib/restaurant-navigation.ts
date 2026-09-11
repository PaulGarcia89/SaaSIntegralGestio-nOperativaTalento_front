/* ==========================================================================
   ARQUITECTURA DE INFORMACIÓN DEL INVENTARIO DE RESTAURANTE
   ==========================================================================
   Una sola lista para la barra lateral y para la navegación dentro de la
   página. Ninguna ruta desaparece: las 38 siguen existiendo y siguen
   alcanzándose con los mismos permisos. Lo que cambia es cómo se llaman y en
   qué orden aparecen.

   Tres reglas, porque antes no había ninguna:

   1. UN NOMBRE POR PANTALLA. La misma pantalla se llamaba de dos maneras
      según dónde se mirase: el buscador (⌘K) y el menú móvil usaban el
      rótulo de `appNavigation` y la navegación interna usaba el de aquí.
      «Desperdicios» y «Registrar desperdicio» eran la misma pantalla;
      «Merma» era OTRA —el listado de pérdidas sin explicar—, así que buscar
      «merma» llevaba al informe y no a la operación. Ahora los dos rótulos
      son el mismo texto y las dos pantallas se llaman distinto.

   2. LA GRAMÁTICA DEL NOMBRE DICE QUÉ ES. Verbo si se hace algo («Recibir
      productos»), sustantivo si es un listado de cosas («Proveedores»),
      y la pregunta que responde si es un informe («Qué comprar»). Antes se
      mezclaban en el mismo grupo: «Recetas», «Registrar producción» y
      «Cocina central» convivían sin que el nombre dijera cuál abría un
      formulario y cuál una lista.

   3. EL ORDEN ES EL DE LA FRECUENCIA. «Comparar sucursales» —un gerente, una
      vez al mes— pesaba lo mismo que «Recibir productos» —un bodeguero, tres
      veces al día—. Los grupos van de lo que se toca cada turno a lo que se
      toca una vez al año, y dentro de cada grupo, igual.

   El grupo «Salidas y pérdidas» desaparece como tal: mezclaba dos cosas que
   no se hacen juntas —registrar una salida es la operación del turno; revisar
   pérdidas sin explicar es control posterior—. Las salidas se unen a las
   entradas, que es como se piensan («qué entró y qué salió hoy»), y el
   control se va con los conteos, que es de donde salen esas pérdidas.
   ========================================================================== */

export const restaurantSections: ReadonlyArray<{ key: string; label: string; items: ReadonlyArray<{ key: string; label: string; href: string }> }> = [
  {
    key: "summary",
    label: "Resumen",
    items: [
      { key: "dashboard", label: "Resumen", href: "/inventory/restaurant/dashboard" },
    ],
  },
  {
    // Lo que hay. Sustantivos, porque son listados.
    key: "inventory",
    label: "Inventario",
    items: [
      { key: "stock", label: "Existencias", href: "/inventory/restaurant/stock" },
      { key: "ingredients", label: "Ingredientes", href: "/inventory/restaurant/ingredients" },
      { key: "lots", label: "Lotes y vencimientos", href: "/inventory/restaurant/lots" },
      { key: "expiry-alerts", label: "Alertas de vencimiento", href: "/inventory/restaurant/expiry-alerts" },
      { key: "movements", label: "Historial de movimientos", href: "/inventory/restaurant/movements" },
    ],
  },
  {
    // Lo que se hace cada turno. Todos verbos, y en el orden del día: primero
    // entra la mercancía, luego se cocina, luego se tira lo que se perdió.
    key: "flows",
    label: "Entradas y salidas",
    items: [
      { key: "receipts", label: "Recibir productos", href: "/inventory/restaurant/receipts" },
      { key: "consumption", label: "Registrar consumo", href: "/inventory/restaurant/consumption" },
      { key: "production", label: "Registrar producción", href: "/inventory/restaurant/production" },
      { key: "waste", label: "Registrar merma", href: "/inventory/restaurant/waste" },
      { key: "transfers", label: "Transferir productos", href: "/inventory/restaurant/transfers" },
      { key: "sales-import", label: "Importar ventas", href: "/inventory/restaurant/sales-import" },
    ],
  },
  {
    // «Qué comprar» va primero a propósito: es la única de compras que se
    // consulta sin haber decidido nada todavía, y es la que abre el grupo para
    // quien solo tiene permiso de lectura.
    key: "purchases",
    label: "Compras",
    items: [
      { key: "purchase-suggestions", label: "Qué comprar", href: "/inventory/restaurant/purchase-suggestions" },
      { key: "purchase-orders", label: "Órdenes de compra", href: "/inventory/restaurant/purchase-orders" },
      { key: "invoices", label: "Cargar factura", href: "/inventory/restaurant/invoices" },
      { key: "suppliers", label: "Proveedores", href: "/inventory/restaurant/suppliers" },
      { key: "price-history", label: "Precios por proveedor", href: "/inventory/restaurant/price-history" },
      { key: "purchase-budget", label: "Presupuesto de compras", href: "/inventory/restaurant/purchase-budget" },
      { key: "forecast", label: "Planificar demanda", href: "/inventory/restaurant/forecast" },
    ],
  },
  {
    // «Registrar producción» se va con las demás salidas: es una operación del
    // turno, no el mantenimiento del recetario.
    key: "recipes",
    label: "Recetas",
    items: [
      { key: "recipes", label: "Recetas", href: "/inventory/restaurant/recipes" },
      { key: "commissary", label: "Cocina central", href: "/inventory/restaurant/commissary" },
    ],
  },
  {
    // Contar, y lo que el conteo descubre. «Pérdidas sin explicar» y
    // «Diferencias de consumo» salen de aquí: separadas de los conteos no se
    // entendía de dónde venían.
    key: "counts",
    label: "Conteos y control",
    items: [
      { key: "stock-counts", label: "Realizar conteo", href: "/inventory/restaurant/stock-counts" },
      { key: "count-schedules", label: "Programar conteos", href: "/inventory/restaurant/count-schedules" },
      { key: "adjustments", label: "Ajustes", href: "/inventory/restaurant/adjustments" },
      { key: "shrinkage", label: "Pérdidas sin explicar", href: "/inventory/restaurant/shrinkage" },
      { key: "variance", label: "Diferencias de consumo", href: "/inventory/restaurant/variance" },
    ],
  },
  {
    // Informes. Cada nombre dice la pregunta que responde, no la técnica que
    // usa por dentro: «Teórico vs real» y «Comparativo multiunidad» eran
    // jerga, no preguntas.
    key: "reports",
    label: "Reportes",
    items: [
      { key: "reports", label: "Reportes", href: "/inventory/restaurant/reports" },
      { key: "analytics", label: "Análisis", href: "/inventory/restaurant/analytics" },
      { key: "costs", label: "Costos de recetas", href: "/inventory/restaurant/costs" },
      { key: "recipe-margins", label: "Rentabilidad de recetas", href: "/inventory/restaurant/recipe-margins" },
      { key: "branch-costs", label: "Costos por sucursal", href: "/inventory/restaurant/branch-costs" },
      { key: "unit-comparison", label: "Comparar sucursales", href: "/inventory/restaurant/unit-comparison" },
      { key: "audit-log", label: "Historial de auditoría", href: "/inventory/restaurant/audit-log" },
      { key: "audit", label: "Reporte de auditoría", href: "/inventory/restaurant/audit" },
    ],
  },
  {
    key: "settings",
    label: "Configuración",
    items: [
      { key: "settings", label: "Configuración", href: "/inventory/restaurant/settings" },
      { key: "categories", label: "Categorías", href: "/inventory/restaurant/categories" },
      { key: "units", label: "Unidades y conversiones", href: "/inventory/restaurant/units" },
      { key: "warehouses", label: "Almacenes", href: "/inventory/restaurant/warehouses" },
    ],
  },
];

export function restaurantSectionForPath(path: string) {
  return restaurantSections.find(section => section.items.some(item => path === item.href || path.startsWith(`${item.href}/`)));
}

/**
 * El rótulo único de una ruta del módulo.
 *
 * `appNavigation` lo usa para no volver a tener dos nombres para la misma
 * pantalla: si una ruta está aquí, su nombre sale de aquí, y el buscador, el
 * menú móvil y la navegación interna dicen todos lo mismo.
 */
export const restaurantLabelByHref: ReadonlyMap<string, string> = new Map(
  restaurantSections.flatMap(section => section.items.map(item => [item.href, item.label] as const)),
);
