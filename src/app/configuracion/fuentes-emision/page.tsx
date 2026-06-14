import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { EmissionSourceList } from '@/components/Settings/components/EmissionSourceList';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fuentes de Emisión | EcoCore',
};

export default function EmissionSourcesPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.MANAGE_EMISSION_SOURCES}>
        <EmissionSourceList />
      </PermissionGuard>
    </MainLayout>
  );
}
