import { vi, describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApiError } from '@/shared/lib/api-client';
import { useEntityLoader } from '../useEntityLoader';

describe('useEntityLoader', () => {
  it('debería pasar de loading a ready con los datos', async () => {
    const loader = vi.fn().mockResolvedValue({ id: '1' });
    const { result } = renderHook(() => useEntityLoader(loader));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.data).toEqual({ id: '1' });
  });

  it('debería marcar not-found cuando la respuesta es nula', async () => {
    const { result } = renderHook(() => useEntityLoader(() => Promise.resolve(null)));
    await waitFor(() => expect(result.current.status).toBe('not-found'));
  });

  it('debería marcar not-found ante un ApiError 404', async () => {
    const loader = () => Promise.reject(new ApiError('no existe', 404));
    const { result } = renderHook(() => useEntityLoader(loader));
    await waitFor(() => expect(result.current.status).toBe('not-found'));
  });

  it('debería marcar error ante cualquier otro fallo', async () => {
    const serverError = () => Promise.reject(new ApiError('boom', 500));
    const { result, unmount } = renderHook(() => useEntityLoader(serverError));
    await waitFor(() => expect(result.current.status).toBe('error'));
    unmount();

    const networkError = () => Promise.reject(new Error('network'));
    const second = renderHook(() => useEntityLoader(networkError));
    await waitFor(() => expect(second.result.current.status).toBe('error'));
  });

  it('reload debería reintentar y recuperarse', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue({ id: '2' });
    const { result } = renderHook(() => useEntityLoader(loader));
    await waitFor(() => expect(result.current.status).toBe('error'));

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.data).toEqual({ id: '2' });
  });
});
