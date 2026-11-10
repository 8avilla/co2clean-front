import type { ApiEmissionUnit } from '@/shared/services/emission-source.service';
import { compareText, matchesSearchTerms, type SortDirection } from '@/shared/lib/list-utils';

export type UnitSortKey = 'name' | 'symbol' | 'type';

export const matchesUnitSearch = (unit: ApiEmissionUnit, searchTerm: string): boolean =>
  matchesSearchTerms(searchTerm, unit.name, unit.symbol, unit.description);

export const sortUnits = (
  units: ApiEmissionUnit[],
  key: UnitSortKey,
  direction: SortDirection,
  getTypeName: (unitTypeId?: string) => string,
): ApiEmissionUnit[] => {
  const factor = direction === 'asc' ? 1 : -1;
  return [...units].sort((a, b) => {
    let byKey = 0;
    if (key === 'symbol') byKey = compareText(a.symbol, b.symbol) * factor;
    else if (key === 'type') byKey = compareText(getTypeName(a.unitTypeId), getTypeName(b.unitTypeId)) * factor;
    else byKey = compareText(a.name, b.name) * factor;
    return byKey !== 0 ? byKey : compareText(a.name, b.name);
  });
};
