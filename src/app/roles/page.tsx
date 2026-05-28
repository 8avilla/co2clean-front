import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { RoleList } from '@/components/Roles/components/RoleList';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roles y Permisos | EcoCore',
};

export default function RolesPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.VIEW_ROLES}>
        <RoleList />
      </PermissionGuard>
    </MainLayout>
  );
}
