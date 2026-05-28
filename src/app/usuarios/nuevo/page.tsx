import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { UserForm } from '@/components/Users/components/UserForm';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuevo Usuario | EcoCore',
};

export default function NewUserPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.CREATE_USERS} redirectTo="/usuarios">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Crear Nuevo Usuario</h1>
            <p className="text-sm text-zinc-500">Asigna accesos y roles a un nuevo integrante.</p>
          </div>
          <UserForm />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
