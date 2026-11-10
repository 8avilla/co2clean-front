import type { ApiRole } from '../types';
import type { ApiUser } from '@/components/Users/types';
import { compareText, matchesSearchTerms, type SortDirection } from '@/shared/lib/list-utils';
import { getRoleModules } from './permission-categories';

export type RoleSortKey = 'name' | 'permissions' | 'users';

export interface RoleListItem extends ApiRole {
  /** Undefined when the users could not be loaded */
  usersCount?: number;
}

export const countUsersByRole = (users: ApiUser[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const user of users) {
    const roleId = user.roleId ?? user.role?.id;
    if (roleId) counts.set(roleId, (counts.get(roleId) ?? 0) + 1);
  }
  return counts;
};

export const matchesRoleSearch = (role: ApiRole, searchTerm: string): boolean =>
  matchesSearchTerms(searchTerm, role.name, role.description, ...getRoleModules(role.permissions));

export const sortRoles = (
  roles: RoleListItem[],
  key: RoleSortKey,
  direction: SortDirection,
): RoleListItem[] => {
  const factor = direction === 'asc' ? 1 : -1;
  return [...roles].sort((a, b) => {
    let byKey = 0;
    if (key === 'permissions') byKey = ((a.permissions?.length ?? 0) - (b.permissions?.length ?? 0)) * factor;
    else if (key === 'users') byKey = ((a.usersCount ?? -1) - (b.usersCount ?? -1)) * factor;
    else byKey = compareText(a.name, b.name) * factor;
    return byKey !== 0 ? byKey : compareText(a.name, b.name);
  });
};
