import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { confirmDialog } from '@/shared/lib/confirm-dialog';
import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard';

vi.mock('@/shared/lib/confirm-dialog', () => ({ confirmDialog: vi.fn() }));

const mockConfirmDialog = vi.mocked(confirmDialog);

const dispatchBeforeUnload = (): Event => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe('useUnsavedChangesGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirmLeave debería permitir salir sin preguntar cuando no hay cambios', async () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(false));
    await expect(result.current.confirmLeave()).resolves.toBe(true);
    expect(mockConfirmDialog).not.toHaveBeenCalled();
  });

  it('confirmLeave debería preguntar cuando hay cambios y respetar la respuesta', async () => {
    mockConfirmDialog.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { result } = renderHook(() => useUnsavedChangesGuard(true));
    await expect(result.current.confirmLeave()).resolves.toBe(false);
    await expect(result.current.confirmLeave()).resolves.toBe(true);
    expect(mockConfirmDialog).toHaveBeenCalledTimes(2);
  });

  it('debería bloquear el cierre de la pestaña solo cuando hay cambios', () => {
    const { rerender } = renderHook(({ dirty }) => useUnsavedChangesGuard(dirty), {
      initialProps: { dirty: false },
    });
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

    rerender({ dirty: true });
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

    rerender({ dirty: false });
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it('debería quitar el listener al desmontar', () => {
    const { unmount } = renderHook(() => useUnsavedChangesGuard(true));
    unmount();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });
});
