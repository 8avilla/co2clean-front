import { apiFetch } from '@/shared/lib/api-client';
import { EmissionSourceCategory } from '@/components/Settings/types';

// ── API shapes (backend camelCase) ──────────────────────────────────────────

export interface ApiEmissionGroup {
  id: string;
  name: string;
  code: string;
}

export interface ApiEmissionSourceCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  emissionGroupId: string;
  isActive: boolean;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  emissionGroup?: ApiEmissionGroup | null;
}

// ── Payload shapes ───────────────────────────────────────────────────────────

export interface CreateEmissionSourceCategoryPayload {
  name: string;
  code: string;
  description?: string;
  emissionGroupId?: string;
  icon?: string;
}

export type UpdateEmissionSourceCategoryPayload = Partial<CreateEmissionSourceCategoryPayload>;

export interface GetEmissionSourceCategoriesParams {
  emissionGroupId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Mapping ──────────────────────────────────────────────────────────────────

const mapToFront = (api: ApiEmissionSourceCategory): EmissionSourceCategory => ({
  id: api.id,
  code: api.code,
  name: api.name,
  description: api.description ?? '',
  emission_group_id: api.emissionGroupId ?? api.emissionGroup?.id ?? '',
  emission_group_name: api.emissionGroup?.name ?? '',
  is_active: api.isActive,
  icon: api.icon,
});

const mapToBack = (
  data: Partial<EmissionSourceCategory>
): UpdateEmissionSourceCategoryPayload => {
  const payload: UpdateEmissionSourceCategoryPayload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.code !== undefined) payload.code = data.code;
  if (data.description !== undefined) payload.description = data.description || undefined;
  if (data.emission_group_id !== undefined) payload.emissionGroupId = data.emission_group_id || undefined;
  if (data.icon !== undefined) payload.icon = data.icon || undefined;
  return payload;
};

// ── Service ──────────────────────────────────────────────────────────────────

export class EmissionSourceCategoryService {
  static async getCategories(params?: GetEmissionSourceCategoriesParams): Promise<EmissionSourceCategory[]> {
    const res = await apiFetch<ApiEmissionSourceCategory[]>('/api/emission-source-categories', {
      params: { limit: 1000, ...params },
    });
    return (res ?? []).map(mapToFront);
  }

  static async getCategoryById(id: string): Promise<EmissionSourceCategory | null> {
    const res = await apiFetch<ApiEmissionSourceCategory>(`/api/emission-source-categories/${id}`);
    return res ? mapToFront(res) : null;
  }

  static async createCategory(
    data: Omit<EmissionSourceCategory, 'id' | 'is_active'>
  ): Promise<EmissionSourceCategory> {
    const body: CreateEmissionSourceCategoryPayload = {
      name: data.name,
      code: data.code,
      description: data.description || undefined,
      emissionGroupId: data.emission_group_id || undefined,
      icon: data.icon || undefined,
    };
    const res = await apiFetch<ApiEmissionSourceCategory>('/api/emission-source-categories', {
      method: 'POST',
      body,
    });
    return mapToFront(res);
  }

  static async updateCategory(
    id: string,
    data: Partial<EmissionSourceCategory>
  ): Promise<EmissionSourceCategory> {
    const res = await apiFetch<ApiEmissionSourceCategory>(
      `/api/emission-source-categories/${id}`,
      { method: 'PUT', body: mapToBack(data) }
    );
    return mapToFront(res);
  }

  static async deleteCategory(id: string): Promise<void> {
    await apiFetch<void>(`/api/emission-source-categories/${id}`, { method: 'DELETE' });
  }
}
