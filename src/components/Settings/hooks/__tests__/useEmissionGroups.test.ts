import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { EmissionGroupsService } from '@/components/CarbonFootprint/services/catalogs.service';
import { useEmissionGroups, resetEmissionGroupsCache } from '../useEmissionGroups';
import { emissionGroupsFixture, EMISSION_GROUP_IDS } from '../../test-utils/emission-groups.fixture';

vi.mock('@/components/CarbonFootprint/services/catalogs.service', () => ({
  EmissionGroupsService: { getAll: vi.fn() },
}));

const mockService = vi.mocked(EmissionGroupsService);

describe('useEmissionGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetEmissionGroupsCache();
  });

  it('debería cargar los grupos desde la API y mapearlos a id/label', async () => {
    mockService.getAll.mockResolvedValue(emissionGroupsFixture);
    const { result } = renderHook(() => useEmissionGroups());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups).toHaveLength(3);
    expect(result.current.groups[0]).toEqual({
      id: EMISSION_GROUP_IDS.scope1,
      label: 'Alcance 1 — Emisiones Directas de GEI',
    });
  });

  it('debería resolver el nombre de un grupo por su id', async () => {
    mockService.getAll.mockResolvedValue(emissionGroupsFixture);
    const { result } = renderHook(() => useEmissionGroups());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.getGroupLabel(EMISSION_GROUP_IDS.scope2)).toContain('Alcance 2');
    expect(result.current.getGroupLabel('unknown')).toBe('');
  });

  it('debería reutilizar la caché entre consumidores', async () => {
    mockService.getAll.mockResolvedValue(emissionGroupsFixture);
    const first = renderHook(() => useEmissionGroups());
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));

    const second = renderHook(() => useEmissionGroups());
    expect(second.result.current.groups).toHaveLength(3);
    expect(mockService.getAll).toHaveBeenCalledTimes(1);
  });

  it('debería marcar hasError cuando la API falla y permitir reintentar', async () => {
    mockService.getAll.mockRejectedValueOnce(new Error('network'));
    const failed = renderHook(() => useEmissionGroups());
    await waitFor(() => expect(failed.result.current.hasError).toBe(true));
    expect(failed.result.current.groups).toEqual([]);

    mockService.getAll.mockResolvedValue(emissionGroupsFixture);
    const retried = renderHook(() => useEmissionGroups());
    await waitFor(() => expect(retried.result.current.groups).toHaveLength(3));
  });
});
