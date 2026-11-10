'use client';

import { useCallback, useEffect } from 'react';
import { confirmDialog } from '@/shared/lib/confirm-dialog';

/**
 * Warns before losing unsaved form changes:
 * - the browser asks for confirmation when the tab is closed or reloaded
 * - `confirmLeave` opens a dialog for in-app exits (Cancel / Back buttons)
 */
export const useUnsavedChangesGuard = (isDirty: boolean) => {
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  /** Resolves to true when it is safe to leave the form. */
  const confirmLeave = useCallback(async (): Promise<boolean> => {
    if (!isDirty) return true;
    return confirmDialog({
      title: '¿Salir sin guardar?',
      text: 'Tienes cambios sin guardar que se perderán.',
      icon: 'warning',
      confirmText: 'Sí, salir',
      cancelText: 'Seguir editando',
    });
  }, [isDirty]);

  return { confirmLeave };
};
