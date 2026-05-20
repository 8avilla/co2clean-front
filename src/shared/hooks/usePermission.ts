'use client';

import { useState, useEffect, useCallback } from 'react';
import { PermissionCodeType } from '@/shared/constants/permissions';

interface StoredUser {
  permissions?: string[];
  isSuperAdmin?: boolean;
}

function readUserFromStorage(): StoredUser {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return {};
    return JSON.parse(stored) as StoredUser;
  } catch {
    return {};
  }
}

export const usePermission = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const syncFromStorage = useCallback(() => {
    const user = readUserFromStorage();
    setPermissions(Array.isArray(user.permissions) ? user.permissions : []);
    setIsSuperAdmin(user.isSuperAdmin === true);
  }, []);

  useEffect(() => {
    syncFromStorage();
    setIsInitialized(true);

    // Keep in sync when localStorage changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'user') syncFromStorage();
    };

    // Keep in sync when company is switched in the same tab
    window.addEventListener('storage', handleStorage);
    window.addEventListener('user:updated', syncFromStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('user:updated', syncFromStorage);
    };
  }, [syncFromStorage]);

  // Super admins bypass all permission checks
  const hasPermission = useCallback(
    (_code: PermissionCodeType): boolean => isSuperAdmin || permissions.includes(_code),
    [isSuperAdmin, permissions]
  );

  const hasAnyPermission = useCallback(
    (codes: PermissionCodeType[]): boolean =>
      isSuperAdmin || codes.some((code) => permissions.includes(code)),
    [isSuperAdmin, permissions]
  );

  const hasAllPermissions = useCallback(
    (codes: PermissionCodeType[]): boolean =>
      isSuperAdmin || codes.every((code) => permissions.includes(code)),
    [isSuperAdmin, permissions]
  );

  return { permissions, isSuperAdmin, isInitialized, hasPermission, hasAnyPermission, hasAllPermissions };
};
