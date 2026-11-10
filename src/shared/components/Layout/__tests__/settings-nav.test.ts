import { describe, it, expect } from 'vitest';
import { PermissionCode } from '@/shared/constants/permissions';
import { SETTINGS_NAV_ITEMS, getVisibleSettingsItems } from '../settings-nav';

describe('settings-nav', () => {
  it('debería ordenar los ítems siguiendo la jerarquía de configuración', () => {
    expect(SETTINGS_NAV_ITEMS.map(item => item.href)).toEqual([
      '/configuracion/categorias-fuentes',
      '/configuracion/fuentes-emision',
      '/configuracion/gases',
      '/configuracion/unidades-medida',
    ]);
  });

  it('debería mostrar todos los ítems cuando el usuario tiene todos los permisos', () => {
    expect(getVisibleSettingsItems(() => true)).toHaveLength(SETTINGS_NAV_ITEMS.length);
  });

  it('debería filtrar los ítems según los permisos del usuario', () => {
    const visible = getVisibleSettingsItems(p => p === PermissionCode.MANAGE_GASES);
    expect(visible.map(item => item.href)).toEqual(['/configuracion/gases']);
  });

  it('debería devolver una lista vacía sin permisos', () => {
    expect(getVisibleSettingsItems(() => false)).toEqual([]);
  });
});
