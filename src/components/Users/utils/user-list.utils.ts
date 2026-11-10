import type { ApiUser } from '../types';
import { compareText, matchesSearchTerms, type SortDirection } from '@/shared/lib/list-utils';

export type UserSortKey = 'name' | 'role' | 'company';

export const matchesUserSearch = (user: ApiUser, searchTerm: string): boolean =>
  matchesSearchTerms(searchTerm, user.name, user.email, user.role?.name, user.company?.name);

const getSortValue = (user: ApiUser, key: UserSortKey): string => {
  if (key === 'role') return user.role?.name ?? '';
  if (key === 'company') return user.company?.name ?? '';
  return user.name;
};

export const sortUsers = (users: ApiUser[], key: UserSortKey, direction: SortDirection): ApiUser[] => {
  const factor = direction === 'asc' ? 1 : -1;
  return [...users].sort((a, b) => {
    const byKey = compareText(getSortValue(a, key), getSortValue(b, key)) * factor;
    // Stable secondary order by name so equal roles/companies do not shuffle
    return byKey !== 0 ? byKey : compareText(a.name, b.name);
  });
};

export const getInitials = (name: string): string =>
  name.trim().split(/\s+/).map(word => word[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
];

export const getAvatarColor = (name: string): string =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

export const getRoleBadgeColor = (role?: string): string => {
  if (!role) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  const upper = role.toUpperCase();
  if (upper.includes('ADMIN')) return 'bg-red-100 text-red-700 border-red-200';
  if (upper.includes('MANAGER') || upper.includes('GERENTE')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (upper.includes('AUDITOR')) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (upper.includes('DATA') || upper.includes('CARGA')) return 'bg-teal-100 text-teal-700 border-teal-200';
  return 'bg-zinc-100 text-zinc-700 border-zinc-200';
};
