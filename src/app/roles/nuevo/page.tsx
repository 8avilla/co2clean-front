import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { RoleForm } from "@/components/Roles/components/RoleForm";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";
import { Metadata } from "next";
import { Breadcrumbs } from "@/shared/components/Common/Breadcrumbs";

export const metadata: Metadata = {
  title: "Nuevo rol | EcoCore",
};

export default function NewRolePage() {
  return (
    <MainLayout>
      <PermissionGuard
        permission={PermissionCode.MANAGE_ROLES}
        redirectTo="/roles"
      >
        <>
          <Breadcrumbs
            className="max-w-5xl mx-auto mb-4"
            items={[
              { label: "Roles y permisos", href: "/roles" },
              { label: "Nuevo rol" },
            ]}
          />
          <RoleForm />
        </>
      </PermissionGuard>
    </MainLayout>
  );
}
