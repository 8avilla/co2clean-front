import type { Gas } from '../types';
import { compareText, matchesSearchTerms, type SortDirection } from '@/shared/lib/list-utils';

export type GasSortKey = 'name' | 'formula' | 'gwp';
export type CalcFilter = 'all' | 'biogenic' | 'non_biogenic';

export const matchesGasSearch = (gas: Gas, searchTerm: string): boolean =>
  matchesSearchTerms(searchTerm, gas.chemical_name, gas.formula);

/** "both" gases appear under both the biogenic and the non-biogenic filters. */
export const matchesCalcFilter = (gas: Gas, filter: CalcFilter): boolean => {
  if (filter === 'all') return true;
  if (filter === 'biogenic') return gas.calculation_type === 'biogenic' || gas.calculation_type === 'both';
  return gas.calculation_type === 'non_biogenic' || gas.calculation_type === 'both';
};

export const sortGases = (gases: Gas[], key: GasSortKey, direction: SortDirection): Gas[] => {
  const factor = direction === 'asc' ? 1 : -1;
  return [...gases].sort((a, b) => {
    let byKey = 0;
    if (key === 'gwp') byKey = (a.gwp - b.gwp) * factor;
    else if (key === 'formula') byKey = compareText(a.formula, b.formula) * factor;
    else byKey = compareText(a.chemical_name, b.chemical_name) * factor;
    return byKey !== 0 ? byKey : compareText(a.chemical_name, b.chemical_name);
  });
};
