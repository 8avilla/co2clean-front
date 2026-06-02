import { apiFetch } from '@/shared/lib/api-client';
import {
  ApiUnitType,
  ApiEmissionGroup,
  ApiEmissionSource,
  ApiEmissionSubsource,
  ApiEmissionUnit,
  ApiEmissionFactor,
  CarbonFootprintAnalysisStandard,
  CreateUnitTypePayload,
  UpdateUnitTypePayload,
  CreateEmissionGroupPayload,
  UpdateEmissionGroupPayload,
  CreateEmissionSourcePayload,
  UpdateEmissionSourcePayload,
  CreateEmissionSubsourcePayload,
  UpdateEmissionSubsourcePayload,
  CreateEmissionUnitPayload,
  UpdateEmissionUnitPayload,
  CreateEmissionFactorPayload,
  UpdateEmissionFactorPayload,
} from '../types';

// ── Unit Types ───────────────────────────────────────────────────────────────

export class UnitTypesService {
  static async getAll(search?: string): Promise<ApiUnitType[]> {
    const res = await apiFetch<ApiUnitType[]>('/api/unit-types', {
      params: { limit: 100, search },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiUnitType | null> {
    return apiFetch<ApiUnitType>(`/api/unit-types/${id}`);
  }

  static async create(data: CreateUnitTypePayload): Promise<ApiUnitType> {
    return apiFetch<ApiUnitType>('/api/unit-types', { method: 'POST', body: data });
  }

  static async update(id: string, data: UpdateUnitTypePayload): Promise<ApiUnitType> {
    return apiFetch<ApiUnitType>(`/api/unit-types/${id}`, { method: 'PUT', body: data });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/unit-types/${id}`, { method: 'DELETE' });
  }
}

// ── Emission Groups ──────────────────────────────────────────────────────────

export class EmissionGroupsService {
  static async getAll(params?: {
    standard?: CarbonFootprintAnalysisStandard;
    search?: string;
  }): Promise<ApiEmissionGroup[]> {
    const res = await apiFetch<ApiEmissionGroup[]>('/api/emission-groups', {
      params: { limit: 100, ...params },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiEmissionGroup | null> {
    return apiFetch<ApiEmissionGroup>(`/api/emission-groups/${id}`);
  }

  static async create(data: CreateEmissionGroupPayload): Promise<ApiEmissionGroup> {
    return apiFetch<ApiEmissionGroup>('/api/emission-groups', { method: 'POST', body: data });
  }

  static async update(id: string, data: UpdateEmissionGroupPayload): Promise<ApiEmissionGroup> {
    return apiFetch<ApiEmissionGroup>(`/api/emission-groups/${id}`, { method: 'PUT', body: data });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/emission-groups/${id}`, { method: 'DELETE' });
  }
}

// ── Emission Sources ─────────────────────────────────────────────────────────

export class EmissionSourcesService {
  static async getAll(params?: {
    unitTypeId?: string;
    search?: string;
  }): Promise<ApiEmissionSource[]> {
    const res = await apiFetch<ApiEmissionSource[]>('/api/emission-sources', {
      params: { limit: 100, ...params },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiEmissionSource | null> {
    return apiFetch<ApiEmissionSource>(`/api/emission-sources/${id}`);
  }

  static async create(data: CreateEmissionSourcePayload): Promise<ApiEmissionSource> {
    return apiFetch<ApiEmissionSource>('/api/emission-sources', { method: 'POST', body: data });
  }

  static async update(id: string, data: UpdateEmissionSourcePayload): Promise<ApiEmissionSource> {
    return apiFetch<ApiEmissionSource>(`/api/emission-sources/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/emission-sources/${id}`, { method: 'DELETE' });
  }
}

// ── Emission Subsources ──────────────────────────────────────────────────────

export class EmissionSubsourcesService {
  static async getAll(params?: {
    emissionSourceId?: string;
    search?: string;
  }): Promise<ApiEmissionSubsource[]> {
    const res = await apiFetch<ApiEmissionSubsource[]>('/api/emission-subsources', {
      params: { limit: 100, ...params },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiEmissionSubsource | null> {
    return apiFetch<ApiEmissionSubsource>(`/api/emission-subsources/${id}`);
  }

  static async create(data: CreateEmissionSubsourcePayload): Promise<ApiEmissionSubsource> {
    return apiFetch<ApiEmissionSubsource>('/api/emission-subsources', {
      method: 'POST',
      body: data,
    });
  }

  static async update(
    id: string,
    data: UpdateEmissionSubsourcePayload
  ): Promise<ApiEmissionSubsource> {
    return apiFetch<ApiEmissionSubsource>(`/api/emission-subsources/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/emission-subsources/${id}`, { method: 'DELETE' });
  }
}

// ── Emission Units ───────────────────────────────────────────────────────────

export class EmissionUnitsService {
  static async getAll(params?: {
    unitTypeId?: string;
    search?: string;
  }): Promise<ApiEmissionUnit[]> {
    const res = await apiFetch<ApiEmissionUnit[]>('/api/emission-units', {
      params: { limit: 100, ...params },
    });
    return res ?? [];
  }

  static async getById(id: string): Promise<ApiEmissionUnit | null> {
    return apiFetch<ApiEmissionUnit>(`/api/emission-units/${id}`);
  }

  static async create(data: CreateEmissionUnitPayload): Promise<ApiEmissionUnit> {
    return apiFetch<ApiEmissionUnit>('/api/emission-units', { method: 'POST', body: data });
  }

  static async update(id: string, data: UpdateEmissionUnitPayload): Promise<ApiEmissionUnit> {
    return apiFetch<ApiEmissionUnit>(`/api/emission-units/${id}`, { method: 'PUT', body: data });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/emission-units/${id}`, { method: 'DELETE' });
  }
}

// ── Emission Factors ─────────────────────────────────────────────────────────

export class EmissionFactorsService {
  static async getAll(filters?: {
    year?: number;
    emissionGroupId?: string;
    emissionSourceId?: string;
    emissionSubsourceId?: string;
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
    return apiFetch<ApiEmissionFactor>('/api/emission-factors', { method: 'POST', body: data });
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
