import { apiFetch } from '@/shared/lib/api-client';
import { EmissionSource, EmissionFactor } from '@/components/Settings/types';
import { ApiCommercialUnit } from '@/components/CarbonFootprint/types';

// ── API shapes (backend camelCase) ──────────────────────────────────────────

interface ApiEmissionSubsource {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  emissionSourceCategoryId?: string | null;
  unitTypeId?: string | null;
  unitType?: { id: string; name: string; code: string } | null;
  isActive: boolean;
}

interface ApiGasFactor {
  id: string;
  gasId: string;
  gas?: { id: string; chemicalName: string; formula: string; gwp: number } | null;
  factor: number;
  factorMassUnit?: string;
  emissionUnitId: string;
  emissionUnit?: { id: string; name: string; symbol: string } | null;
  uncertainty?: number;
  gwp: number;
  emissionSourceId: string;
  emissionSourceCategoryId: string;
}

export interface ApiEmissionUnit {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  unitTypeId?: string;
}

export interface ApiUnitType {
  id: string;
  name: string;
  code: string;
}

// ── Payload shapes ───────────────────────────────────────────────────────────

interface CreateEmissionSourcePayload {
  name: string;
  code: string;
  description?: string;
  emissionSourceCategoryId?: string;
  unitTypeId?: string;
}

type UpdateEmissionSourcePayload = Partial<CreateEmissionSourcePayload>;

interface CreateEmissionFactorPayload {
  gasId: string;
  factor: number;
  factorMassUnit?: string;
  emissionUnitId: string;
  uncertainty?: number;
  gwp: number;
  emissionSourceId: string;
  emissionSourceCategoryId: string;
}

type UpdateEmissionFactorPayload = Partial<CreateEmissionFactorPayload>;

export interface GetEmissionSourcesParams {
  emissionSourceCategoryId?: string;
  unitTypeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetEmissionFactorsParams {
  emissionSourceId?: string;
  emissionSourceCategoryId?: string;
  gasId?: string;
  emissionUnitId?: string;
}

// ── Mapping helpers ──────────────────────────────────────────────────────────

const mapSourceToFront = (api: ApiEmissionSubsource): EmissionSource => ({
  id: api.id,
  code: api.code,
  name: api.name,
  description: api.description ?? undefined,
  category_id: api.emissionSourceCategoryId ?? '',
  unit_type_id: api.unitTypeId ?? api.unitType?.id ?? undefined,
  measurement_type: api.unitType?.name ?? '',
  is_active: api.isActive,
});

const mapSourceToBack = (data: Partial<EmissionSource>): UpdateEmissionSourcePayload => {
  const payload: UpdateEmissionSourcePayload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.code !== undefined) payload.code = data.code;
  if (data.description !== undefined) payload.description = data.description || undefined;
  if (data.category_id !== undefined) payload.emissionSourceCategoryId = data.category_id || undefined;
  if (data.unit_type_id !== undefined) payload.unitTypeId = data.unit_type_id || undefined;
  return payload;
};

const mapFactorToFront = (api: ApiGasFactor): EmissionFactor => ({
  id: api.id,
  gas_id: api.gasId,
  gas_formula: api.gas?.formula,
  gwp: api.gwp,
  factor: api.factor,
  factor_mass_unit: (api.factorMassUnit as EmissionFactor['factor_mass_unit']) ?? 'kg',
  uncertainty: api.uncertainty,
  emission_unit_id: api.emissionUnitId,
  emission_unit_symbol: api.emissionUnit?.symbol,
  emission_source_id: api.emissionSourceId,
  emission_source_category_id: api.emissionSourceCategoryId,
});

const mapFactorToBack = (f: Omit<EmissionFactor, 'id'>): CreateEmissionFactorPayload => ({
  gasId: f.gas_id,
  factor: f.factor,
  ...(f.factor_mass_unit ? { factorMassUnit: f.factor_mass_unit } : {}),
  emissionUnitId: f.emission_unit_id,
  gwp: f.gwp,
  emissionSourceId: f.emission_source_id,
  emissionSourceCategoryId: f.emission_source_category_id,
  ...(f.uncertainty !== undefined ? { uncertainty: f.uncertainty } : {}),
});

// ── EmissionSourceService ────────────────────────────────────────────────────

export class EmissionSourceService {
  static async getSources(params?: GetEmissionSourcesParams): Promise<EmissionSource[]> {
    const res = await apiFetch<ApiEmissionSubsource[]>('/api/emission-sources', {
      params: { limit: 1000, ...params },
    });
    return (res ?? []).map(mapSourceToFront);
  }

  static async getSourceById(id: string): Promise<EmissionSource | null> {
    const res = await apiFetch<ApiEmissionSubsource>(`/api/emission-sources/${id}`);
    return res ? mapSourceToFront(res) : null;
  }

  static async createSource(data: Omit<EmissionSource, 'id'>): Promise<EmissionSource> {
    const body: CreateEmissionSourcePayload = {
      name: data.name,
      code: data.code,
      description: data.description || undefined,
      emissionSourceCategoryId: data.category_id || undefined,
      unitTypeId: data.unit_type_id || undefined,
    };
    const res = await apiFetch<ApiEmissionSubsource>('/api/emission-sources', {
      method: 'POST',
      body,
    });
    return mapSourceToFront(res);
  }

