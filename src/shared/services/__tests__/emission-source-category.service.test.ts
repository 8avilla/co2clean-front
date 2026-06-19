import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  EmissionSourceCategoryService,
  type ApiEmissionSourceCategory,
} from '../emission-source-category.service';

vi.mock('@/shared/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/shared/lib/api-client';
const mockApiFetch = vi.mocked(apiFetch);

const mockApiCategory: ApiEmissionSourceCategory = {
  id: 'cat-1',
  name: 'Combustión Estacionaria',
  code: 'COMB_EST',
  description: 'Quema de combustibles en fuentes fijas',
  emissionGroupId: 'group-1',
  isActive: true,
};

describe('EmissionSourceCategoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── SC-01 / SC-02: mapToFront (vía getCategories) ──────────────────────

  describe('SC-01 — mapToFront mapea todos los campos correctamente', () => {
    it('mapea los campos básicos de API a front-end', async () => {
      mockApiFetch.mockResolvedValue([mockApiCategory]);
      const [result] = await EmissionSourceCategoryService.getCategories();
      expect(result).toEqual({
        id: 'cat-1',
        name: 'Combustión Estacionaria',
        code: 'COMB_EST',
        description: 'Quema de combustibles en fuentes fijas',
        emission_group_id: 'group-1',
        is_active: true,
      });
    });

    it('usa string vacío para description si la API devuelve null/undefined', async () => {
      mockApiFetch.mockResolvedValue([{ ...mockApiCategory, description: undefined }]);
      const [result] = await EmissionSourceCategoryService.getCategories();
      expect(result.description).toBe('');
    });

    it('usa string vacío para emission_group_id si faltan ambos campos', async () => {
      mockApiFetch.mockResolvedValue([
        { ...mockApiCategory, emissionGroupId: undefined, emissionGroup: undefined },
      ]);
      const [result] = await EmissionSourceCategoryService.getCategories();
      expect(result.emission_group_id).toBe('');
    });
  });

  describe('SC-02 — mapToFront usa emissionGroup.id como fallback', () => {
    it('resuelve emission_group_id desde emissionGroup.id cuando emissionGroupId no existe', async () => {
      mockApiFetch.mockResolvedValue([
        {
          ...mockApiCategory,
          emissionGroupId: undefined,
          emissionGroup: { id: 'group-fallback', name: 'Alcance 1', code: 'A1' },
        },
      ]);
      const [result] = await EmissionSourceCategoryService.getCategories();
      expect(result.emission_group_id).toBe('group-fallback');
    });

    it('prefiere emissionGroupId sobre emissionGroup.id cuando ambos existen', async () => {
      mockApiFetch.mockResolvedValue([
        {
          ...mockApiCategory,
          emissionGroupId: 'group-direct',
          emissionGroup: { id: 'group-nested', name: 'Alcance 2', code: 'A2' },
        },
      ]);
      const [result] = await EmissionSourceCategoryService.getCategories();
      expect(result.emission_group_id).toBe('group-direct');
    });
  });

  // ── SC-03 / SC-04: getCategories ───────────────────────────────────────

  describe('SC-03 — getCategories usa el endpoint correcto con limit: 1000', () => {
    it('llama a GET /api/emission-source-categories con limit 1000', async () => {
      mockApiFetch.mockResolvedValue([]);
      await EmissionSourceCategoryService.getCategories();
      expect(mockApiFetch).toHaveBeenCalledWith('/api/emission-source-categories', {
        params: { limit: 1000 },
      });
    });

    it('incluye filtros adicionales cuando se pasan parámetros', async () => {
      mockApiFetch.mockResolvedValue([]);
      await EmissionSourceCategoryService.getCategories({ emissionGroupId: 'g-1', search: 'test' });
      expect(mockApiFetch).toHaveBeenCalledWith('/api/emission-source-categories', {
        params: { limit: 1000, emissionGroupId: 'g-1', search: 'test' },
      });
    });

    it('mapea todos los elementos del array de respuesta', async () => {
      mockApiFetch.mockResolvedValue([
        mockApiCategory,
        { ...mockApiCategory, id: 'cat-2', name: 'Combustión Móvil' },
      ]);
      const result = await EmissionSourceCategoryService.getCategories();
      expect(result).toHaveLength(2);
      expect(result[1].name).toBe('Combustión Móvil');
    });
  });

  describe('SC-04 — getCategories devuelve [] si la API responde null', () => {
    it('devuelve array vacío cuando la API responde null', async () => {
      mockApiFetch.mockResolvedValue(null);
      const result = await EmissionSourceCategoryService.getCategories();
      expect(result).toEqual([]);
    });
  });

  // ── SC-05 / SC-06: createCategory ──────────────────────────────────────

  describe('SC-05 — createCategory envía emissionGroupId en camelCase', () => {
    it('envía el body con emissionGroupId camelCase', async () => {
      mockApiFetch.mockResolvedValue(mockApiCategory);
      await EmissionSourceCategoryService.createCategory({
        name: 'Combustión Móvil',
        code: 'COMB_MOV',
        description: 'Quema en vehículos',
        emission_group_id: 'group-1',
      });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toMatchObject({
        name: 'Combustión Móvil',
        code: 'COMB_MOV',
        description: 'Quema en vehículos',
        emissionGroupId: 'group-1',
      });
    });

    it('llama a POST /api/emission-source-categories', async () => {
      mockApiFetch.mockResolvedValue(mockApiCategory);
      await EmissionSourceCategoryService.createCategory({
        name: 'Test',
        code: 'TST',
        description: '',
        emission_group_id: 'g-1',
      });
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/emission-source-categories',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('devuelve la categoría mapeada a front-end', async () => {
      mockApiFetch.mockResolvedValue(mockApiCategory);
      const result = await EmissionSourceCategoryService.createCategory({
        name: 'Combustión Estacionaria',
        code: 'COMB_EST',
        description: '',
        emission_group_id: 'group-1',
      });
      expect(result.id).toBe('cat-1');
      expect(result.emission_group_id).toBe('group-1');
    });
  });

  describe('SC-06 — createCategory omite description si está vacía', () => {
    it('envía description como undefined cuando es string vacío', async () => {
      mockApiFetch.mockResolvedValue(mockApiCategory);
      await EmissionSourceCategoryService.createCategory({
        name: 'Sin descripción',
        code: 'SD',
        description: '',
        emission_group_id: 'g-1',
      });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body.description).toBeUndefined();
    });
  });

  // ── SC-07: updateCategory ───────────────────────────────────────────────

  describe('SC-07 — updateCategory llama a PUT /api/emission-source-categories/:id', () => {
    it('llama al endpoint correcto con el id', async () => {
      mockApiFetch.mockResolvedValue(mockApiCategory);
      await EmissionSourceCategoryService.updateCategory('cat-1', { name: 'Nuevo nombre' });
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/emission-source-categories/cat-1',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('mapea name y code en el body correctamente', async () => {
      mockApiFetch.mockResolvedValue(mockApiCategory);
      await EmissionSourceCategoryService.updateCategory('cat-1', {
        name: 'Nuevo nombre',
        code: 'NUEVO',
      });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toMatchObject({ name: 'Nuevo nombre', code: 'NUEVO' });
    });

    it('convierte emission_group_id a emissionGroupId en el body', async () => {
      mockApiFetch.mockResolvedValue(mockApiCategory);
      await EmissionSourceCategoryService.updateCategory('cat-1', {
        emission_group_id: 'group-new',
      });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toHaveProperty('emissionGroupId', 'group-new');
      expect(body).not.toHaveProperty('emission_group_id');
    });

    it('omite campos no definidos del payload parcial', async () => {
      mockApiFetch.mockResolvedValue(mockApiCategory);
      await EmissionSourceCategoryService.updateCategory('cat-1', { name: 'Solo nombre' });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body).toHaveProperty('name', 'Solo nombre');
      expect(body).not.toHaveProperty('code');
      expect(body).not.toHaveProperty('emissionGroupId');
    });

    it('convierte description vacía a undefined en el payload', async () => {
      mockApiFetch.mockResolvedValue(mockApiCategory);
      await EmissionSourceCategoryService.updateCategory('cat-1', { description: '' });
      const body = mockApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
      expect(body.description).toBeUndefined();
    });
  });

  // ── SC-08: deleteCategory ───────────────────────────────────────────────

  describe('SC-08 — deleteCategory llama a DELETE /api/emission-source-categories/:id', () => {
    it('llama al endpoint correcto con el id', async () => {
      mockApiFetch.mockResolvedValue(undefined);
      await EmissionSourceCategoryService.deleteCategory('cat-99');
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/emission-source-categories/cat-99',
        { method: 'DELETE' }
      );
    });
  });
});
