import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { UserForm } from "@/components/Users/components/UserForm";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";
import { Metadata } from "next";
import { Breadcrumbs } from "@/shared/components/Common/Breadcrumbs";

export const metadata: Metadata = {
  title: "Nuevo usuario | EcoCore",
};

export default function NewUserPage() {
  return (
    <MainLayout>
      <PermissionGuard
        permission={PermissionCode.CREATE_USERS}
        redirectTo="/usuarios"
      >
        <>
          <Breadcrumbs
            className="max-w-4xl mx-auto mb-4"
            items={[
              { label: "Usuarios", href: "/usuarios" },
              { label: "Nuevo usuario" },
            ]}
          />
          <UserForm />
        </>
      </PermissionGuard>
    </MainLayout>
  );
}
