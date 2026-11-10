import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { RoleEditView } from "@/components/Roles/components/RoleEditView";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRolePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <MainLayout>
      <PermissionGuard
        permission={PermissionCode.MANAGE_ROLES}
        redirectTo="/roles"
      >
        <RoleEditView roleId={id} />
      </PermissionGuard>
    </MainLayout>
  );
}
