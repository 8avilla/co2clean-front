import { PermissionCode, type PermissionCodeType } from '@/shared/constants/permissions';

export interface SettingsNavItem {
  href: string;
  label: string;
  permission: PermissionCodeType;
}

// Ordered following the configuration hierarchy:
// category -> source (with its factors) -> supporting catalogs (gases, units)
export const SETTINGS_NAV_ITEMS: readonly SettingsNavItem[] = [
  {
    href: '/configuracion/categorias-fuentes',
    label: 'Tipos de fuente',
    permission: PermissionCode.MANAGE_EMISSION_SOURCE_CATEGORIES,
  },
  {
    href: '/configuracion/fuentes-emision',
    label: 'Fuentes y factores',
    permission: PermissionCode.MANAGE_EMISSION_SOURCES,
  },
  {
    href: '/configuracion/gases',
    label: 'Gases (GEI)',
    permission: PermissionCode.MANAGE_GASES,
  },
  {
    href: '/configuracion/unidades-medida',
    label: 'Unidades de medida',
    permission: PermissionCode.MANAGE_EMISSION_SOURCES,
  },
];

export const getVisibleSettingsItems = (
  hasPermission: (permission: PermissionCodeType) => boolean,
): SettingsNavItem[] => SETTINGS_NAV_ITEMS.filter(item => hasPermission(item.permission));
