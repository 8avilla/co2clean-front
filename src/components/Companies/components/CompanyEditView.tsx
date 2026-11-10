'use client';

import { useCallback, useState } from 'react';
import { Building, Building2 } from 'lucide-react';
import { useEntityLoader } from '@/shared/hooks/useEntityLoader';
import { EntityLoadState } from '@/shared/components/Common/EntityLoadState';
import { CompanyService } from '../services/company.service';
import { CompanyForm } from './CompanyForm';
import { BranchList } from './BranchList';
import { FORM_WIDTH } from '@/shared/components/Common/form-styles';
import { Breadcrumbs } from '@/shared/components/Common/Breadcrumbs';

type CompanyTab = 'info' | 'headquarters';

const getInitialTab = (): CompanyTab => {
  if (typeof window === 'undefined') return 'info';
  return new URLSearchParams(window.location.search).get('tab') === 'sedes' ? 'headquarters' : 'info';
};

export const CompanyEditView = ({ companyId }: { companyId: string }) => {
  const loadCompany = useCallback(
    async () => {
      const [company, headquarters] = await Promise.all([
        CompanyService.getCompanyById(companyId),
        CompanyService.getHeadquarters(companyId),
      ]);
      return company ? { company, headquarters } : null;
    },
    [companyId],
  );
  const { data, status, reload } = useEntityLoader(loadCompany);
  const [activeTab, setActiveTab] = useState<CompanyTab>(getInitialTab);
  const [countOverride, setCountOverride] = useState<number | undefined>(undefined);

  if (status !== 'ready' || !data) {
    return (
      <EntityLoadState
        status={status === 'ready' ? 'loading' : status}
        entityLabel="la empresa"
        gender="f"
        backHref="/empresas"
        backLabel="Volver a empresas"
        icon={Building2}
        onRetry={reload}
      />
    );
  }

  const { company, headquarters } = data;
  const headquartersCount = countOverride ?? headquarters.length;

  const tabs: { id: CompanyTab; label: string; icon: typeof Building2; count?: number }[] = [
    { id: 'info', label: 'Datos de la empresa', icon: Building2 },
    { id: 'headquarters', label: 'Sedes', icon: Building, count: headquartersCount },
  ];

  return (
    <div className={`${FORM_WIDTH.standard} mx-auto space-y-4`}>
      <Breadcrumbs items={[{ label: 'Empresas', href: '/empresas' }, { label: company.name }]} />
      <div role="tablist" aria-label="Secciones de la empresa" className="flex border-b border-zinc-200">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`company-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`company-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Icon size={15} />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                    tab.count === 0 ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Both panels stay mounted so unsaved form edits survive switching tabs */}
      <div
        role="tabpanel"
        id="company-panel-info"
        aria-labelledby="company-tab-info"
        hidden={activeTab !== 'info'}
      >
        <CompanyForm initialData={company} isEditing />
      </div>
      <div
        role="tabpanel"
        id="company-panel-headquarters"
        aria-labelledby="company-tab-headquarters"
        hidden={activeTab !== 'headquarters'}
      >
        <BranchList
          companyId={company.id}
          company={company}
          initialBranches={headquarters}
          onCountChange={setCountOverride}
        />
      </div>
    </div>
  );
};
