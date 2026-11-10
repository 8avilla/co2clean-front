// Colombian NIT helpers. Stored format: dotted thousands plus optional check digit (900.123.456-7)

const NIT_PATTERN = /^\d{6,10}(-\d)?$/;
const CHECK_DIGIT_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/** Removes dots and spaces typed by the user. */
export const stripNitSeparators = (raw: string): string => raw.replace(/[\s.]/g, '');

/** DIAN check digit for the NIT base number (digits only). */
export const calculateNitCheckDigit = (base: string): number => {
  const digits = base.split('').reverse();
  const sum = digits.reduce(
    (total, digit, index) => total + Number(digit) * CHECK_DIGIT_WEIGHTS[index],
    0,
  );
  const remainder = sum % 11;
  return remainder > 1 ? 11 - remainder : remainder;
};

export const hasValidNitFormat = (raw: string): boolean =>
  NIT_PATTERN.test(stripNitSeparators(raw));

/** The check digit is optional; when present it must match the DIAN algorithm. */
export const hasValidNitCheckDigit = (raw: string): boolean => {
  const cleaned = stripNitSeparators(raw);
  if (!NIT_PATTERN.test(cleaned)) return false;
  const [base, checkDigit] = cleaned.split('-');
  if (checkDigit === undefined) return true;
  return calculateNitCheckDigit(base) === Number(checkDigit);
};

/** Canonical format used for storage so the same NIT cannot be saved in two shapes. */
export const formatNit = (raw: string): string => {
  const cleaned = stripNitSeparators(raw);
  if (!NIT_PATTERN.test(cleaned)) return raw.trim();
  const [base, checkDigit] = cleaned.split('-');
  const grouped = base.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return checkDigit === undefined ? grouped : `${grouped}-${checkDigit}`;
};

/** Digits only, used to match searches regardless of dots or hyphens. */
export const nitSearchKey = (raw: string): string => raw.replace(/\D/g, '');
