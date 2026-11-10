import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { EmissionSourceMasterDetail } from "@/components/Settings/components/EmissionSourceMasterDetail";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";
import { Metadata } from "next";
import { Breadcrumbs } from "@/shared/components/Common/Breadcrumbs";

export const metadata: Metadata = {
  title: "Fuentes de Emisión | EcoCore",
};

export default function EmissionSourcesPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.MANAGE_EMISSION_SOURCES}>
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { label: "Configuración" },
              { label: "Fuentes y factores" },
            ]}
          />
          <EmissionSourceMasterDetail />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
