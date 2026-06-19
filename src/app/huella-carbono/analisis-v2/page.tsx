import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { AnalysisV2Page } from '@/components/CarbonFootprint/components/AnalysisV2/AnalysisV2Page';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';

export default function CarbonFootprintAnalysisV2Page() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.VIEW_CARBON_FOOTPRINT_ANALYSIS} redirectTo="/">
        <div className="max-w-7xl mx-auto">
          <AnalysisV2Page />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
