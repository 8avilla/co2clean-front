import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { EmissionSourceCategoryList } from "@/components/Settings/components/EmissionSourceCategoryList";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";
import { Metadata } from "next";
import { Breadcrumbs } from "@/shared/components/Common/Breadcrumbs";

export const metadata: Metadata = {
  title: "Tipos de Fuentes de Emisión | EcoCore",
};

export default function EmissionSourceCategoriesPage() {
  return (
    <MainLayout>
      <PermissionGuard
        permission={PermissionCode.MANAGE_EMISSION_SOURCE_CATEGORIES}
      >
        <div className="space-y-4">
          <Breadcrumbs
            items={[{ label: "Configuración" }, { label: "Tipos de fuente" }]}
          />
          <EmissionSourceCategoryList />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
