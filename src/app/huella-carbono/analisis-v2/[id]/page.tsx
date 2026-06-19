import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { AnalysisV2ResultsPage } from '@/components/CarbonFootprint/components/AnalysisV2/AnalysisV2ResultsPage';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CarbonFootprintAnalysisV2ResultsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.VIEW_CARBON_FOOTPRINT_ANALYSIS} redirectTo="/">
        <div className="max-w-7xl mx-auto">
          <AnalysisV2ResultsPage analysisId={id} />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
