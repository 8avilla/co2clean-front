import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { CarbonFootprintParameters } from "@/components/CarbonFootprint/components/CarbonFootprintParameters";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";
import { Breadcrumbs } from "@/shared/components/Common/Breadcrumbs";

export default function CarbonFootprintParametersPage() {
  return (
    <MainLayout>
      <PermissionGuard
        permission={PermissionCode.MANAGE_EMISSION_FACTORS}
        redirectTo="/"
      >
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            className="mb-4"
            items={[
              { label: "Huella de carbono" },
              { label: "Factores de emisión" },
            ]}
          />
          <CarbonFootprintParameters />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
