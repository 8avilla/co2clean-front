import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { CompanyForm } from "@/components/Companies/components/CompanyForm";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";
import { Metadata } from "next";
import { Breadcrumbs } from "@/shared/components/Common/Breadcrumbs";

export const metadata: Metadata = {
  title: "Nueva empresa | EcoCore",
};

export default function NewCompanyPage() {
  return (
    <MainLayout>
      <PermissionGuard
        permission={PermissionCode.CREATE_COMPANIES}
        redirectTo="/empresas"
      >
        <>
          <Breadcrumbs
            className="max-w-4xl mx-auto mb-4"
            items={[
              { label: "Empresas", href: "/empresas" },
              { label: "Nueva empresa" },
            ]}
          />
          <CompanyForm />
        </>
      </PermissionGuard>
    </MainLayout>
  );
}
