// Shared information architecture for sidebar and in-page navigation.
export const restaurantSections: ReadonlyArray<{ key: string; label: string; items: ReadonlyArray<{ key: string; label: string; href: string }> }> = [
  {
    "key": "summary",
    "label": "Resumen",
    "items": [
      {
        "key": "dashboard",
        "label": "Resumen",
        "href": "/inventory/restaurant/dashboard"
      }
    ]
  },
  {
    "key": "inventory",
    "label": "Inventario",
    "items": [
      {
        "key": "stock",
        "label": "Existencias",
        "href": "/inventory/restaurant/stock"
      },
      {
        "key": "ingredients",
        "label": "Ingredientes",
        "href": "/inventory/restaurant/ingredients"
      },
      {
        "key": "lots",
        "label": "Lotes y vencimientos",
        "href": "/inventory/restaurant/lots"
      },
      {
        "key": "expiry-alerts",
        "label": "Alertas de vencimiento",
        "href": "/inventory/restaurant/expiry-alerts"
      },
      {
        "key": "transfers",
        "label": "Transferencias",
        "href": "/inventory/restaurant/transfers"
      },
      {
        "key": "movements",
        "label": "Historial de movimientos",
        "href": "/inventory/restaurant/movements"
      }
    ]
  },
  {
    "key": "purchases",
    "label": "Compras y recepción",
    "items": [
      {
        "key": "purchase-orders",
        "label": "Órdenes de compra",
        "href": "/inventory/restaurant/purchase-orders"
      },
      {
        "key": "receipts",
        "label": "Recibir productos",
        "href": "/inventory/restaurant/receipts"
      },
      {
        "key": "purchase-suggestions",
        "label": "Qué comprar",
        "href": "/inventory/restaurant/purchase-suggestions"
      },
      {
        "key": "invoices",
        "label": "Cargar factura",
        "href": "/inventory/restaurant/invoices"
      },
      {
        "key": "suppliers",
        "label": "Proveedores",
        "href": "/inventory/restaurant/suppliers"
      },
      {
        "key": "price-history",
        "label": "Precios por proveedor",
        "href": "/inventory/restaurant/price-history"
      },
      {
        "key": "purchase-budget",
        "label": "Presupuesto de compras",
        "href": "/inventory/restaurant/purchase-budget"
      },
      {
        "key": "forecast",
        "label": "Planificar demanda",
        "href": "/inventory/restaurant/forecast"
      }
    ]
  },
  {
    "key": "recipes",
    "label": "Recetas y producción",
    "items": [
      {
        "key": "recipes",
        "label": "Recetas",
        "href": "/inventory/restaurant/recipes"
      },
      {
        "key": "production",
        "label": "Registrar producción",
        "href": "/inventory/restaurant/production"
      },
      {
        "key": "commissary",
        "label": "Cocina central",
        "href": "/inventory/restaurant/commissary"
      }
    ]
  },
  {
    "key": "outflows",
    "label": "Salidas y pérdidas",
    "items": [
      {
        "key": "consumption",
        "label": "Registrar consumo",
        "href": "/inventory/restaurant/consumption"
      },
      {
        "key": "sales-import",
        "label": "Importar ventas",
        "href": "/inventory/restaurant/sales-import"
      },
      {
        "key": "waste",
        "label": "Registrar desperdicio",
        "href": "/inventory/restaurant/waste"
      },
      {
        "key": "shrinkage",
        "label": "Pérdidas por revisar",
        "href": "/inventory/restaurant/shrinkage"
      }
    ]
  },
  {
    "key": "counts",
    "label": "Conteos y ajustes",
    "items": [
      {
        "key": "stock-counts",
        "label": "Realizar conteo",
        "href": "/inventory/restaurant/stock-counts"
      },
      {
        "key": "count-schedules",
        "label": "Programar conteos",
        "href": "/inventory/restaurant/count-schedules"
      },
      {
        "key": "adjustments",
        "label": "Ajustes",
        "href": "/inventory/restaurant/adjustments"
      }
    ]
  },
  {
    "key": "reports",
    "label": "Reportes",
    "items": [
      {
        "key": "reports",
        "label": "Reportes",
        "href": "/inventory/restaurant/reports"
      },
      {
        "key": "analytics",
        "label": "Análisis",
        "href": "/inventory/restaurant/analytics"
      },
      {
        "key": "costs",
        "label": "Costos de recetas",
        "href": "/inventory/restaurant/costs"
      },
      {
        "key": "recipe-margins",
        "label": "Rentabilidad de recetas",
        "href": "/inventory/restaurant/recipe-margins"
      },
      {
        "key": "variance",
        "label": "Consumo esperado y registrado",
        "href": "/inventory/restaurant/variance"
      },
      {
        "key": "branch-costs",
        "label": "Costos por sucursal",
        "href": "/inventory/restaurant/branch-costs"
      },
      {
        "key": "unit-comparison",
        "label": "Comparar sucursales",
        "href": "/inventory/restaurant/unit-comparison"
      },
      {
        "key": "audit-log",
        "label": "Historial de auditoría",
        "href": "/inventory/restaurant/audit-log"
      },
      {
        "key": "audit",
        "label": "Reporte de auditoría",
        "href": "/inventory/restaurant/audit"
      }
    ]
  },
  {
    "key": "settings",
    "label": "Configuración",
    "items": [
      {
        "key": "settings",
        "label": "Configuración",
        "href": "/inventory/restaurant/settings"
      },
      {
        "key": "categories",
        "label": "Categorías",
        "href": "/inventory/restaurant/categories"
      },
      {
        "key": "units",
        "label": "Unidades y conversiones",
        "href": "/inventory/restaurant/units"
      },
      {
        "key": "warehouses",
        "label": "Almacenes",
        "href": "/inventory/restaurant/warehouses"
      }
    ]
  }
];

export function restaurantSectionForPath(path: string) {
  return restaurantSections.find(section => section.items.some(item => path === item.href || path.startsWith(`${item.href}/`)));
}
