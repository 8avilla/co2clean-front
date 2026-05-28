import { apiFetch } from '@/shared/lib/api-client';
import {
  ApiAlcance,
  ApiFuenteEmision,
  ApiSubfuenteEmision,
  ApiUnidadEmision,
  ApiEmissionFactor,
  CreateEmissionFactorPayload,
  UpdateEmissionFactorPayload,
} from '../types';

export class AlcancesService {
  static async getAll(search?: string): Promise<ApiAlcance[]> {
    const res = await apiFetch<ApiAlcance[]>('/api/alcances', {
      params: { limit: 100, search },
    });
    return res ?? [];
  }
}

export class FuentesEmisionService {
  static async getAll(search?: string): Promise<ApiFuenteEmision[]> {
    const res = await apiFetch<ApiFuenteEmision[]>('/api/fuentes-emision', {
      params: { limit: 100, search },
    });
    return res ?? [];
  }
}

export class SubfuentesEmisionService {
  static async getAll(fuenteEmisionId?: string): Promise<ApiSubfuenteEmision[]> {
    const res = await apiFetch<ApiSubfuenteEmision[]>('/api/subfuentes-emision', {
      params: { limit: 100, fuenteEmisionId },
    });
    return res ?? [];
  }
}

export class UnidadesEmisionService {
  static async getAll(search?: string): Promise<ApiUnidadEmision[]> {
    const res = await apiFetch<ApiUnidadEmision[]>('/api/unidades-emision', {
      params: { limit: 100, search },
    });
    return res ?? [];
  }
}

export class EmissionFactorsService {
  static async getAll(filters?: {
    anio?: number;
    alcanceId?: string;
    fuenteEmisionId?: string;
    subfuenteEmisionId?: string;
    search?: string;
  }): Promise<ApiEmissionFactor[]> {
    const res = await apiFetch<ApiEmissionFactor[]>('/api/emission-factors', {
      params: { limit: 100, ...filters },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiEmissionFactor | null> {
    return apiFetch<ApiEmissionFactor>(`/api/emission-factors/${id}`);
  }

  static async create(data: CreateEmissionFactorPayload): Promise<ApiEmissionFactor> {
    return apiFetch<ApiEmissionFactor>('/api/emission-factors', {
      method: 'POST',
      body: data,
    });
  }

  static async update(id: string, data: UpdateEmissionFactorPayload): Promise<ApiEmissionFactor> {
    return apiFetch<ApiEmissionFactor>(`/api/emission-factors/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/emission-factors/${id}`, { method: 'DELETE' });
  }
}
