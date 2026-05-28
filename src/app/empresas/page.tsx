import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { CompanyList } from '@/components/Companies/components/CompanyList';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Empresas | EcoCore',
};

export default function CompaniesPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.VIEW_COMPANIES}>
        <CompanyList />
      </PermissionGuard>
    </MainLayout>
  );
}
