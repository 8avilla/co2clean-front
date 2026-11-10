import type { ApiCompany, ApiHeadquarter } from '../types';
import { nitSearchKey } from './nit';
import { compareText, normalizeSearchText, type SortDirection } from '@/shared/lib/list-utils';

export { normalizeSearchText };
export type { SortDirection };

export type CompanySortKey = 'name' | 'nit' | 'headquarters';

export interface CompanyListItem extends ApiCompany {
  headquartersCount: number;
}

export const countHeadquartersByCompany = (
  headquarters: ApiHeadquarter[],
): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const headquarter of headquarters) {
    counts.set(headquarter.companyId, (counts.get(headquarter.companyId) ?? 0) + 1);
  }
  return counts;
};

export const matchesCompanySearch = (company: ApiCompany, searchTerm: string): boolean => {
  const query = normalizeSearchText(searchTerm);
  if (!query) return true;

  const matchesName = normalizeSearchText(company.name).includes(query);
  const matchesEmail = normalizeSearchText(company.email ?? '').includes(query);
  const queryDigits = nitSearchKey(searchTerm);
  const matchesNit = queryDigits.length > 0 && nitSearchKey(company.nit).includes(queryDigits);

  return matchesName || matchesEmail || matchesNit;
};

export const sortCompanies = (
  companies: CompanyListItem[],
  sortKey: CompanySortKey,
  direction: SortDirection,
): CompanyListItem[] => {
  const factor = direction === 'asc' ? 1 : -1;
  return [...companies].sort((a, b) => {
    if (sortKey === 'headquarters') {
      return (a.headquartersCount - b.headquartersCount) * factor;
    }
    if (sortKey === 'nit') {
      return compareText(a.nit, b.nit, { numeric: true }) * factor;
    }
    return compareText(a.name, b.name) * factor;
  });
};
