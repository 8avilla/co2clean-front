import { MainLayout } from "@/shared/components/Layout/MainLayout";
import { CarbonFootprintForm } from "@/components/CarbonFootprint/components/CarbonFootprintForm";
import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { PermissionCode } from "@/shared/constants/permissions";
import { Breadcrumbs } from "@/shared/components/Common/Breadcrumbs";

export default function NewCarbonFootprintPage() {
  return (
    <MainLayout>
      <PermissionGuard
        permission={PermissionCode.CREATE_CARBON_FOOTPRINT}
        redirectTo="/huella-carbono"
      >
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs
            className="max-w-5xl mx-auto mb-4"
            items={[
              { label: "Huella de carbono" },
              { label: "Actividades", href: "/huella-carbono" },
              { label: "Registrar actividad" },
            ]}
          />
          <CarbonFootprintForm />
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
