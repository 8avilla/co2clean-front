import { apiFetch } from '@/shared/lib/api-client';
import {
  ApiCarbonFootprintAnalysis,
  CarbonFootprintAnalysisFilters,
  CreateCarbonFootprintAnalysisPayload,
  UpdateCarbonFootprintAnalysisPayload,
} from '../types';

export class CarbonFootprintAnalysisService {
  static async getAll(
    filters?: CarbonFootprintAnalysisFilters
  ): Promise<ApiCarbonFootprintAnalysis[]> {
    const res = await apiFetch<ApiCarbonFootprintAnalysis[]>('/api/carbon-footprint-analysis', {
      params: {
        empresaId: filters?.empresaId,
        anio: filters?.anio,
        estado: filters?.estado,
        page: filters?.page ?? 1,
        limit: filters?.limit ?? 100,
      },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiCarbonFootprintAnalysis> {
    return apiFetch<ApiCarbonFootprintAnalysis>(`/api/carbon-footprint-analysis/${id}`);
  }

  static async create(
    data: CreateCarbonFootprintAnalysisPayload
  ): Promise<ApiCarbonFootprintAnalysis> {
    return apiFetch<ApiCarbonFootprintAnalysis>('/api/carbon-footprint-analysis', {
      method: 'POST',
      body: data,
    });
  }

  static async update(
    id: string,
    data: UpdateCarbonFootprintAnalysisPayload
  ): Promise<ApiCarbonFootprintAnalysis> {
    return apiFetch<ApiCarbonFootprintAnalysis>(`/api/carbon-footprint-analysis/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async initialize(id: string): Promise<ApiCarbonFootprintAnalysis> {
    return apiFetch<ApiCarbonFootprintAnalysis>(
      `/api/carbon-footprint-analysis/${id}/initialize`,
      { method: 'POST' }
    );
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/carbon-footprint-analysis/${id}`, { method: 'DELETE' });
  }
}
