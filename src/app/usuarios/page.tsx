import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { UserList } from '@/components/Users/components/UserList';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Usuarios | CleanCo2',
};

export default function UsersPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.VIEW_USERS}>
        <UserList />
      </PermissionGuard>
    </MainLayout>
  );
}
