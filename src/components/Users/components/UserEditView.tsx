'use client';

import { useCallback, useState } from 'react';
import { Building2, User as UserIcon } from 'lucide-react';
import { useEntityLoader } from '@/shared/hooks/useEntityLoader';
import { EntityLoadState } from '@/shared/components/Common/EntityLoadState';
import { FORM_WIDTH } from '@/shared/components/Common/form-styles';
import { UserService } from '../services/user.service';
import { UserForm } from './UserForm';
import { UserCompaniesPanel } from './UserCompaniesPanel';
import { Breadcrumbs } from '@/shared/components/Common/Breadcrumbs';

type UserTab = 'profile' | 'companies';

const getInitialTab = (): UserTab => {
  if (typeof window === 'undefined') return 'profile';
  return new URLSearchParams(window.location.search).get('tab') === 'empresas' ? 'companies' : 'profile';
};

export const UserEditView = ({ userId }: { userId: string }) => {
  const loadUser = useCallback(() => UserService.getUserById(userId), [userId]);
  const { data: user, status, reload } = useEntityLoader(loadUser);
  const [activeTab, setActiveTab] = useState<UserTab>(getInitialTab);
  const [companiesCount, setCompaniesCount] = useState<number | undefined>(undefined);

  if (status !== 'ready' || !user) {
    return (
      <EntityLoadState
        status={status === 'ready' ? 'loading' : status}
        entityLabel="el usuario"
        gender="m"
        backHref="/usuarios"
        backLabel="Volver a usuarios"
        icon={UserIcon}
        onRetry={reload}
      />
    );
  }

  // Super administrators have global access, so company associations do not apply to them
  const showCompaniesTab = !user.isSuperAdmin;
  const currentTab: UserTab = showCompaniesTab ? activeTab : 'profile';

  return (
    <div className={`${FORM_WIDTH.standard} mx-auto space-y-4`}>
      <Breadcrumbs items={[{ label: 'Usuarios', href: '/usuarios' }, { label: user.name }]} />
      {showCompaniesTab && (
        <div role="tablist" aria-label="Secciones del usuario" className="flex border-b border-zinc-200">
          <button
            role="tab"
            id="user-tab-profile"
            aria-selected={currentTab === 'profile'}
            aria-controls="user-panel-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              currentTab === 'profile'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <UserIcon size={15} />
            Perfil
          </button>
          <button
            role="tab"
            id="user-tab-companies"
            aria-selected={currentTab === 'companies'}
            aria-controls="user-panel-companies"
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              currentTab === 'companies'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Building2 size={15} />
            Empresas y roles
            {companiesCount !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                  companiesCount === 0 ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {companiesCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Both panels stay mounted so unsaved profile edits survive switching tabs */}
      <div
        role="tabpanel"
        id="user-panel-profile"
        aria-labelledby="user-tab-profile"
        hidden={currentTab !== 'profile'}
      >
        <UserForm initialData={user} isEditing />
      </div>
      {showCompaniesTab && (
        <div
          role="tabpanel"
          id="user-panel-companies"
          aria-labelledby="user-tab-companies"
          hidden={currentTab !== 'companies'}
        >
          <UserCompaniesPanel userId={user.id} onCountChange={setCompaniesCount} />
        </div>
      )}
    </div>
  );
};
