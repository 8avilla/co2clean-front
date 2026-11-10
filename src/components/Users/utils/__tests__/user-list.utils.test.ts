import { describe, it, expect } from 'vitest';
import type { ApiUser } from '../../types';
import {
  getAvatarColor,
  getInitials,
  getRoleBadgeColor,
  matchesUserSearch,
  sortUsers,
} from '../user-list.utils';

const buildUser = (overrides: Partial<ApiUser> = {}): ApiUser => ({
  id: 'u1',
  name: 'Ana Pérez',
  email: 'ana@ecocore.co',
  role: { id: 'r1', name: 'Administrador' },
  company: { id: 'c1', name: 'EcoCore', nit: '1' },
  ...overrides,
});

describe('user-list.utils', () => {
  describe('matchesUserSearch', () => {
    it('debería buscar por nombre sin importar tildes', () => {
      expect(matchesUserSearch(buildUser(), 'perez')).toBe(true);
    });

    it('debería buscar por correo, rol y empresa', () => {
      expect(matchesUserSearch(buildUser(), 'ecocore.co')).toBe(true);
      expect(matchesUserSearch(buildUser(), 'administrador')).toBe(true);
      expect(matchesUserSearch(buildUser(), 'ecocore')).toBe(true);
    });

    it('debería combinar palabras de campos distintos', () => {
      expect(matchesUserSearch(buildUser(), 'ana administrador')).toBe(true);
      expect(matchesUserSearch(buildUser(), 'ana gerente')).toBe(false);
    });

    it('debería tolerar usuarios sin rol ni empresa', () => {
      const user = buildUser({ role: undefined, company: undefined });
      expect(matchesUserSearch(user, 'ana')).toBe(true);
      expect(matchesUserSearch(user, 'gerente')).toBe(false);
    });
  });

  describe('sortUsers', () => {
    const users = [
      buildUser({ id: '1', name: 'Carlos', role: { id: 'r', name: 'Auditor' } }),
      buildUser({ id: '2', name: 'Álvaro', role: { id: 'r', name: 'Auditor' } }),
      buildUser({ id: '3', name: 'Beatriz', role: { id: 'r2', name: 'Administrador' } }),
    ];

    it('debería ordenar por nombre respetando tildes', () => {
      expect(sortUsers(users, 'name', 'asc').map(u => u.id)).toEqual(['2', '3', '1']);
    });

    it('debería ordenar por rol y desempatar por nombre', () => {
      expect(sortUsers(users, 'role', 'asc').map(u => u.id)).toEqual(['3', '2', '1']);
    });

    it('debería invertir el orden', () => {
      expect(sortUsers(users, 'name', 'desc').map(u => u.id)).toEqual(['1', '3', '2']);
    });

    it('no debería modificar el arreglo original', () => {
      const copy = [...users];
      sortUsers(users, 'name', 'asc');
      expect(users).toEqual(copy);
    });
  });

  it('getInitials debería devolver hasta dos iniciales', () => {
    expect(getInitials('ana maría pérez')).toBe('AM');
    expect(getInitials('  Juan ')).toBe('J');
  });

  it('getAvatarColor debería ser estable para el mismo nombre', () => {
    expect(getAvatarColor('Ana')).toBe(getAvatarColor('Ana'));
  });

  it('getRoleBadgeColor debería distinguir los roles conocidos', () => {
    expect(getRoleBadgeColor('Administrador')).toContain('red');
    expect(getRoleBadgeColor('Auditor')).toContain('amber');
    expect(getRoleBadgeColor(undefined)).toContain('zinc');
  });
});
