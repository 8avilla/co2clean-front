import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  UnitTypesService,
  EmissionGroupsService,
  EmissionSourcesService,
  EmissionSubsourcesService,
  EmissionUnitsService,
  EmissionFactorsService,
} from '../catalogs.service';

vi.mock('@/shared/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/shared/lib/api-client';
const mockApiFetch = vi.mocked(apiFetch);

describe('UnitTypesService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama a GET /api/unit-types con limit: 100', async () => {
    mockApiFetch.mockResolvedValue([]);
    await UnitTypesService.getAll();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/unit-types', {
      params: { limit: 100, search: undefined },
    });
  });

  it('incluye search en params cuando se proporciona', async () => {
    mockApiFetch.mockResolvedValue([]);
    await UnitTypesService.getAll('energía');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/unit-types', {
      params: { limit: 100, search: 'energía' },
    });
  });

  it('devuelve [] si la API responde null', async () => {
    mockApiFetch.mockResolvedValue(null);
    expect(await UnitTypesService.getAll()).toEqual([]);
  });

  it('llama a POST /api/unit-types al crear', async () => {
    const payload = { name: 'Energía', code: 'ENE' };
    mockApiFetch.mockResolvedValue({ id: 'ut-1', ...payload });
    await UnitTypesService.create(payload);
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/unit-types',
      expect.objectContaining({ method: 'POST', body: payload })
    );
  });

  it('llama a PUT /api/unit-types/:id al actualizar', async () => {
    mockApiFetch.mockResolvedValue({ id: 'ut-1', name: 'Nuevo', code: 'NUE' });
    await UnitTypesService.update('ut-1', { name: 'Nuevo' });
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/unit-types/ut-1',
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('llama a DELETE /api/unit-types/:id al eliminar', async () => {
    mockApiFetch.mockResolvedValue(undefined);
    await UnitTypesService.delete('ut-99');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/unit-types/ut-99', { method: 'DELETE' });
  });
});

// ── CS-01: EmissionGroupsService ────────────────────────────────────────────

describe('CS-01 — EmissionGroupsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama a GET /api/emission-groups con limit: 100', async () => {
    mockApiFetch.mockResolvedValue([]);
    await EmissionGroupsService.getAll();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/emission-groups', {
      params: { limit: 100 },
    });
  });

  it('incluye standard en params cuando se proporciona', async () => {
    mockApiFetch.mockResolvedValue([]);
    await EmissionGroupsService.getAll({ standard: 'GHG_Protocol' });
    expect(mockApiFetch).toHaveBeenCalledWith('/api/emission-groups', {
      params: { limit: 100, standard: 'GHG_Protocol' },
    });
  });

  it('devuelve [] si la API responde null', async () => {
    mockApiFetch.mockResolvedValue(null);
    expect(await EmissionGroupsService.getAll()).toEqual([]);
  });

  it('llama a POST /api/emission-groups al crear', async () => {
    const payload = { name: 'Alcance 1', code: 'A1', standard: 'GHG_Protocol' as const };
    mockApiFetch.mockResolvedValue({ id: 'eg-1', ...payload });
    await EmissionGroupsService.create(payload);
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/emission-groups',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('llama a DELETE /api/emission-groups/:id al eliminar', async () => {
    mockApiFetch.mockResolvedValue(undefined);
    await EmissionGroupsService.delete('eg-1');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/emission-groups/eg-1', { method: 'DELETE' });
  });
});

// ── CS-02: EmissionSourcesService ───────────────────────────────────────────

describe('CS-02 — EmissionSourcesService puede filtrar por emissionGroupId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama a GET /api/emission-source-categories con limit: 100', async () => {
    mockApiFetch.mockResolvedValue([]);
    await EmissionSourcesService.getAll();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/emission-source-categories', {
      params: { limit: 100 },
    });
  });

  it('incluye emissionGroupId en params como filtro', async () => {
    mockApiFetch.mockResolvedValue([]);
    await EmissionSourcesService.getAll({ emissionGroupId: 'eg-1' });
    const params = mockApiFetch.mock.calls[0][1]?.params as Record<string, unknown>;
    expect(params).toMatchObject({ limit: 100, emissionGroupId: 'eg-1' });
  });

  it('devuelve [] si la API responde null', async () => {
    mockApiFetch.mockResolvedValue(null);
    expect(await EmissionSourcesService.getAll()).toEqual([]);
  });
});

// ── CS-03: EmissionSubsourcesService ────────────────────────────────────────

