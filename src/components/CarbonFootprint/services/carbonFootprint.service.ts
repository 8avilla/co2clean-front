import { apiFetch } from '@/shared/lib/api-client';
import {
  ApiCarbonFootprint,
  CarbonFootprintFilters,
  UpdateCarbonFootprintPayload,
  UploadCsvParams,
} from '../types';

export class CarbonFootprintService {
  static async getCarbonFootprints(filters: CarbonFootprintFilters): Promise<ApiCarbonFootprint[]> {
    const res = await apiFetch<ApiCarbonFootprint[]>('/api/carbon-footprint', {
      params: {
        companyId: filters.companyId,
        year: filters.year,
        headquarterId: filters.headquarterId,
        emissionGroupId: filters.emissionGroupId,
        emissionSourceId: filters.emissionSourceId,
        emissionSubsourceId: filters.emissionSubsourceId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: filters.page ?? 1,
        limit: filters.limit ?? 100,
      },
    });
    return res ?? [];
  }

  static async uploadCsv(file: File, params: UploadCsvParams): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('year', params.year);
    formData.append('nit', params.nit);
    formData.append('headquarterId', params.headquarterId);
    formData.append('emissionGroupId', params.emissionGroupId);
    formData.append('emissionSourceId', params.emissionSourceId);
    if (params.emissionSubsourceId) formData.append('emissionSubsourceId', params.emissionSubsourceId);
    if (params.emissionUnitId) formData.append('emissionUnitId', params.emissionUnitId);

    await apiFetch<void>('/api/carbon-footprint/upload', { method: 'POST', body: formData });
  }

  static async updateCarbonFootprint(
    id: string,
    data: UpdateCarbonFootprintPayload
  ): Promise<ApiCarbonFootprint> {
    return apiFetch<ApiCarbonFootprint>(`/api/carbon-footprint/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async deleteCarbonFootprint(id: string): Promise<void> {
    await apiFetch<void>(`/api/carbon-footprint/${id}`, { method: 'DELETE' });
  }

  static async deleteByFilters(
    filters: Omit<CarbonFootprintFilters, 'page' | 'limit'>
  ): Promise<void> {
    await apiFetch<void>('/api/carbon-footprint', {
      method: 'DELETE',
      params: {
        companyId: filters.companyId,
        year: filters.year,
        headquarterId: filters.headquarterId,
        emissionGroupId: filters.emissionGroupId,
        emissionSourceId: filters.emissionSourceId,
        emissionSubsourceId: filters.emissionSubsourceId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    });
  }
}
