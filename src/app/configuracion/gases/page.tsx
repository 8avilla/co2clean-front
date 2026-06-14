import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { GasesList } from '@/components/Settings/components/GasesList';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gases de Efecto Invernadero | EcoCore',
};

export default function GasesPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.MANAGE_GASES}>
        <GasesList />
      </PermissionGuard>
    </MainLayout>
  );
}
