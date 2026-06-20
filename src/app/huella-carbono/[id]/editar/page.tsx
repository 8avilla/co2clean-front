import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { CarbonFootprintEditForm } from '@/components/CarbonFootprint/components/CarbonFootprintEditForm';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCarbonFootprintPage({ params }: Props) {
  const { id } = await params;
  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.CREATE_CARBON_FOOTPRINT} redirectTo="/huella-carbono">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <CarbonFootprintEditForm recordId={id} />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
