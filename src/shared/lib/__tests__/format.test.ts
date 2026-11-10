import { describe, it, expect } from 'vitest';
import { formatNumber } from '../format';

describe('formatNumber', () => {
  it('debería usar punto para miles y coma para decimales', () => {
    expect(formatNumber(10200)).toBe('10.200');
    expect(formatNumber(2.68)).toBe('2,68');
  });

  it('debería formatear igual los números de 4 y de 5 cifras (sin excepciones del navegador)', () => {
    expect(formatNumber(6140)).toBe('6.140');
    expect(formatNumber(13900)).toBe('13.900');
  });

  it('no debería redondear a cero los factores muy pequeños', () => {
    expect(formatNumber(0.00002)).toBe('0,00002');
    expect(formatNumber(0.0001)).toBe('0,0001');
  });

  it('debería conservar los enteros grandes', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  it('debería permitir limitar las cifras significativas', () => {
    expect(formatNumber(1 / 3, 6)).toBe('0,333333');
  });

  it('debería formatear el cero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});
