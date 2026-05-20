import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { CarbonFootprintAnalysisList } from '@/components/CarbonFootprint/components/CarbonFootprintAnalysisList';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';

export default function CarbonFootprintAnalysisPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.VIEW_CARBON_FOOTPRINT_ANALYSIS} redirectTo="/">
        <div className="max-w-7xl mx-auto">
          <CarbonFootprintAnalysisList />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
