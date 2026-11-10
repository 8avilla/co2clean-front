export type SortDirection = 'asc' | 'desc';

/** Lowercase and remove accents so "Bogota" finds "Bogotá". */
export const normalizeSearchText = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** True when every word typed appears somewhere in the haystack (accent and case insensitive). */
export const matchesSearchTerms = (searchTerm: string, ...fields: Array<string | undefined>): boolean => {
  const words = normalizeSearchText(searchTerm).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeSearchText(fields.filter(Boolean).join(' '));
  return words.every(word => haystack.includes(word));
};

/** Locale-aware text comparison in Spanish (ñ and accents sort naturally). */
export const compareText = (a: string, b: string, options?: { numeric?: boolean }): number =>
  a.localeCompare(b, 'es', options);

/** Next sort state when a column header is clicked: same column toggles, a new one starts ascending. */
export const nextSortState = <TKey extends string>(
  current: { key: TKey; direction: SortDirection },
  clickedKey: TKey,
): { key: TKey; direction: SortDirection } =>
  current.key === clickedKey
    ? { key: clickedKey, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    : { key: clickedKey, direction: 'asc' };
