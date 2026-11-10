import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { UserEditView } from "@/components/Users/components/UserEditView";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <MainLayout>
      <PermissionGuard
        permission={PermissionCode.UPDATE_USERS}
        redirectTo="/usuarios"
      >
        <UserEditView userId={id} />
      </PermissionGuard>
    </MainLayout>
  );
}
