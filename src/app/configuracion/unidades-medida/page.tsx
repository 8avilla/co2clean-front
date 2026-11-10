import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { EmissionUnitList } from "@/components/Settings/components/EmissionUnitList";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";
import { Metadata } from "next";
import { Breadcrumbs } from "@/shared/components/Common/Breadcrumbs";

export const metadata: Metadata = {
  title: "Unidades de Medida | EcoCore",
};

export default function EmissionUnitsPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.MANAGE_EMISSION_SOURCES}>
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { label: "Configuración" },
              { label: "Unidades de medida" },
            ]}
          />
          <EmissionUnitList />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
