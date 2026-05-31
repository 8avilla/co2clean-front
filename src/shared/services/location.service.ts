import { apiFetch } from '@/shared/lib/api-client';

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Municipality {
  id: string;
  name: string;
  code: string;
  departmentId: string;
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

export interface CreateMunicipalityPayload {
  name: string;
  code: string;
  departmentId: string;
}

export type UpdateMunicipalityPayload = Partial<CreateMunicipalityPayload>;

export class LocationService {
  // ── Departments ────────────────────────────────────────────────────────────

  static async getDepartments(search?: string): Promise<Department[]> {
    const res = await apiFetch<Department[]>('/api/departments', {
      params: { limit: 100, search },
    });
    return res ?? [];
  }

  static async getDepartmentById(id: string): Promise<Department | null> {
    return apiFetch<Department>(`/api/departments/${id}`);
  }

  static async createDepartment(data: CreateDepartmentPayload): Promise<Department> {
    return apiFetch<Department>('/api/departments', {
      method: 'POST',
      body: data,
    });
  }

  static async updateDepartment(id: string, data: UpdateDepartmentPayload): Promise<Department> {
    return apiFetch<Department>(`/api/departments/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async deleteDepartment(id: string): Promise<void> {
    await apiFetch<void>(`/api/departments/${id}`, { method: 'DELETE' });
  }

  // ── Municipalities ─────────────────────────────────────────────────────────

  static async getMunicipalities(departmentId?: string, search?: string): Promise<Municipality[]> {
    const res = await apiFetch<Municipality[]>('/api/municipalities', {
      params: { limit: 100, departmentId, search },
    });
    return res ?? [];
  }

  static async getMunicipalityById(id: string): Promise<Municipality | null> {
    return apiFetch<Municipality>(`/api/municipalities/${id}`);
  }

  static async createMunicipality(data: CreateMunicipalityPayload): Promise<Municipality> {
    return apiFetch<Municipality>('/api/municipalities', {
      method: 'POST',
      body: data,
    });
  }

  static async updateMunicipality(
    id: string,
    data: UpdateMunicipalityPayload
  ): Promise<Municipality> {
    return apiFetch<Municipality>(`/api/municipalities/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  static async deleteMunicipality(id: string): Promise<void> {
    await apiFetch<void>(`/api/municipalities/${id}`, { method: 'DELETE' });
  }
}
