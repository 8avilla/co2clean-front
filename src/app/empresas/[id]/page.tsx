import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { CompanyEditView } from "@/components/Companies/components/CompanyEditView";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCompanyPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <MainLayout>
      <PermissionGuard
        permission={PermissionCode.UPDATE_COMPANIES}
        redirectTo="/empresas"
      >
        <CompanyEditView companyId={id} />
      </PermissionGuard>
    </MainLayout>
  );
}
