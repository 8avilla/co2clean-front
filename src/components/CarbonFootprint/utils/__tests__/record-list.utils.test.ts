import { describe, it, expect } from 'vitest';
import type { ApiCarbonFootprint } from '../../types';
import {
  DisplayRow,
  buildDisplayRows,
  matchesRecordSearch,
  shortGroupName,
  sortRows,
} from '../record-list.utils';

const row = (overrides: Partial<DisplayRow> = {}): DisplayRow => ({
  id: 'r1',
  sedeNombre: 'Sede Norte',
  sedeId: 'h1',
  anio: 2024,
  modoCarga: 'Annual',
  item: 'Papel',
  cantidad: 10,
  alcanceNombre: 'Alcance 1 — Emisiones Directas de GEI',
  fuenteNombre: 'Combustión Móvil',
  subfuenteNombre: 'Diésel',
  unidadNombre: 'kg',
  ...overrides,
});

describe('record-list.utils', () => {
  it('shortGroupName debería abreviar el nombre del grupo', () => {
    expect(shortGroupName('Alcance 1 — Emisiones Directas de GEI')).toBe('Alcance 1');
    expect(shortGroupName('Sin separador')).toBe('Sin separador');
  });

  describe('matchesRecordSearch', () => {
    it('debería buscar por sede, tipo de fuente, fuente, ítem y año', () => {
      expect(matchesRecordSearch(row(), 'norte')).toBe(true);
      expect(matchesRecordSearch(row(), 'combustion movil')).toBe(true);
      expect(matchesRecordSearch(row(), 'diesel')).toBe(true);
      expect(matchesRecordSearch(row(), 'papel')).toBe(true);
      expect(matchesRecordSearch(row(), '2024')).toBe(true);
    });

    it('debería combinar palabras de campos distintos', () => {
      expect(matchesRecordSearch(row(), 'norte 2024 diesel')).toBe(true);
      expect(matchesRecordSearch(row(), 'norte 2023')).toBe(false);
    });

    it('debería ignorar la fuente "-" y los ítems vacíos', () => {
      const empty = row({ subfuenteNombre: '-', item: undefined });
      expect(matchesRecordSearch(empty, '-')).toBe(false);
      expect(matchesRecordSearch(empty, 'norte')).toBe(true);
    });
  });

  describe('sortRows', () => {
    const rows = [
      row({ id: '1', anio: 2023, sedeNombre: 'Zeta', cantidad: undefined, item: 'B', alcanceNombre: 'Alcance 10' }),
      row({ id: '2', anio: 2025, sedeNombre: 'Álamo', cantidad: 50, item: 'A', alcanceNombre: 'Alcance 2' }),
      row({ id: '3', anio: 2024, sedeNombre: 'Beta', cantidad: 5, item: undefined, alcanceNombre: 'Alcance 1' }),
    ];

    it('debería ordenar por año en ambas direcciones', () => {
      expect(sortRows(rows, 'anio', 'desc').map(r => r.id)).toEqual(['2', '3', '1']);
      expect(sortRows(rows, 'anio', 'asc').map(r => r.id)).toEqual(['1', '3', '2']);
    });

    it('debería ordenar por sede respetando tildes', () => {
      expect(sortRows(rows, 'sede', 'asc').map(r => r.id)).toEqual(['2', '3', '1']);
    });

    it('debería ordenar el consumo numéricamente dejando los vacíos al principio en ascendente', () => {
      expect(sortRows(rows, 'consumo', 'asc').map(r => r.id)).toEqual(['1', '3', '2']);
    });

    it('debería ordenar los grupos de forma natural (Alcance 2 antes que Alcance 10)', () => {
      expect(sortRows(rows, 'grupo', 'asc').map(r => r.id)).toEqual(['3', '2', '1']);
    });

    it('debería ordenar por ítem tratando el vacío como texto vacío', () => {
      expect(sortRows(rows, 'item', 'asc').map(r => r.id)).toEqual(['3', '2', '1']);
    });

    it('no debería modificar el arreglo original', () => {
      const copy = [...rows];
      sortRows(rows, 'anio', 'asc');
      expect(rows).toEqual(copy);
    });
  });

  describe('buildDisplayRows', () => {
    const record = {
      id: 'r1',
      headquarterId: 'h1',
      year: 2024,
      loadMode: 'Annual',
      quantity: 12,
      emissionSubsourceId: 'ss1',
      emissionUnitId: 'u1',
      emissionUnit: { id: 'u1', symbol: 'kg', name: 'Kilogramo' },
      emissionGroup: { id: 'g1', name: 'Alcance 1' },
      emissionSourceCategory: { id: 'c1', name: 'Móvil' },
      emissionSource: { id: 's1', name: 'Diésel' },
    } as unknown as ApiCarbonFootprint;

    it('debería resolver el nombre de la sede y de la unidad comercial por id', () => {
      const rows = buildDisplayRows(
        [record],
        new Map([['h1', 'Sede Norte']]),
        new Map([['ss1:id:u1', 'Resma']]),
      );
      expect(rows[0]).toMatchObject({ sedeNombre: 'Sede Norte', unidadNombre: 'Resma', anio: 2024, cantidad: 12 });
    });

    it('debería usar el símbolo de la unidad comercial como alternativa', () => {
      const rows = buildDisplayRows([record], new Map(), new Map([['ss1:sym:kg', 'Bolsa']]));
      expect(rows[0].unidadNombre).toBe('Bolsa');
    });

    it('debería recurrir al símbolo base y al id de la sede cuando no hay coincidencias', () => {
      const rows = buildDisplayRows([record], new Map(), new Map());
      expect(rows[0].sedeNombre).toBe('h1');
      expect(rows[0].unidadNombre).toBe('kg');
    });

    it('debería poner "-" cuando faltan relaciones', () => {
      const bare = { id: 'r2', headquarterId: 'h2', year: 2020, loadMode: 'Monthly' } as unknown as ApiCarbonFootprint;
      const [built] = buildDisplayRows([bare], new Map(), new Map());
      expect(built).toMatchObject({ alcanceNombre: '-', fuenteNombre: '-', subfuenteNombre: '-', unidadNombre: '-' });
    });
  });
});
