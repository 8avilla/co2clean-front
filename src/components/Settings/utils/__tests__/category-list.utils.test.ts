import { describe, it, expect } from 'vitest';
import type { EmissionSourceCategory } from '../../types';
import { matchesCategorySearch, sortCategories } from '../category-list.utils';

const category = (overrides: Partial<EmissionSourceCategory>): EmissionSourceCategory => ({
  id: '1',
  code: 'COMB',
  name: 'Combustión Estacionaria',
  description: 'Fuentes fijas',
  emission_group_id: 'g1',
  is_active: true,
  ...overrides,
});

describe('category-list.utils', () => {
  describe('matchesCategorySearch', () => {
    it('debería buscar por nombre sin importar tildes', () => {
      expect(matchesCategorySearch(category({}), 'combustion')).toBe(true);
    });

    it('debería buscar por código y descripción', () => {
      expect(matchesCategorySearch(category({}), 'comb')).toBe(true);
      expect(matchesCategorySearch(category({}), 'fijas')).toBe(true);
      expect(matchesCategorySearch(category({}), 'móvil')).toBe(false);
    });
  });

  describe('sortCategories', () => {
    const items = [
      category({ id: '1', name: 'Zeta', emission_group_id: 'g2' }),
      category({ id: '2', name: 'Álamo', emission_group_id: 'g2' }),
      category({ id: '3', name: 'Beta', emission_group_id: 'g1' }),
    ];
    const labelOf = (c: EmissionSourceCategory) => (c.emission_group_id === 'g1' ? 'Alcance 1' : 'Alcance 2');

    it('debería ordenar por nombre', () => {
      expect(sortCategories(items, 'name', 'asc', labelOf).map(c => c.id)).toEqual(['2', '3', '1']);
      expect(sortCategories(items, 'name', 'desc', labelOf).map(c => c.id)).toEqual(['1', '3', '2']);
    });

    it('debería ordenar por grupo y desempatar por nombre', () => {
      expect(sortCategories(items, 'group', 'asc', labelOf).map(c => c.id)).toEqual(['3', '2', '1']);
    });

    it('no debería modificar el arreglo original', () => {
      const copy = [...items];
      sortCategories(items, 'name', 'asc', labelOf);
      expect(items).toEqual(copy);
    });
  });
});