describe('CS-03 — EmissionSubsourcesService filtra por emissionSourceCategoryId (cascada)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama a GET /api/emission-sources con limit: 100', async () => {
    mockApiFetch.mockResolvedValue([]);
    await EmissionSubsourcesService.getAll();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/emission-sources', {
      params: { limit: 100 },
    });
  });

  it('incluye emissionSourceCategoryId en params para el cascade de selects', async () => {
    mockApiFetch.mockResolvedValue([]);
    await EmissionSubsourcesService.getAll({ emissionSourceCategoryId: 'esc-1' });
    const params = mockApiFetch.mock.calls[0][1]?.params as Record<string, unknown>;
    expect(params).toMatchObject({ limit: 100, emissionSourceCategoryId: 'esc-1' });
  });

  it('devuelve [] si la API responde null', async () => {
    mockApiFetch.mockResolvedValue(null);
    expect(await EmissionSubsourcesService.getAll()).toEqual([]);
  });

  it('llama a POST /api/emission-sources al crear', async () => {
    const payload = { name: 'Caldera', code: 'CALD' };
    mockApiFetch.mockResolvedValue({ id: 'sub-1', ...payload });
    await EmissionSubsourcesService.create(payload);
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/emission-sources',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('llama a DELETE /api/emission-sources/:id al eliminar', async () => {
    mockApiFetch.mockResolvedValue(undefined);
    await EmissionSubsourcesService.delete('sub-7');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/emission-sources/sub-7', { method: 'DELETE' });
  });
});

// ── CS-04: EmissionUnitsService ─────────────────────────────────────────────

describe('CS-04 — EmissionUnitsService filtra por unitTypeId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama a GET /api/emission-units con limit: 100', async () => {
    mockApiFetch.mockResolvedValue([]);
    await EmissionUnitsService.getAll();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/emission-units', {
      params: { limit: 100 },
    });
  });

  it('incluye unitTypeId en params cuando se proporciona', async () => {
    mockApiFetch.mockResolvedValue([]);
    await EmissionUnitsService.getAll({ unitTypeId: 'ut-1' });
    const params = mockApiFetch.mock.calls[0][1]?.params as Record<string, unknown>;
    expect(params).toMatchObject({ limit: 100, unitTypeId: 'ut-1' });
  });

  it('devuelve [] si la API responde null', async () => {
    mockApiFetch.mockResolvedValue(null);
    expect(await EmissionUnitsService.getAll()).toEqual([]);
  });
});

// ── CS-05 ya cubierto en cada describe arriba ([] si null)

// ── CS-06: EmissionFactorsService ───────────────────────────────────────────

describe('CS-06 — EmissionFactorsService acepta múltiples filtros combinados', () => {
  beforeEach(() => vi.clearAllMocks());

  it('llama a GET /api/emission-factors con limit: 100', async () => {
    mockApiFetch.mockResolvedValue([]);
    await EmissionFactorsService.getAll();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/emission-factors', {
      params: { limit: 100 },
    });
  });

  it('incluye todos los filtros combinados en params', async () => {
    mockApiFetch.mockResolvedValue([]);
    await EmissionFactorsService.getAll({
      year: 2024,
      emissionGroupId: 'eg-1',
      emissionSourceId: 'esc-1',
      emissionSubsourceId: 'sub-1',
      search: 'diesel',
    });
    const params = mockApiFetch.mock.calls[0][1]?.params as Record<string, unknown>;
    expect(params).toMatchObject({
      limit: 100,
      year: 2024,
      emissionGroupId: 'eg-1',
      emissionSourceId: 'esc-1',
      emissionSubsourceId: 'sub-1',
      search: 'diesel',
    });
  });

  it('devuelve [] si la API responde null', async () => {
    mockApiFetch.mockResolvedValue(null);
    expect(await EmissionFactorsService.getAll()).toEqual([]);
  });

  it('llama a POST /api/emission-factors al crear', async () => {
    const payload = {
      gasId: 'gas-1',
      factor: 2.691,
      emissionUnitId: 'unit-1',
      gwp: 1,
      emissionSourceId: 'esc-1',
      emissionSourceCategoryId: 'cat-1',
    };
    mockApiFetch.mockResolvedValue({ id: 'ef-1', ...payload });
    await EmissionFactorsService.create(payload);
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/emission-factors',
      expect.objectContaining({ method: 'POST', body: payload })
    );
  });

  it('llama a DELETE /api/emission-factors/:id al eliminar', async () => {
    mockApiFetch.mockResolvedValue(undefined);
    await EmissionFactorsService.delete('ef-99');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/emission-factors/ef-99', { method: 'DELETE' });
  });
});
