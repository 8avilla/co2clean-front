import { describe, it, expect } from 'vitest';
import type { Gas } from '../../types';
import { matchesCalcFilter, matchesGasSearch, sortGases } from '../gas-list.utils';

const gas = (overrides: Partial<Gas>): Gas => ({
  id: '1',
  chemical_name: 'Metano',
  formula: 'CH₄',
  gwp: 28,
  calculation_type: 'biogenic',
  is_active: true,
  ...overrides,
});

describe('gas-list.utils', () => {
  it('matchesGasSearch debería buscar por nombre sin importar tildes ni mayúsculas', () => {
    expect(matchesGasSearch(gas({ chemical_name: 'Óxido Nitroso' }), 'oxido')).toBe(true);
    expect(matchesGasSearch(gas({}), 'ethano')).toBe(false);
  });

  it('matchesGasSearch debería buscar por fórmula', () => {
    expect(matchesGasSearch(gas({ formula: 'N₂O' }), 'n₂o')).toBe(true);
  });

  describe('matchesCalcFilter', () => {
    it('"all" debería aceptar todo', () => {
      expect(matchesCalcFilter(gas({ calculation_type: 'non_biogenic' }), 'all')).toBe(true);
    });

    it('debería incluir los gases "both" en ambos filtros', () => {
      const both = gas({ calculation_type: 'both' });
      expect(matchesCalcFilter(both, 'biogenic')).toBe(true);
      expect(matchesCalcFilter(both, 'non_biogenic')).toBe(true);
    });

    it('debería excluir el tipo contrario', () => {
      expect(matchesCalcFilter(gas({ calculation_type: 'biogenic' }), 'non_biogenic')).toBe(false);
      expect(matchesCalcFilter(gas({ calculation_type: 'non_biogenic' }), 'biogenic')).toBe(false);
    });
  });

  describe('sortGases', () => {
    const gases = [
      gas({ id: '1', chemical_name: 'Zeta', formula: 'B', gwp: 10 }),
      gas({ id: '2', chemical_name: 'Álamo', formula: 'C', gwp: 300 }),
      gas({ id: '3', chemical_name: 'Beta', formula: 'A', gwp: 1 }),
    ];

    it('debería ordenar por nombre', () => {
      expect(sortGases(gases, 'name', 'asc').map(g => g.id)).toEqual(['2', '3', '1']);
    });

    it('debería ordenar por fórmula', () => {
      expect(sortGases(gases, 'formula', 'asc').map(g => g.id)).toEqual(['3', '1', '2']);
    });

    it('debería ordenar por GWP numéricamente en ambas direcciones', () => {
      expect(sortGases(gases, 'gwp', 'asc').map(g => g.id)).toEqual(['3', '1', '2']);
      expect(sortGases(gases, 'gwp', 'desc').map(g => g.id)).toEqual(['2', '1', '3']);
    });

    it('no debería modificar el arreglo original', () => {
      const copy = [...gases];
      sortGases(gases, 'gwp', 'asc');
      expect(gases).toEqual(copy);
    });
  });
});
