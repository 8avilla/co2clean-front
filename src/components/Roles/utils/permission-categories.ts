import type { ApiPermission } from '../types';

/** Module a permission belongs to, derived from its code. */
export const getPermissionCategory = (code: string): string => {
  const lower = code.toLowerCase();
  if (lower.includes('user')) return 'Usuarios';
  if (lower.includes('role')) return 'Roles';
  if (lower.includes('compan') || lower.includes('empresa')) return 'Empresas';
  if (lower.includes('headquarter') || lower.includes('sede')) return 'Sedes';
  if (lower.includes('report')) return 'Reportes';
  if (lower.includes('carbon') || lower.includes('footprint') || lower.includes('emission')) return 'Huella de carbono';
  return 'Sistema';
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Usuarios': 'bg-blue-50 text-blue-700 border-blue-200',
  'Roles': 'bg-violet-50 text-violet-700 border-violet-200',
  'Empresas': 'bg-amber-50 text-amber-700 border-amber-200',
  'Sedes': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Reportes': 'bg-rose-50 text-rose-700 border-rose-200',
  'Huella de carbono': 'bg-teal-50 text-teal-700 border-teal-200',
  'Sistema': 'bg-zinc-50 text-zinc-600 border-zinc-200',
};

/** Distinct modules a set of permissions gives access to. */
export const getRoleModules = (permissions: ApiPermission[] = []): string[] =>
  [...new Set(permissions.map(permission => getPermissionCategory(permission.code)))];
