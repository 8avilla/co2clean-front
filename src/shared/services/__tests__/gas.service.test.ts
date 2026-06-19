import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GasService, type ApiGreenhouseGas } from '../gas.service';

vi.mock('@/shared/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/shared/lib/api-client';
const mockApiFetch = vi.mocked(apiFetch);

const mockApiGas: ApiGreenhouseGas = {
  id: 'gas-1',
  code: 'co2',
  chemicalName: 'Dióxido de Carbono',
  formula: 'CO₂',
  gwp: 1,
  calculationType: 'NonBiogenic',
  isActive: true,
};

describe('GasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── mapToFront ──────────────────────────────────────────────────────────

  describe('mapToFront', () => {
    it('mapea NonBiogenic → non_biogenic', () => {
      expect(GasService.mapToFront(mockApiGas).calculation_type).toBe('non_biogenic');
    });

    it('mapea Biogenic → biogenic', () => {
      expect(
        GasService.mapToFront({ ...mockApiGas, calculationType: 'Biogenic' }).calculation_type
      ).toBe('biogenic');
    });

    it('mapea Both → both', () => {
      expect(
        GasService.mapToFront({ ...mockApiGas, calculationType: 'Both' }).calculation_type
      ).toBe('both');
    });

    it('mapea todos los campos correctamente', () => {
      const result = GasService.mapToFront(mockApiGas);
      expect(result).toEqual({
        id: 'gas-1',
        chemical_name: 'Dióxido de Carbono',
        formula: 'CO₂',
        gwp: 1,
        calculation_type: 'non_biogenic',
        is_active: true,
        description: undefined,
      });
    });

    it('mapea description cuando existe', () => {
      const result = GasService.mapToFront({ ...mockApiGas, description: 'Gas principal' });
      expect(result.description).toBe('Gas principal');
    });
  });

  // ── getGases ────────────────────────────────────────────────────────────

  describe('getGases', () => {
    it('llama al endpoint /api/gases con limit 1000', async () => {
      mockApiFetch.mockResolvedValue([mockApiGas]);
      await GasService.getGases();
      expect(mockApiFetch).toHaveBeenCalledWith('/api/gases', { params: { limit: 1000 } });
    });

    it('incluye search en los params cuando se proporciona', async () => {
      mockApiFetch.mockResolvedValue([]);
      await GasService.getGases('metano');
      expect(mockApiFetch).toHaveBeenCalledWith('/api/gases', {
        params: { limit: 1000, search: 'metano' },
      });
    });

    it('incluye calculationType mapeado cuando se filtra por biogenic', async () => {
      mockApiFetch.mockResolvedValue([]);
      await GasService.getGases(undefined, 'biogenic');
      expect(mockApiFetch).toHaveBeenCalledWith('/api/gases', {
        params: { limit: 1000, calculationType: 'Biogenic' },
      });
    });

    it('no incluye calculationType cuando el filtro es "both"', async () => {
      mockApiFetch.mockResolvedValue([]);
      await GasService.getGases(undefined, 'both');
      const params = mockApiFetch.mock.calls[0][1]?.params as Record<string, unknown>;
      expect(params).not.toHaveProperty('calculationType');
    });

    it('devuelve array vacío si la API responde null', async () => {
      mockApiFetch.mockResolvedValue(null);
      const result = await GasService.getGases();
      expect(result).toEqual([]);
    });

    it('mapea correctamente el array de respuesta', async () => {
      mockApiFetch.mockResolvedValue([mockApiGas]);
      const result = await GasService.getGases();
      expect(result).toHaveLength(1);
      expect(result[0].chemical_name).toBe('Dióxido de Carbono');
    });
  });

  // ── createGas — Bug B1 ──────────────────────────────────────────────────

  describe('createGas — Bug B1: isActive debe enviarse al backend', () => {
    it('envía isActive: false cuando el gas se crea inactivo', async () => {
      mockApiFetch.mockResolvedValue(mockApiGas);
      await GasService.createGas({
        chemical_name: 'Metano',
        formula: 'CH₄',
        gwp: 28,
        calculation_type: 'non_biogenic',
        is_active: false,
      });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toHaveProperty('isActive', false);
    });

    it('envía isActive: true cuando el gas se crea activo', async () => {
      mockApiFetch.mockResolvedValue(mockApiGas);
      await GasService.createGas({
        chemical_name: 'CO₂',
        formula: 'CO₂',
        gwp: 1,
        calculation_type: 'non_biogenic',
        is_active: true,
      });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toHaveProperty('isActive', true);
    });

    it('envía todos los campos requeridos en el body', async () => {
      mockApiFetch.mockResolvedValue(mockApiGas);
      await GasService.createGas({
        chemical_name: 'Metano',
        formula: 'CH₄',
        gwp: 28,
        calculation_type: 'biogenic',
        is_active: true,
      });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toMatchObject({
        chemicalName: 'Metano',
        formula: 'CH₄',
        gwp: 28,
        calculationType: 'Biogenic',
        isActive: true,
      });
      expect(body).toHaveProperty('code');
    });

    it('llama a POST /api/gases', async () => {
      mockApiFetch.mockResolvedValue(mockApiGas);
      await GasService.createGas({
        chemical_name: 'Test',
        formula: 'T',
        gwp: 1,
        calculation_type: 'non_biogenic',
        is_active: true,
      });
      expect(mockApiFetch).toHaveBeenCalledWith('/api/gases', expect.objectContaining({ method: 'POST' }));
    });
  });

  // ── updateGas — Bug B2 ──────────────────────────────────────────────────

  describe('updateGas — Bug B2: isActive debe enviarse al actualizar', () => {
    it('envía isActive: false cuando se desactiva el gas', async () => {
      mockApiFetch.mockResolvedValue(mockApiGas);
      await GasService.updateGas('gas-1', { is_active: false });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toHaveProperty('isActive', false);
    });

    it('envía isActive: true cuando se reactiva el gas', async () => {
      mockApiFetch.mockResolvedValue(mockApiGas);
      await GasService.updateGas('gas-1', { is_active: true });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toHaveProperty('isActive', true);
    });

    it('NO incluye isActive en el body si no se pasa el campo', async () => {
      mockApiFetch.mockResolvedValue(mockApiGas);
      await GasService.updateGas('gas-1', { chemical_name: 'Nuevo Nombre' });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).not.toHaveProperty('isActive');
    });

    it('regenera el code cuando cambia la fórmula', async () => {
      mockApiFetch.mockResolvedValue(mockApiGas);
      await GasService.updateGas('gas-1', { formula: 'CH₄' });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toHaveProperty('formula', 'CH₄');
      expect(typeof body.code).toBe('string');
    });

    it('mapea calculation_type → calculationType correctamente', async () => {
      mockApiFetch.mockResolvedValue(mockApiGas);
      await GasService.updateGas('gas-1', { calculation_type: 'biogenic' });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toHaveProperty('calculationType', 'Biogenic');
    });

    it('llama a PUT /api/gases/:id con el id correcto', async () => {
      mockApiFetch.mockResolvedValue(mockApiGas);
      await GasService.updateGas('abc-xyz', { chemical_name: 'Test' });
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/gases/abc-xyz',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // ── deleteGas ───────────────────────────────────────────────────────────

  describe('deleteGas', () => {
    it('llama a DELETE /api/gases/:id', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await GasService.deleteGas('gas-id-1');
      expect(mockApiFetch).toHaveBeenCalledWith('/api/gases/gas-id-1', { method: 'DELETE' });
    });
  });
});
