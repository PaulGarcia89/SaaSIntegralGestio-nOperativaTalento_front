import { describe, expect, it } from 'vitest';
import { appNavigation, getRoutePolicy, itemsBySection, isRoleAllowed } from './navigation';
import { restaurantLabelByHref, restaurantSections, restaurantSectionForPath } from './restaurant-navigation';

const paginas = restaurantSections.flatMap(section => section.items);

describe('restaurant navigation consolidation', () => {
  it('preserves access to every existing restaurant route under eight destinations', () => {
    expect(new Set(paginas.map(page => page.href)).size).toBe(paginas.length);
    for (const route of appNavigation.filter(route => route.module === 'restaurant_inventory' && route.showInNavigation !== false)) {
      expect(paginas.some(page => page.href === route.href), route.href).toBe(true);
    }
    expect(itemsBySection(appNavigation, 'restaurant_inventory')[0].items.map(item => item.label)).toEqual([
      'Resumen', 'Inventario', 'Entradas y salidas', 'Compras',
      'Recetas', 'Conteos y control', 'Reportes', 'Configuración',
    ]);
  });

  /**
   * La misma pantalla se llamaba de dos maneras según dónde se mirase: el
   * buscador (⌘K) y el menú móvil leen `appNavigation.label` y la navegación
   * interna leía el de `restaurantSections`. «Desperdicios» y «Registrar
   * desperdicio» eran la misma ruta; «Merma» era otra distinta. Esta prueba
   * impide que vuelvan a separarse.
   */
  it('gives every screen of the module exactly one name', () => {
    const discrepancias = appNavigation
      .filter(route => route.module === 'restaurant_inventory' && restaurantLabelByHref.has(route.href))
      .filter(route => route.label !== restaurantLabelByHref.get(route.href))
      .map(route => `${route.href}: ${route.label}`);
    expect(discrepancias).toEqual([]);
  });

  /** Dos pantallas distintas no pueden compartir rótulo: el buscador las ofrece juntas. */
  it('never repeats a label between two different screens', () => {
    const repetidos = [...new Map<string, string[]>(
      paginas.map(page => [page.label, paginas.filter(otra => otra.label === page.label).map(otra => otra.href)]),
    )].filter(([, hrefs]) => hrefs.length > 1);
    expect(repetidos).toEqual([]);
  });

  /**
   * Las operaciones del turno se nombran con un verbo y los listados con un
   * sustantivo. Sin esta regla convivían «Recetas», «Registrar producción» y
   * «Cocina central» en el mismo grupo sin que el nombre dijera cuál abría un
   * formulario y cuál una lista.
   */
  it('names every screen of the daily flow with a verb', () => {
    const flujo = restaurantSections.find(section => section.key === 'flows')!;
    for (const page of flujo.items) {
      expect(/^(Recibir|Registrar|Transferir|Importar)\b/.test(page.label), page.label).toBe(true);
    }
  });

  it('chooses an allowed destination rather than exposing the purchase editor to read-only users', () => {
    const allowed = appNavigation.filter(item => item.module === 'restaurant_inventory' && item.permission === 'restaurant_inventory.view' && isRoleAllowed(item.roles, 'supervisor'));
    const entries = itemsBySection(allowed, 'restaurant_inventory')[0].items;
    expect(entries.every(entry => allowed.some(item => item.href === entry.href))).toBe(true);
    expect(entries.find(item => item.label === 'Compras')?.href).toBe('/inventory/restaurant/purchase-suggestions');
    expect(entries.some(item => item.label === 'Conteos y control')).toBe(false);
    expect(getRoutePolicy('/inventory/restaurant/ingredients')?.permission).toBe('restaurant_inventory.manage');
  });

  it('keeps deep links associated with their section', () => {
    expect(restaurantSectionForPath('/inventory/restaurant/recipes/123/cost')?.key).toBe('recipes');
    expect(restaurantSectionForPath('/inventory/restaurant/invoices')?.key).toBe('purchases');
    expect(restaurantSectionForPath('/inventory/restaurant/count-schedules')?.key).toBe('counts');
    expect(restaurantSectionForPath('/inventory/restaurant/waste')?.key).toBe('flows');
    expect(restaurantSectionForPath('/inventory/restaurant/shrinkage')?.key).toBe('counts');
  });
});
