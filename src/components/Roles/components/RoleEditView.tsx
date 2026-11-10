'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import { useEntityLoader } from '@/shared/hooks/useEntityLoader';
import { EntityLoadState } from '@/shared/components/Common/EntityLoadState';
import { RoleService } from '../services/role.service';
import { RoleForm } from './RoleForm';
import { Breadcrumbs } from '@/shared/components/Common/Breadcrumbs';

export const RoleEditView = ({ roleId }: { roleId: string }) => {
  const loadRole = useCallback(() => RoleService.getRoleById(roleId), [roleId]);
  const { data: role, status, reload } = useEntityLoader(loadRole);
  const [usersCount, setUsersCount] = useState<number | undefined>(undefined);

  // Best effort: the banner is informative, so a failure here must not block editing
  useEffect(() => {
    let isMounted = true;
    RoleService.getRoleDeletionImpact(roleId)
      .then(impact => {
        if (isMounted) setUsersCount(impact.users);
      })
      .catch(() => {
        if (isMounted) setUsersCount(undefined);
      });
    return () => {
      isMounted = false;
    };
  }, [roleId]);

  if (status !== 'ready' || !role) {
    return (
      <EntityLoadState
        status={status === 'ready' ? 'loading' : status}
        entityLabel="el rol"
        gender="m"
        backHref="/roles"
        backLabel="Volver a roles"
        icon={ShieldCheck}
        onRetry={reload}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Breadcrumbs items={[{ label: 'Roles y permisos', href: '/roles' }, { label: role.name }]} />
      {usersCount !== undefined && usersCount > 0 && (
        <div
          role="status"
          className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm"
        >
          <Users size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            {usersCount === 1 ? '1 usuario tiene este rol' : `${usersCount} usuarios tienen este rol`}
            : los cambios de permisos los afectarán al guardar.
          </p>
        </div>
      )}
      <RoleForm initialData={role} isEditing />
    </div>
  );
};