  static async updateSource(id: string, data: Partial<EmissionSource>): Promise<EmissionSource> {
    const res = await apiFetch<ApiEmissionSubsource>(`/api/emission-sources/${id}`, {
      method: 'PUT',
      body: mapSourceToBack(data),
    });
    return mapSourceToFront(res);
  }

  static async deleteSource(id: string): Promise<void> {
    await apiFetch<void>(`/api/emission-sources/${id}`, { method: 'DELETE' });
  }

  static async getCommercialUnits(sourceId: string): Promise<ApiCommercialUnit[]> {
    const res = await apiFetch<ApiCommercialUnit[]>(`/api/emission-sources/${sourceId}/units`);
    return res ?? [];
  }

  static async createCommercialUnit(
    sourceId: string,
    data: Omit<ApiCommercialUnit, 'id'>
  ): Promise<ApiCommercialUnit> {
    return apiFetch<ApiCommercialUnit>(`/api/emission-sources/${sourceId}/units`, {
      method: 'POST',
      body: data,
    });
  }

  static async updateCommercialUnit(
    sourceId: string,
    unitId: string,
    data: Partial<Omit<ApiCommercialUnit, 'id'>>
  ): Promise<ApiCommercialUnit> {
    return apiFetch<ApiCommercialUnit>(`/api/emission-sources/${sourceId}/units/${unitId}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async deleteCommercialUnit(sourceId: string, unitId: string): Promise<void> {
    await apiFetch<void>(`/api/emission-sources/${sourceId}/units/${unitId}`, { method: 'DELETE' });
  }
}

// ── EmissionFactorService ────────────────────────────────────────────────────

export class EmissionFactorService {
  static async getFactors(params?: GetEmissionFactorsParams): Promise<EmissionFactor[]> {
    const res = await apiFetch<ApiGasFactor[]>('/api/emission-factors', {
      params: { limit: 1000, ...params },
    });
    return (res ?? []).map(mapFactorToFront);
  }

  static async createFactor(data: Omit<EmissionFactor, 'id'>): Promise<EmissionFactor> {
    const res = await apiFetch<ApiGasFactor>('/api/emission-factors', {
      method: 'POST',
      body: mapFactorToBack(data),
    });
    return mapFactorToFront(res);
  }

  static async updateFactor(id: string, data: Partial<EmissionFactor>): Promise<EmissionFactor> {
    const payload: UpdateEmissionFactorPayload = {};
    if (data.gas_id !== undefined) payload.gasId = data.gas_id;
    if (data.gwp !== undefined) payload.gwp = data.gwp;
    if (data.factor !== undefined) payload.factor = data.factor;
    if (data.factor_mass_unit !== undefined) payload.factorMassUnit = data.factor_mass_unit;
    if (data.emission_unit_id !== undefined) payload.emissionUnitId = data.emission_unit_id;
    if (data.uncertainty !== undefined) payload.uncertainty = data.uncertainty;
    const res = await apiFetch<ApiGasFactor>(`/api/emission-factors/${id}`, {
      method: 'PUT',
      body: payload,
    });
    return mapFactorToFront(res);
  }

  static async deleteFactor(id: string): Promise<void> {
    await apiFetch<void>(`/api/emission-factors/${id}`, { method: 'DELETE' });
  }
}

// ── EmissionUnitService ──────────────────────────────────────────────────────

export interface GetEmissionUnitsParams {
  unitTypeId?: string;
  search?: string;
  excludeCommercial?: boolean;
  page?: number;
  limit?: number;
}

export class EmissionUnitService {
  static async getUnits(params?: GetEmissionUnitsParams): Promise<ApiEmissionUnit[]> {
    const res = await apiFetch<ApiEmissionUnit[]>('/api/emission-units', {
      params: {
        limit: params?.limit ?? 1000,
        ...(params?.unitTypeId ? { unitTypeId: params.unitTypeId } : {}),
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.page ? { page: params.page } : {}),
      },
    });
    return res ?? [];
  }

  static async create(data: { name: string; symbol: string; unitTypeId?: string; description?: string }): Promise<ApiEmissionUnit> {
    return apiFetch<ApiEmissionUnit>('/api/emission-units', { method: 'POST', body: data });
  }

  static async update(id: string, data: Partial<{ name: string; symbol: string; unitTypeId: string; description: string }>): Promise<ApiEmissionUnit> {
    return apiFetch<ApiEmissionUnit>(`/api/emission-units/${id}`, { method: 'PUT', body: data });
  }

  static async delete(id: string): Promise<void> {
    await apiFetch<void>(`/api/emission-units/${id}`, { method: 'DELETE' });
  }
}

// ── UnitTypeService ──────────────────────────────────────────────────────────

export class UnitTypeService {
  static async getUnitTypes(): Promise<ApiUnitType[]> {
    const res = await apiFetch<ApiUnitType[]>('/api/unit-types', { params: { limit: 1000 } });
    return res ?? [];
  }
}
