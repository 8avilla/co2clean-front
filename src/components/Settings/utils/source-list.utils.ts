import type { EmissionSource, EmissionSourceCategory } from '../types';
import { compareText, matchesSearchTerms, type SortDirection } from '@/shared/lib/list-utils';

export type SourceSortKey = 'category' | 'name' | 'factors';

export const matchesSourceSearch = (
  source: EmissionSource,
  category: EmissionSourceCategory | undefined,
  searchTerm: string,
): boolean => matchesSearchTerms(searchTerm, source.name, source.code, category?.name, category?.code);

/**
 * Sorts by the chosen column; ties always fall back to "type of source, then name"
 * so the grouping by type stays predictable.
 */
export const sortSources = (
  sources: EmissionSource[],
  key: SourceSortKey,
  direction: SortDirection,
  getCategoryName: (categoryId: string) => string,
  getFactorCount: (sourceId: string) => number,
): EmissionSource[] => {
  const factor = direction === 'asc' ? 1 : -1;
  return [...sources].sort((a, b) => {
    let byKey = 0;
    if (key === 'factors') byKey = (getFactorCount(a.id) - getFactorCount(b.id)) * factor;
    else if (key === 'name') byKey = compareText(a.name, b.name) * factor;
    else byKey = compareText(getCategoryName(a.category_id), getCategoryName(b.category_id)) * factor;
    if (byKey !== 0) return byKey;

    const byCategory = compareText(getCategoryName(a.category_id), getCategoryName(b.category_id));
    return byCategory !== 0 ? byCategory : compareText(a.name, b.name);
  });
};

export type SourceStatusFilter = 'all' | 'active' | 'inactive';

export const matchesSourceStatus = (source: EmissionSource, filter: SourceStatusFilter): boolean =>
  filter === 'all' || (filter === 'active' ? source.is_active : !source.is_active);

export const countInactiveSources = (sources: EmissionSource[]): number =>
  sources.filter(source => !source.is_active).length;
