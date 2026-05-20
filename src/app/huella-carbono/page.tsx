import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { CarbonFootprintRegistrationList } from '@/components/CarbonFootprint/components/CarbonFootprintList';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';

export default function CarbonFootprintPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.VIEW_CARBON_FOOTPRINT} redirectTo="/">
        <div className="max-w-7xl mx-auto">
          <CarbonFootprintRegistrationList />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
