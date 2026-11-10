import type { EmissionSourceCategory } from '../types';
import { compareText, matchesSearchTerms, type SortDirection } from '@/shared/lib/list-utils';

export type CategorySortKey = 'name' | 'group';

export const matchesCategorySearch = (category: EmissionSourceCategory, searchTerm: string): boolean =>
  matchesSearchTerms(searchTerm, category.name, category.code, category.description);

export const sortCategories = (
  categories: EmissionSourceCategory[],
  key: CategorySortKey,
  direction: SortDirection,
  getGroupLabel: (category: EmissionSourceCategory) => string,
): EmissionSourceCategory[] => {
  const factor = direction === 'asc' ? 1 : -1;
  return [...categories].sort((a, b) => {
    const byKey =
      key === 'group'
        ? compareText(getGroupLabel(a), getGroupLabel(b)) * factor
        : compareText(a.name, b.name) * factor;
    return byKey !== 0 ? byKey : compareText(a.name, b.name);
  });
};
