import { describe, it, expect } from 'vitest';
import type { EmissionSource, EmissionSourceCategory } from '../../types';
import { countInactiveSources, matchesSourceSearch, matchesSourceStatus, sortSources } from '../source-list.utils';

const source = (overrides: Partial<EmissionSource>): EmissionSource => ({
  id: 's1',
  code: 'DSL',
  name: 'Diésel B10',
  category_id: 'c1',
  measurement_type: 'x',
  is_active: true,
  ...overrides,
});

const category: EmissionSourceCategory = {
  id: 'c1',
  code: 'MOV',
  name: 'Combustión Móvil',
  description: '',
  emission_group_id: 'g1',
  is_active: true,
};

describe('source-list.utils', () => {
  describe('matchesSourceSearch', () => {
    it('debería buscar por nombre y código de la fuente', () => {
      expect(matchesSourceSearch(source({}), category, 'diesel')).toBe(true);
      expect(matchesSourceSearch(source({}), category, 'dsl')).toBe(true);
    });

    it('debería buscar por nombre y código del tipo de fuente', () => {
      expect(matchesSourceSearch(source({}), category, 'combustion movil')).toBe(true);
      expect(matchesSourceSearch(source({}), category, 'mov')).toBe(true);
    });

    it('debería tolerar fuentes sin tipo', () => {
      expect(matchesSourceSearch(source({}), undefined, 'diesel')).toBe(true);
      expect(matchesSourceSearch(source({}), undefined, 'combustion')).toBe(false);
    });
  });

  describe('sortSources', () => {
    const sources = [
      source({ id: '1', name: 'Zeta', category_id: 'cB' }),
      source({ id: '2', name: 'Álamo', category_id: 'cB' }),
      source({ id: '3', name: 'Beta', category_id: 'cA' }),
    ];
    const categoryName = (id: string) => (id === 'cA' ? 'Alfa' : 'Beta tipo');
    const factorCount = (id: string) => ({ '1': 5, '2': 0, '3': 2 }[id] ?? 0);

    it('por tipo de fuente agrupa y desempata por nombre', () => {
      expect(sortSources(sources, 'category', 'asc', categoryName, factorCount).map(s => s.id)).toEqual(['3', '2', '1']);
    });

    it('por nombre ordena alfabéticamente', () => {
      expect(sortSources(sources, 'name', 'asc', categoryName, factorCount).map(s => s.id)).toEqual(['2', '3', '1']);
    });

    it('por factores ordena por cantidad en ambas direcciones', () => {
      expect(sortSources(sources, 'factors', 'desc', categoryName, factorCount).map(s => s.id)).toEqual(['1', '3', '2']);
      expect(sortSources(sources, 'factors', 'asc', categoryName, factorCount).map(s => s.id)).toEqual(['2', '3', '1']);
    });

    it('no debería modificar el arreglo original', () => {
      const copy = [...sources];
      sortSources(sources, 'name', 'asc', categoryName, factorCount);
      expect(sources).toEqual(copy);
    });
  });

  describe('estado de la fuente', () => {
    const active = source({ id: 'a', is_active: true });
    const inactive = source({ id: 'i', is_active: false });

    it('"all" debería aceptar activas e inactivas', () => {
      expect(matchesSourceStatus(active, 'all')).toBe(true);
      expect(matchesSourceStatus(inactive, 'all')).toBe(true);
    });

    it('debería filtrar solo activas o solo inactivas', () => {
      expect(matchesSourceStatus(active, 'active')).toBe(true);
      expect(matchesSourceStatus(inactive, 'active')).toBe(false);
      expect(matchesSourceStatus(active, 'inactive')).toBe(false);
      expect(matchesSourceStatus(inactive, 'inactive')).toBe(true);
    });

    it('countInactiveSources debería contar las inactivas', () => {
      expect(countInactiveSources([active, inactive, inactive])).toBe(2);
      expect(countInactiveSources([])).toBe(0);
    });
  });
});
