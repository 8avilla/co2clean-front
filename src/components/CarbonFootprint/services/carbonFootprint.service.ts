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
        empresaId: filters.empresaId,
        anio: filters.anio,
        sedeId: filters.sedeId,
        alcanceId: filters.alcanceId,
        fuenteEmisionId: filters.fuenteEmisionId,
        subfuenteEmisionId: filters.subfuenteEmisionId,
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
        page: filters.page ?? 1,
        limit: filters.limit ?? 100,
      },
    });
    return res ?? [];
  }

  static async uploadCsv(file: File, params: UploadCsvParams): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('anio', params.anio);
    formData.append('nit', params.nit);
    formData.append('sedeId', params.sedeId);
    if (params.alcanceId) formData.append('alcanceId', params.alcanceId);
    formData.append('fuenteEmisionId', params.fuenteEmisionId);
    if (params.subfuenteEmisionId) formData.append('subfuenteEmisionId', params.subfuenteEmisionId);
    if (params.unidadEmisionId) formData.append('unidadEmisionId', params.unidadEmisionId);
    if (params.modoCarga) formData.append('modoCarga', params.modoCarga);

    await apiFetch<void>('/api/carbon-footprint/upload', {
      method: 'POST',
      body: formData,
    });
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
        empresaId: filters.empresaId,
        anio: filters.anio,
        sedeId: filters.sedeId,
        alcanceId: filters.alcanceId,
        fuenteEmisionId: filters.fuenteEmisionId,
        subfuenteEmisionId: filters.subfuenteEmisionId,
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
      },
    });
  }
}
