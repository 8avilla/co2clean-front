import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { AnalysisV2Page } from "@/components/CarbonFootprint/components/AnalysisV2/AnalysisV2Page";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";
import { Breadcrumbs } from "@/shared/components/Common/Breadcrumbs";

export default function CarbonFootprintAnalysisV2Page() {
  return (
    <MainLayout>
      <PermissionGuard
        permission={PermissionCode.VIEW_CARBON_FOOTPRINT_ANALYSIS}
        redirectTo="/"
      >
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            className="mb-4"
            items={[{ label: "Huella de carbono" }, { label: "Análisis" }]}
          />
          <AnalysisV2Page />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
