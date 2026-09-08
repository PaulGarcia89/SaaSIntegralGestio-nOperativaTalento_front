import { describe, expect, it } from 'vitest';
import { appNavigation, getRoutePolicy, itemsBySection, isRoleAllowed } from './navigation';
import { restaurantSections, restaurantSectionForPath } from './restaurant-navigation';

describe('restaurant navigation consolidation', () => {
  it('preserves access to every existing restaurant route under eight destinations', () => {
    const pages = restaurantSections.flatMap(section => section.items);
    expect(new Set(pages.map(page => page.href)).size).toBe(pages.length);
    for (const route of appNavigation.filter(route => route.module === 'restaurant_inventory' && route.showInNavigation !== false)) {
      expect(pages.some(page => page.href === route.href), route.href).toBe(true);
    }
    expect(itemsBySection(appNavigation, 'restaurant_inventory')[0].items.map(item => item.label)).toEqual([
      'Resumen', 'Inventario', 'Compras y recepción', 'Recetas y producción',
      'Salidas y pérdidas', 'Conteos y ajustes', 'Reportes y costos', 'Configuración',
    ]);
  });
  it('chooses an allowed destination rather than exposing the purchase editor to read-only users', () => {
    const allowed = appNavigation.filter(item => item.module === 'restaurant_inventory' && item.permission === 'restaurant_inventory.view' && isRoleAllowed(item.roles, 'supervisor'));
    const entries = itemsBySection(allowed, 'restaurant_inventory')[0].items;
    expect(entries.every(entry => allowed.some(item => item.href === entry.href))).toBe(true);
    expect(entries.find(item => item.label === 'Compras y recepción')?.href).toBe('/inventory/restaurant/purchase-suggestions');
    expect(entries.some(item => item.label === 'Conteos y ajustes')).toBe(false);
    expect(getRoutePolicy('/inventory/restaurant/ingredients')?.permission).toBe('restaurant_inventory.manage');
  });
  it('keeps deep links associated with their section', () => {
    expect(restaurantSectionForPath('/inventory/restaurant/recipes/123/cost')?.key).toBe('recipes');
    expect(restaurantSectionForPath('/inventory/restaurant/invoices')?.key).toBe('purchases');
    expect(restaurantSectionForPath('/inventory/restaurant/count-schedules')?.key).toBe('counts');
  });
});
