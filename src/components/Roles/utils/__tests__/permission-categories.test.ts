import { describe, it, expect } from 'vitest';
import type { ApiPermission } from '../../types';
import { CATEGORY_COLORS, getPermissionCategory, getRoleModules } from '../permission-categories';

const permission = (code: string): ApiPermission => ({ id: code, name: code, code });

describe('permission-categories', () => {
  it.each([
    ['VIEW_USERS', 'Usuarios'],
    ['MANAGE_ROLES', 'Roles'],
    ['CREATE_COMPANIES', 'Empresas'],
    ['VIEW_HEADQUARTERS', 'Sedes'],
    ['VIEW_REPORTS', 'Reportes'],
    ['MANAGE_EMISSION_SOURCES', 'Huella de carbono'],
    ['VIEW_CARBON_FOOTPRINT', 'Huella de carbono'],
    ['SOMETHING_ELSE', 'Sistema'],
  ])('debería clasificar %s como %s', (code, expected) => {
    expect(getPermissionCategory(code)).toBe(expected);
  });

  it('debería tener un color para cada módulo', () => {
    for (const moduleName of ['Usuarios', 'Roles', 'Empresas', 'Sedes', 'Reportes', 'Huella de carbono', 'Sistema']) {
      expect(CATEGORY_COLORS[moduleName]).toBeDefined();
    }
  });

  it('getRoleModules debería devolver los módulos sin repetir', () => {
    const modules = getRoleModules([permission('VIEW_USERS'), permission('CREATE_USERS'), permission('MANAGE_ROLES')]);
    expect(modules).toEqual(['Usuarios', 'Roles']);
  });

  it('getRoleModules debería tolerar la ausencia de permisos', () => {
    expect(getRoleModules(undefined)).toEqual([]);
  });
});
