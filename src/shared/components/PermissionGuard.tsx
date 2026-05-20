'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCodeType } from '@/shared/constants/permissions';

interface PermissionGuardProps {
  permission: PermissionCodeType;
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Waits for localStorage to be read, then redirects to `redirectTo` (default: '/')
 * with an error toast if the current user lacks the required permission.
 */
export const PermissionGuard = ({
  permission,
  children,
  redirectTo = '/',
}: PermissionGuardProps) => {
  const { hasPermission, isInitialized } = usePermission();
  const router = useRouter();

  const isAllowed = hasPermission(permission);

  useEffect(() => {
    if (isInitialized && !isAllowed) {
      toast.error('Acceso denegado', {
        description: 'No tienes permisos para acceder a esta sección.',
      });
      router.replace(redirectTo);
    }
  }, [isAllowed, isInitialized, redirectTo, router]);

  // Render nothing until permissions are loaded to avoid flash of content
  if (!isInitialized || !isAllowed) return null;

  return <>{children}</>;
};
