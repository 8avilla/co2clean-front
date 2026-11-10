import { describe, it, expect } from 'vitest';
import type { ApiEmissionUnit } from '@/shared/services/emission-source.service';
import { matchesUnitSearch, sortUnits } from '../unit-list.utils';

const unit = (overrides: Partial<ApiEmissionUnit>): ApiEmissionUnit => ({
  id: '1',
  name: 'Kilogramo',
  symbol: 'kg',
  ...overrides,
});

describe('unit-list.utils', () => {
  it('matchesUnitSearch debería buscar por nombre, símbolo y descripción', () => {
    const u = unit({ description: 'Masa en el SI' });
    expect(matchesUnitSearch(u, 'kilogramo')).toBe(true);
    expect(matchesUnitSearch(u, 'KG')).toBe(true);
    expect(matchesUnitSearch(u, 'masa si')).toBe(true);
    expect(matchesUnitSearch(u, 'litro')).toBe(false);
  });

  describe('sortUnits', () => {
    const units = [
      unit({ id: '1', name: 'Metro', symbol: 'm', unitTypeId: 't2' }),
      unit({ id: '2', name: 'Álamo', symbol: 'z', unitTypeId: 't1' }),
      unit({ id: '3', name: 'Litro', symbol: 'L' }),
    ];
    const typeName = (id?: string) => ({ t1: 'Masa', t2: 'Longitud' }[id ?? ''] ?? '');

    it('debería ordenar por nombre', () => {
      expect(sortUnits(units, 'name', 'asc', typeName).map(u => u.id)).toEqual(['2', '3', '1']);
    });

    it('debería ordenar por símbolo', () => {
      expect(sortUnits(units, 'symbol', 'asc', typeName).map(u => u.id)).toEqual(['3', '1', '2']);
    });

    it('debería ordenar por tipo dejando las unidades sin tipo primero en ascendente', () => {
      expect(sortUnits(units, 'type', 'asc', typeName).map(u => u.id)).toEqual(['3', '1', '2']);
      expect(sortUnits(units, 'type', 'desc', typeName).map(u => u.id)).toEqual(['2', '1', '3']);
    });
  });
});
