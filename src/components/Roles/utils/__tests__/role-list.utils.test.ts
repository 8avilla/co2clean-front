import { describe, it, expect } from 'vitest';
import type { ApiUser } from '@/components/Users/types';
import { RoleListItem, countUsersByRole, matchesRoleSearch, sortRoles } from '../role-list.utils';

const role = (overrides: Partial<RoleListItem> = {}): RoleListItem => ({
  id: 'r1',
  name: 'Auditor',
  description: 'Revisa la información',
  permissions: [{ id: 'p1', name: 'Ver usuarios', code: 'VIEW_USERS' }],
  usersCount: 0,
  ...overrides,
});

describe('role-list.utils', () => {
  describe('countUsersByRole', () => {
    it('debería contar usuarios por rol usando roleId o role.id', () => {
      const users = [
        { id: '1', name: 'A', email: 'a', roleId: 'r1' },
        { id: '2', name: 'B', email: 'b', role: { id: 'r1', name: 'X' } },
        { id: '3', name: 'C', email: 'c', roleId: 'r2' },
        { id: '4', name: 'D', email: 'd' },
      ] as ApiUser[];
      const counts = countUsersByRole(users);
      expect(counts.get('r1')).toBe(2);
      expect(counts.get('r2')).toBe(1);
      expect(counts.size).toBe(2);
    });
  });

  describe('matchesRoleSearch', () => {
    it('debería buscar por nombre sin importar tildes', () => {
      expect(matchesRoleSearch(role({ name: 'Administración' }), 'administracion')).toBe(true);
    });

    it('debería buscar por descripción', () => {
      expect(matchesRoleSearch(role(), 'revisa')).toBe(true);
    });

    it('debería buscar por módulo con acceso', () => {
      expect(matchesRoleSearch(role(), 'usuarios')).toBe(true);
      expect(matchesRoleSearch(role(), 'reportes')).toBe(false);
    });

    it('debería tolerar roles sin descripción ni permisos', () => {
      expect(matchesRoleSearch(role({ description: undefined, permissions: undefined }), 'auditor')).toBe(true);
    });
  });

  describe('sortRoles', () => {
    const roles = [
      role({ id: '1', name: 'Zeta', usersCount: 5, permissions: [] }),
      role({ id: '2', name: 'Álamo', usersCount: 1 }),
      role({ id: '3', name: 'Beta', usersCount: undefined, permissions: [
        { id: 'a', name: 'a', code: 'VIEW_USERS' },
        { id: 'b', name: 'b', code: 'VIEW_ROLES' },
      ] }),
    ];

    it('debería ordenar por nombre', () => {
      expect(sortRoles(roles, 'name', 'asc').map(r => r.id)).toEqual(['2', '3', '1']);
    });

    it('debería ordenar por cantidad de permisos', () => {
      expect(sortRoles(roles, 'permissions', 'desc').map(r => r.id)).toEqual(['3', '2', '1']);
    });

    it('debería ordenar por usuarios dejando al final los desconocidos al ir descendente', () => {
      expect(sortRoles(roles, 'users', 'desc').map(r => r.id)).toEqual(['1', '2', '3']);
    });

    it('no debería modificar el arreglo original', () => {
      const copy = [...roles];
      sortRoles(roles, 'name', 'asc');
      expect(roles).toEqual(copy);
    });
  });
});
