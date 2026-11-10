import { vi, describe, it, expect, afterEach } from 'vitest';
import { ApiError, apiFetch } from '../api-client';

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('debería lanzar ApiError con el estado HTTP y el mensaje del servidor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Empresa no encontrada' }),
      }),
    );

    const error = await apiFetch('/api/companies/x').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    expect((error as ApiError).status).toBe(404);
    expect((error as ApiError).message).toBe('Empresa no encontrada');
  });

  it('debería usar un mensaje por defecto cuando la respuesta no trae cuerpo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => {
          throw new Error('no body');
        },
      }),
    );

    await expect(apiFetch('/api/x')).rejects.toMatchObject({
      status: 500,
      message: 'Error 500: Server Error',
    });
  });
});
