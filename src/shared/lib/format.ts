/**
 * Spanish (Colombia) number format: dot for thousands, comma for decimals.
 * Uses significant digits instead of fixed decimals so tiny factors (0,00002) are never rounded to 0.
 */
export const formatNumber = (value: number, maxSignificantDigits = 10): string =>
  new Intl.NumberFormat('es-CO', { maximumSignificantDigits: maxSignificantDigits }).format(value);
