import { apiFetch } from '@/shared/lib/api-client';
import {
  ApiTipoUnidad,
  ApiGrupoEmision,
  ApiFuenteEmision,
  ApiSubfuenteEmision,
  ApiUnidadEmision,
  ApiEmissionFactor,
  CarbonFootprintAnalysisStandard,
  CreateTipoUnidadPayload,
  UpdateTipoUnidadPayload,
  CreateGrupoEmisionPayload,
  UpdateGrupoEmisionPayload,
  CreateFuenteEmisionPayload,
  UpdateFuenteEmisionPayload,
  CreateSubfuenteEmisionPayload,
  UpdateSubfuenteEmisionPayload,
  CreateUnidadEmisionPayload,
  UpdateUnidadEmisionPayload,
  CreateEmissionFactorPayload,
  UpdateEmissionFactorPayload,
} from '../types';

// ── Tipos de Unidad ──────────────────────────────────────────────────────────

export class TiposUnidadService {
  static async getAll(search?: string): Promise<ApiTipoUnidad[]> {
    const res = await apiFetch<ApiTipoUnidad[]>('/api/tipos-unidad', {
      params: { limit: 100, search },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiTipoUnidad | null> {
    return apiFetch<ApiTipoUnidad>(`/api/tipos-unidad/${id}`);
  }

  static async create(data: CreateTipoUnidadPayload): Promise<ApiTipoUnidad> {
    return apiFetch<ApiTipoUnidad>('/api/tipos-unidad', {
      method: 'POST',
      body: data,
    });
  }

  static async update(id: string, data: UpdateTipoUnidadPayload): Promise<ApiTipoUnidad> {
    return apiFetch<ApiTipoUnidad>(`/api/tipos-unidad/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/tipos-unidad/${id}`, { method: 'DELETE' });
  }
}

// ── Grupos de Emisión ────────────────────────────────────────────────────────

export class GruposEmisionService {
  static async getAll(params?: {
    standard?: CarbonFootprintAnalysisStandard;
    search?: string;
  }): Promise<ApiGrupoEmision[]> {
    const res = await apiFetch<ApiGrupoEmision[]>('/api/grupos-emision', {
      params: { limit: 100, ...params },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiGrupoEmision | null> {
    return apiFetch<ApiGrupoEmision>(`/api/grupos-emision/${id}`);
  }

  static async create(data: CreateGrupoEmisionPayload): Promise<ApiGrupoEmision> {
    return apiFetch<ApiGrupoEmision>('/api/grupos-emision', {
      method: 'POST',
      body: data,
    });
  }

  static async update(id: string, data: UpdateGrupoEmisionPayload): Promise<ApiGrupoEmision> {
    return apiFetch<ApiGrupoEmision>(`/api/grupos-emision/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/grupos-emision/${id}`, { method: 'DELETE' });
  }
}

// ── Fuentes de Emisión ───────────────────────────────────────────────────────

export class FuentesEmisionService {
  static async getAll(search?: string): Promise<ApiFuenteEmision[]> {
    const res = await apiFetch<ApiFuenteEmision[]>('/api/fuentes-emision', {
      params: { limit: 100, search },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiFuenteEmision | null> {
    return apiFetch<ApiFuenteEmision>(`/api/fuentes-emision/${id}`);
  }

  static async create(data: CreateFuenteEmisionPayload): Promise<ApiFuenteEmision> {
    return apiFetch<ApiFuenteEmision>('/api/fuentes-emision', {
      method: 'POST',
      body: data,
    });
  }

  static async update(id: string, data: UpdateFuenteEmisionPayload): Promise<ApiFuenteEmision> {
    return apiFetch<ApiFuenteEmision>(`/api/fuentes-emision/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/fuentes-emision/${id}`, { method: 'DELETE' });
  }
}

// ── Subfuentes de Emisión ────────────────────────────────────────────────────

export class SubfuentesEmisionService {
  static async getAll(fuenteEmisionId?: string): Promise<ApiSubfuenteEmision[]> {
    const res = await apiFetch<ApiSubfuenteEmision[]>('/api/subfuentes-emision', {
      params: { limit: 100, fuenteEmisionId },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiSubfuenteEmision | null> {
    return apiFetch<ApiSubfuenteEmision>(`/api/subfuentes-emision/${id}`);
  }

  static async create(data: CreateSubfuenteEmisionPayload): Promise<ApiSubfuenteEmision> {
    return apiFetch<ApiSubfuenteEmision>('/api/subfuentes-emision', {
      method: 'POST',
      body: data,
    });
  }

  static async update(
    id: string,
    data: UpdateSubfuenteEmisionPayload
  ): Promise<ApiSubfuenteEmision> {
    return apiFetch<ApiSubfuenteEmision>(`/api/subfuentes-emision/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/subfuentes-emision/${id}`, { method: 'DELETE' });
  }
}

// ── Unidades de Emisión ──────────────────────────────────────────────────────

export class UnidadesEmisionService {
  static async getAll(params?: {
    search?: string;
    tipoUnidadId?: string;
  }): Promise<ApiUnidadEmision[]> {
    const res = await apiFetch<ApiUnidadEmision[]>('/api/unidades-emision', {
      params: { limit: 100, ...params },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiUnidadEmision | null> {
    return apiFetch<ApiUnidadEmision>(`/api/unidades-emision/${id}`);
  }

  static async create(data: CreateUnidadEmisionPayload): Promise<ApiUnidadEmision> {
    return apiFetch<ApiUnidadEmision>('/api/unidades-emision', {
      method: 'POST',
      body: data,
    });
  }

  static async update(id: string, data: UpdateUnidadEmisionPayload): Promise<ApiUnidadEmision> {
    return apiFetch<ApiUnidadEmision>(`/api/unidades-emision/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/unidades-emision/${id}`, { method: 'DELETE' });
  }
}

// ── Factores de Emisión ──────────────────────────────────────────────────────

export class EmissionFactorsService {
  static async getAll(filters?: {
    anio?: number;
    grupoEmisionId?: string;
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
