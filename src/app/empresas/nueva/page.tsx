import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { CompanyForm } from '@/components/Companies/components/CompanyForm';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nueva Empresa | CleanCo2',
};

export default function NewCompanyPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.CREATE_COMPANIES} redirectTo="/empresas">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Crear Nueva Empresa</h1>
            <p className="text-sm text-zinc-500">Registra una nueva compañía en la plataforma.</p>
          </div>
          <CompanyForm />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
