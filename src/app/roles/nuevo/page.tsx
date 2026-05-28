import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { RoleForm } from '@/components/Roles/components/RoleForm';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuevo Rol | EcoCore',
};

export default function NewRolePage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.MANAGE_ROLES} redirectTo="/roles">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Crear Nuevo Rol</h1>
            <p className="text-sm text-zinc-500">Define un conjunto de permisos para asignar a usuarios.</p>
          </div>
          <RoleForm />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
