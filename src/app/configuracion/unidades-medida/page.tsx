import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { EmissionUnitList } from '@/components/Settings/components/EmissionUnitList';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unidades de Medida | EcoCore',
};

export default function EmissionUnitsPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.MANAGE_EMISSION_SOURCES}>
        <EmissionUnitList />
      </PermissionGuard>
    </MainLayout>
  );
}
