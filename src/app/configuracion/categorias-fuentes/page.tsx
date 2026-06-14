import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { EmissionSourceCategoryList } from '@/components/Settings/components/EmissionSourceCategoryList';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categorías de Fuentes de Emisión | EcoCore',
};

export default function EmissionSourceCategoriesPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.MANAGE_EMISSION_SOURCE_CATEGORIES}>
        <EmissionSourceCategoryList />
      </PermissionGuard>
    </MainLayout>
  );
}
