import { describe, it, expect } from 'vitest';
import {
  calculateNitCheckDigit,
  formatNit,
  hasValidNitCheckDigit,
  hasValidNitFormat,
  nitSearchKey,
  stripNitSeparators,
} from '../nit';

describe('nit', () => {
  describe('calculateNitCheckDigit', () => {
    it('debería calcular el dígito de verificación DIAN', () => {
      expect(calculateNitCheckDigit('890903938')).toBe(8);
      expect(calculateNitCheckDigit('900123456')).toBe(8);
    });
  });

  describe('hasValidNitFormat', () => {
    it('debería aceptar NIT con o sin puntos y con o sin dígito de verificación', () => {
      expect(hasValidNitFormat('900123456')).toBe(true);
      expect(hasValidNitFormat('900.123.456-7')).toBe(true);
      expect(hasValidNitFormat('900 123 456-7')).toBe(true);
    });

    it('debería rechazar letras, longitudes inválidas y guiones mal ubicados', () => {
      expect(hasValidNitFormat('ABC123456')).toBe(false);
      expect(hasValidNitFormat('12345')).toBe(false);
      expect(hasValidNitFormat('12345678901')).toBe(false);
      expect(hasValidNitFormat('900123456-77')).toBe(false);
    });
  });

  describe('hasValidNitCheckDigit', () => {
    it('debería aceptar un NIT sin dígito de verificación', () => {
      expect(hasValidNitCheckDigit('900123456')).toBe(true);
    });

    it('debería aceptar un dígito de verificación correcto', () => {
      expect(hasValidNitCheckDigit('890.903.938-8')).toBe(true);
      expect(hasValidNitCheckDigit('900123456-8')).toBe(true);
    });

    it('debería rechazar un dígito de verificación incorrecto', () => {
      expect(hasValidNitCheckDigit('900.123.456-7')).toBe(false);
    });

    it('debería rechazar formatos inválidos', () => {
      expect(hasValidNitCheckDigit('abc')).toBe(false);
    });
  });

  describe('formatNit', () => {
    it('debería usar puntos de miles y guion antes del dígito', () => {
      expect(formatNit('9001234567')).toBe('9.001.234.567');
      expect(formatNit('900123456-7')).toBe('900.123.456-7');
      expect(formatNit('900.123.456-7')).toBe('900.123.456-7');
    });

    it('debería devolver el texto recortado cuando el formato es inválido', () => {
      expect(formatNit('  abc ')).toBe('abc');
    });
  });

  it('stripNitSeparators debería quitar puntos y espacios', () => {
    expect(stripNitSeparators('900 123.456-7')).toBe('900123456-7');
  });

  it('nitSearchKey debería conservar solo dígitos', () => {
    expect(nitSearchKey('900.123.456-7')).toBe('9001234567');
  });
});
