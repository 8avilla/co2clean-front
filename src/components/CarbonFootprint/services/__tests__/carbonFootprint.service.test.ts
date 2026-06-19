import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CarbonFootprintService } from '../carbonFootprint.service';
import type { CarbonFootprintFilters, UploadCsvParams, ApiCarbonFootprint } from '../../types';

vi.mock('@/shared/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/shared/lib/api-client';
const mockApiFetch = vi.mocked(apiFetch);

const mockRecord: ApiCarbonFootprint = {
  id: 'cf-1',
  year: 2024,
  item: 'Gas Natural',
  quantity: 1000,
  loadMode: 'Annual',
  headquarterId: 'hq-1',
  companyId: 'co-1',
  createdAt: '2024-01-01T00:00:00Z',
};

const baseFilters: CarbonFootprintFilters = {
  companyId: 'co-1',
  year: 2024,
};

const csvParams: UploadCsvParams = {
  year: '2024',
  nit: '900123456',
  headquarterId: 'hq-1',
  emissionGroupId: 'eg-1',
  emissionSourceCategoryId: 'esc-1',
};

describe('CarbonFootprintService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── CF-S-01 a CF-S-04: uploadCsv ──────────────────────────────────────

  describe('CF-S-01 — uploadCsv envía el archivo como campo "file" en FormData', () => {
    it('agrega el archivo como campo "file" en el FormData', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      const file = new File(['a,b,c'], 'datos.csv', { type: 'text/csv' });
      await CarbonFootprintService.uploadCsv(file, csvParams);
      const body = mockApiFetch.mock.calls[0][1]?.body as FormData;
      expect(body).toBeInstanceOf(FormData);
      expect(body.get('file')).toBe(file);
    });
  });

  describe('CF-S-02 — uploadCsv incluye todos los campos requeridos en FormData', () => {
    it('incluye year, nit, headquarterId, emissionGroupId y emissionSourceCategoryId', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      await CarbonFootprintService.uploadCsv(file, csvParams);
      const body = mockApiFetch.mock.calls[0][1]?.body as FormData;
      expect(body.get('year')).toBe('2024');
      expect(body.get('nit')).toBe('900123456');
      expect(body.get('headquarterId')).toBe('hq-1');
      expect(body.get('emissionGroupId')).toBe('eg-1');
      expect(body.get('emissionSourceCategoryId')).toBe('esc-1');
    });

    it('llama a POST /api/carbon-footprint/upload', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      const file = new File([''], 'test.csv');
      await CarbonFootprintService.uploadCsv(file, csvParams);
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/carbon-footprint/upload',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('CF-S-03 — uploadCsv omite emissionSubsourceId si es undefined', () => {
    it('no agrega emissionSubsourceId al FormData cuando no se proporciona', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      const file = new File([''], 'test.csv');
      await CarbonFootprintService.uploadCsv(file, { ...csvParams, emissionSubsourceId: undefined });
      const body = mockApiFetch.mock.calls[0][1]?.body as FormData;
      expect(body.has('emissionSubsourceId')).toBe(false);
    });

    it('sí agrega emissionSubsourceId al FormData cuando se proporciona', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      const file = new File([''], 'test.csv');
      await CarbonFootprintService.uploadCsv(file, { ...csvParams, emissionSubsourceId: 'sub-1' });
      const body = mockApiFetch.mock.calls[0][1]?.body as FormData;
      expect(body.get('emissionSubsourceId')).toBe('sub-1');
    });
  });

  describe('CF-S-04 — uploadCsv omite emissionUnitId si es undefined', () => {
    it('no agrega emissionUnitId al FormData cuando no se proporciona', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      const file = new File([''], 'test.csv');
      await CarbonFootprintService.uploadCsv(file, { ...csvParams, emissionUnitId: undefined });
      const body = mockApiFetch.mock.calls[0][1]?.body as FormData;
      expect(body.has('emissionUnitId')).toBe(false);
    });

    it('sí agrega emissionUnitId al FormData cuando se proporciona', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      const file = new File([''], 'test.csv');
      await CarbonFootprintService.uploadCsv(file, { ...csvParams, emissionUnitId: 'unit-1' });
      const body = mockApiFetch.mock.calls[0][1]?.body as FormData;
      expect(body.get('emissionUnitId')).toBe('unit-1');
    });
  });

  // ── CF-S-05 / CF-S-06: getCarbonFootprints ────────────────────────────

  describe('CF-S-05 — getCarbonFootprints pasa todos los filtros como query params', () => {
    it('incluye todos los filtros en params', async () => {
      mockApiFetch.mockResolvedValue([]);
      const filters: CarbonFootprintFilters = {
        companyId: 'co-1',
        year: 2024,
        headquarterId: 'hq-1',
        emissionGroupId: 'eg-1',
        emissionSourceCategoryId: 'esc-1',
        emissionSubsourceId: 'sub-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      await CarbonFootprintService.getCarbonFootprints(filters);
      const params = mockApiFetch.mock.calls[0][1]?.params as Record<string, unknown>;
      expect(params).toMatchObject({
        companyId: 'co-1',
        year: 2024,
        headquarterId: 'hq-1',
        emissionGroupId: 'eg-1',
        emissionSourceCategoryId: 'esc-1',
        emissionSubsourceId: 'sub-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
    });

    it('mapea correctamente el array de respuesta', async () => {
      mockApiFetch.mockResolvedValue([mockRecord]);
      const result = await CarbonFootprintService.getCarbonFootprints(baseFilters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cf-1');
    });
  });

  describe('CF-S-06 — getCarbonFootprints usa limit: 100 y page: 1 por defecto', () => {
    it('usa page: 1 y limit: 100 cuando no se especifican', async () => {
      mockApiFetch.mockResolvedValue([]);
      await CarbonFootprintService.getCarbonFootprints(baseFilters);
      const params = mockApiFetch.mock.calls[0][1]?.params as Record<string, unknown>;
      expect(params).toMatchObject({ page: 1, limit: 100 });
    });

    it('respeta los valores de page y limit cuando se proporcionan', async () => {
      mockApiFetch.mockResolvedValue([]);
      await CarbonFootprintService.getCarbonFootprints({ ...baseFilters, page: 2, limit: 50 });
      const params = mockApiFetch.mock.calls[0][1]?.params as Record<string, unknown>;
      expect(params).toMatchObject({ page: 2, limit: 50 });
    });

    it('devuelve [] si la API responde null', async () => {
      mockApiFetch.mockResolvedValue(null);
      const result = await CarbonFootprintService.getCarbonFootprints(baseFilters);
      expect(result).toEqual([]);
    });
  });

  // ── CF-S-07: updateCarbonFootprint ────────────────────────────────────

  describe('CF-S-07 — updateCarbonFootprint llama a PUT /api/carbon-footprint/:id', () => {
    it('llama al endpoint correcto con el id', async () => {
      mockApiFetch.mockResolvedValue(mockRecord);
      await CarbonFootprintService.updateCarbonFootprint('cf-1', { year: 2025 });
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/carbon-footprint/cf-1',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('envía el payload en el body', async () => {
      mockApiFetch.mockResolvedValue(mockRecord);
      await CarbonFootprintService.updateCarbonFootprint('cf-1', { year: 2025, item: 'Diesel' });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toMatchObject({ year: 2025, item: 'Diesel' });
    });
  });

  // ── CF-S-08: deleteCarbonFootprint ────────────────────────────────────

  describe('CF-S-08 — deleteCarbonFootprint llama a DELETE /api/carbon-footprint/:id', () => {
    it('llama al endpoint correcto con el id', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await CarbonFootprintService.deleteCarbonFootprint('cf-42');
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/carbon-footprint/cf-42',
        { method: 'DELETE' }
      );
    });
  });

  // ── CF-S-09: deleteByFilters ───────────────────────────────────────────

  describe('CF-S-09 — deleteByFilters usa DELETE con query params (no body)', () => {
    it('llama a DELETE /api/carbon-footprint', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await CarbonFootprintService.deleteByFilters({ companyId: 'co-1', year: 2024 });
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/carbon-footprint',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('pasa los filtros como params (no body)', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await CarbonFootprintService.deleteByFilters({
        companyId: 'co-1',
        year: 2024,
        emissionGroupId: 'eg-1',
      });
      const call = mockApiFetch.mock.calls[0][1] as Record<string, unknown>;
      expect(call).toHaveProperty('params');
      expect(call).not.toHaveProperty('body');
      const params = call.params as Record<string, unknown>;
      expect(params).toMatchObject({ companyId: 'co-1', year: 2024, emissionGroupId: 'eg-1' });
    });

    it('incluye todos los filtros opcionales en params', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await CarbonFootprintService.deleteByFilters({
        companyId: 'co-1',
        year: 2024,
        headquarterId: 'hq-1',
        emissionSourceCategoryId: 'esc-1',
        emissionSubsourceId: 'sub-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      const params = mockApiFetch.mock.calls[0][1]?.params as Record<string, unknown>;
      expect(params).toMatchObject({
        headquarterId: 'hq-1',
        emissionSourceCategoryId: 'esc-1',
        emissionSubsourceId: 'sub-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
    });
  });
});
