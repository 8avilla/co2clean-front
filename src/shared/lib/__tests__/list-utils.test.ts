import { describe, it, expect } from 'vitest';
import { compareText, matchesSearchTerms, nextSortState, normalizeSearchText } from '../list-utils';

describe('list-utils', () => {
  it('normalizeSearchText debería quitar tildes y pasar a minúsculas', () => {
    expect(normalizeSearchText('  Ángel Muñoz ')).toBe('angel munoz');
  });

  describe('matchesSearchTerms', () => {
    it('debería coincidir con todo si la búsqueda está vacía', () => {
      expect(matchesSearchTerms('  ', 'Ana')).toBe(true);
    });

    it('debería exigir que aparezcan todas las palabras, en cualquier campo', () => {
      expect(matchesSearchTerms('ana admin', 'Ana Pérez', 'ana@x.co', 'Administrador')).toBe(true);
      expect(matchesSearchTerms('ana gerente', 'Ana Pérez', 'ana@x.co', 'Administrador')).toBe(false);
    });

    it('debería ignorar tildes y mayúsculas', () => {
      expect(matchesSearchTerms('PEREZ', 'Ana Pérez')).toBe(true);
    });

    it('debería ignorar campos indefinidos', () => {
      expect(matchesSearchTerms('ana', undefined, 'Ana')).toBe(true);
    });
  });

  it('compareText debería ordenar en español con soporte numérico opcional', () => {
    expect(['Zeta', 'Álamo', 'beta'].sort(compareText)).toEqual(['Álamo', 'beta', 'Zeta']);
    expect(compareText('10', '9', { numeric: true })).toBeGreaterThan(0);
  });

  describe('nextSortState', () => {
    it('debería alternar la dirección al pulsar la misma columna', () => {
      expect(nextSortState({ key: 'name', direction: 'asc' }, 'name')).toEqual({ key: 'name', direction: 'desc' });
      expect(nextSortState({ key: 'name', direction: 'desc' }, 'name')).toEqual({ key: 'name', direction: 'asc' });
    });

    it('debería empezar en ascendente al cambiar de columna', () => {
      expect(nextSortState({ key: 'name', direction: 'desc' }, 'role')).toEqual({ key: 'role', direction: 'asc' });
    });
  });
});
