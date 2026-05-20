import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { CarbonFootprintForm } from '@/components/CarbonFootprint/components/CarbonFootprintForm';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';

export default function NewCarbonFootprintPage() {
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.CREATE_CARBON_FOOTPRINT} redirectTo="/huella-carbono">
        <div className="max-w-6xl mx-auto">
          <CarbonFootprintForm />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
