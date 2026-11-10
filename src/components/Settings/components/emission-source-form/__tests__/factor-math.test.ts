import { describe, it, expect } from 'vitest';
import { calculateKgCo2ePerUnit, formatCo2e, isGwpOutdated } from '../factor-math';

describe('factor-math', () => {
  describe('calculateKgCo2ePerUnit', () => {
    it('debería multiplicar factor, coeficiente y GWP', () => {
      expect(calculateKgCo2ePerUnit({ factor: 2.68, massUnit: 'kg', coefficient: 1, gwp: 1 })).toBeCloseTo(2.68);
      expect(calculateKgCo2ePerUnit({ factor: 0.0001, massUnit: 'kg', coefficient: 2, gwp: 28 })).toBeCloseTo(0.0056);
    });

    it('debería convertir el factor a kg según su unidad de masa', () => {
      expect(calculateKgCo2ePerUnit({ factor: 500, massUnit: 'g', coefficient: 1, gwp: 1 })).toBeCloseTo(0.5);
      expect(calculateKgCo2ePerUnit({ factor: 1500, massUnit: 'mg', coefficient: 1, gwp: 10 })).toBeCloseTo(0.015);
    });

    it('debería tratar un coeficiente vacío como 1', () => {
      expect(calculateKgCo2ePerUnit({ factor: 3, massUnit: 'kg', coefficient: '', gwp: 2 })).toBe(6);
    });

    it('debería respetar un coeficiente 0 explícito', () => {
      expect(calculateKgCo2ePerUnit({ factor: 3, massUnit: 'kg', coefficient: 0, gwp: 2 })).toBe(0);
    });

    it('debería devolver undefined sin factor o sin GWP', () => {
      expect(calculateKgCo2ePerUnit({ factor: '', massUnit: 'kg', coefficient: 1, gwp: 1 })).toBeUndefined();
      expect(calculateKgCo2ePerUnit({ factor: 1, massUnit: 'kg', coefficient: 1, gwp: 0 })).toBeUndefined();
    });
  });

  describe('formatCo2e', () => {
    it('debería usar el formato es-CO con coma decimal y puntos de miles', () => {
      expect(formatCo2e(2.68)).toBe('2,68');
      expect(formatCo2e(10200)).toBe('10.200');
    });

    it('debería limitar a 6 cifras significativas sin notación científica', () => {
      expect(formatCo2e(0.0000268)).toBe('0,0000268');
      expect(formatCo2e(1 / 3)).toBe('0,333333');
    });
  });

  describe('isGwpOutdated', () => {
    it('debería avisar cuando el GWP del factor difiere del actual del gas', () => {
      expect(isGwpOutdated(28, 30)).toBe(true);
    });

    it('no debería avisar cuando coinciden, no hay gas o el factor aún no tiene GWP', () => {
      expect(isGwpOutdated(28, 28)).toBe(false);
      expect(isGwpOutdated(28, undefined)).toBe(false);
      expect(isGwpOutdated(0, 30)).toBe(false);
    });
  });
});
