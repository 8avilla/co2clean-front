import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { CarbonFootprintParameters } from '@/components/CarbonFootprint/components/CarbonFootprintParameters';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';

export default function CarbonFootprintParametersPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.MANAGE_EMISSION_FACTORS} redirectTo="/">
        <div className="max-w-7xl mx-auto">
          <CarbonFootprintParameters />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
