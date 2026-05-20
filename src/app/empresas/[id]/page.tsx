'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { CompanyForm } from '@/components/Companies/components/CompanyForm';
import { BranchList } from '@/components/Companies/components/BranchList';
import { CompanyService } from '@/components/Companies/services/company.service';
import { ApiCompany, ApiHeadquarter } from '@/components/Companies/types';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { PermissionCode } from '@/shared/constants/permissions';
import { Loader2 } from 'lucide-react';

export default function EditCompanyPage() {
  const params = useParams();
  const id = params.id as string;
  const [company, setCompany] = useState<ApiCompany | null>(null);
  const [headquarters, setHeadquarters] = useState<ApiHeadquarter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyData, hqData] = await Promise.all([
          CompanyService.getCompanyById(id),
          CompanyService.getHeadquarters(id),
        ]);
        setCompany(companyData);
        setHeadquarters(hqData);
      } catch (error) {
        console.error('Error fetching company:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-teal-600" size={40} />
        </div>
      </MainLayout>
    );
  }

  if (!company) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-zinc-900">Empresa no encontrada</h2>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PermissionGuard permission={PermissionCode.UPDATE_COMPANIES} redirectTo="/empresas">
        <div className="space-y-10">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Editar Empresa</h1>
            <p className="text-sm text-zinc-500">Modifica los datos de la compañía y gestiona sus sedes.</p>
          </div>

          <section className="space-y-6">
            <CompanyForm initialData={company} isEditing />
          </section>

          <section className="pt-6">
            <BranchList companyId={company.id!} initialBranches={headquarters} />
          </section>
        </div>
      </PermissionGuard>
    </MainLayout>
  );
}
