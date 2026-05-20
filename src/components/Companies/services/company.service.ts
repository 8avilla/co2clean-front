import { apiFetch } from '@/shared/lib/api-client';
import { ApiCompany, ApiHeadquarter, CompanyFormData, HeadquarterFormData } from '../types';

export class CompanyService {
  // ── Companies ──────────────────────────────────────────────────────────────

  static async getCompanies(search?: string): Promise<ApiCompany[]> {
    const res = await apiFetch<ApiCompany[]>('/api/companies', {
      params: { limit: 100, search },
    });
    return res ?? [];
  }

  static async getCompanyById(id: string): Promise<ApiCompany | null> {
    return apiFetch<ApiCompany>(`/api/companies/${id}`);
  }

  static async createCompany(data: CompanyFormData): Promise<ApiCompany> {
    return apiFetch<ApiCompany>('/api/companies', {
      method: 'POST',
      body: {
        name: data.name,
        nit: data.nit,
        email: data.email,
        description: data.description || undefined,
        logoUrl: data.logoUrl || undefined,
        country: data.country ?? 'Colombia',
        departmentId: data.departmentId,
        municipalityId: data.municipalityId,
        address: data.address,
      },
    });
  }

  static async updateCompany(id: string, data: Partial<CompanyFormData>): Promise<ApiCompany> {
    return apiFetch<ApiCompany>(`/api/companies/${id}`, {
      method: 'PUT',
      body: {
        name: data.name,
        nit: data.nit,
        email: data.email,
        description: data.description || undefined,
        logoUrl: data.logoUrl || undefined,
        country: data.country,
        departmentId: data.departmentId,
        municipalityId: data.municipalityId,
        address: data.address,
      },
    });
  }

  static async deleteCompany(id: string): Promise<void> {
    await apiFetch<void>(`/api/companies/${id}`, { method: 'DELETE' });
  }

  // ── Headquarters (Sedes) ───────────────────────────────────────────────────

  static async getHeadquarters(companyId?: string): Promise<ApiHeadquarter[]> {
    const res = await apiFetch<ApiHeadquarter[]>('/api/headquarters', {
      params: { limit: 100, companyId },
    });
    return res ?? [];
  }

  static async createHeadquarter(
    companyId: string,
    data: HeadquarterFormData
  ): Promise<ApiHeadquarter> {
    return apiFetch<ApiHeadquarter>('/api/headquarters', {
      method: 'POST',
      body: {
        name: data.name,
        description: data.description || undefined,
        address: data.address || undefined,
        departmentId: data.departmentId || undefined,
        municipalityId: data.municipalityId || undefined,
        companyId,
      },
    });
  }

  static async updateHeadquarter(
    id: string,
    data: Partial<HeadquarterFormData>
  ): Promise<ApiHeadquarter> {
    return apiFetch<ApiHeadquarter>(`/api/headquarters/${id}`, {
      method: 'PUT',
      body: {
        name: data.name,
        description: data.description || undefined,
        address: data.address || undefined,
        departmentId: data.departmentId || undefined,
        municipalityId: data.municipalityId || undefined,
      },
    });
  }

  static async deleteHeadquarter(id: string): Promise<void> {
    await apiFetch<void>(`/api/headquarters/${id}`, { method: 'DELETE' });
  }
}
