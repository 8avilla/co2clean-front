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

export class LocationService {
  static async getDepartments(): Promise<Department[]> {
    const res = await apiFetch<Department[]>('/api/departments', {
      params: { limit: 100 },
    });
    return res ?? [];
  }

  static async getMunicipalities(departmentId?: string): Promise<Municipality[]> {
    const res = await apiFetch<Municipality[]>('/api/municipalities', {
      params: { limit: 100, departmentId },
    });
    return res ?? [];
  }
}
